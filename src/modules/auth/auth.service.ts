import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID } from 'node:crypto';
import { DataSource, IsNull, Repository } from 'typeorm';
import {
  AuthSessionEntity,
  UserEntity,
  UserProfileEntity,
  UserRole,
  UserStatus,
} from '../../database/entities';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { PasswordHasher } from './services/password-hasher.service';
import { getJwtPrivateKey, getJwtPublicKey } from './utils/jwt-key.util';

const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60;

interface RequestContext {
  userAgent: string | null;
  ipAddress: string | null;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

interface PreparedTokenPair {
  tokens: TokenPair;
  session: AuthSessionEntity;
}

@Injectable()
export class AuthService {
  private readonly accessTtlSeconds = Number(
    process.env.JWT_ACCESS_TTL_SECONDS ?? THIRTY_DAYS_IN_SECONDS,
  );
  private readonly refreshTtlSeconds = Number(
    process.env.JWT_REFRESH_TTL_SECONDS ?? THIRTY_DAYS_IN_SECONDS,
  );

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(AuthSessionEntity)
    private readonly sessionsRepository: Repository<AuthSessionEntity>,
    private readonly jwtService: JwtService,
    private readonly passwordHasher: PasswordHasher,
    private readonly dataSource: DataSource,
  ) {}

  async register(dto: RegisterDto, context: RequestContext): Promise<TokenPair> {
    const user = this.usersRepository.create({
      email: dto.email.trim().toLowerCase(),
      phone: dto.phone ?? null,
      passwordHash: this.passwordHasher.hash(dto.password),
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    });
    const prepared = await this.prepareTokenPair(user, context);

    try {
      await this.dataSource.transaction(async (manager) => {
        await manager.getRepository(UserEntity).save(user);
        await manager.getRepository(UserProfileEntity).save(
          manager.getRepository(UserProfileEntity).create({
            userId: user.id,
            fullName: dto.fullName.trim(),
          }),
        );
        await manager.getRepository(AuthSessionEntity).save(prepared.session);
      });
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Email or phone already exists');
      }
      throw error;
    }

    return prepared.tokens;
  }

  async login(dto: LoginDto, context: RequestContext): Promise<TokenPair> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('LOWER(user.email) = :email', {
        email: dto.email.trim().toLowerCase(),
      })
      .getOne();

    if (!user || !this.passwordHasher.verify(dto.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    const prepared = await this.prepareTokenPair(user, context);
    await this.sessionsRepository.save(prepared.session);
    return prepared.tokens;
  }

  async refresh(refreshToken: string, context: RequestContext): Promise<TokenPair> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const tokenHash = this.hashToken(refreshToken);

    const currentSession = await this.sessionsRepository
      .createQueryBuilder('session')
      .addSelect('session.tokenHash')
      .where('session.id = :id', { id: payload.jti })
      .andWhere('session.userId = :userId', { userId: payload.sub })
      .getOne();

    if (
      !currentSession ||
      currentSession.tokenHash !== tokenHash ||
      currentSession.revokedAt ||
      currentSession.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException('Refresh token is invalid or revoked');
    }

    const user = await this.usersRepository.findOne({
      where: { id: payload.sub, status: UserStatus.ACTIVE },
    });
    if (!user) throw new UnauthorizedException('Account is not active');

    const prepared = await this.prepareTokenPair(user, context);
    await this.dataSource.transaction(async (manager) => {
      const result = await manager.getRepository(AuthSessionEntity).update(
        { id: currentSession.id, revokedAt: IsNull() },
        {
          revokedAt: new Date(),
          replacedBySessionId: prepared.session.id,
        },
      );
      if (result.affected !== 1) {
        throw new UnauthorizedException('Refresh token was already used');
      }
      await manager.getRepository(AuthSessionEntity).save(prepared.session);
    });

    return prepared.tokens;
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;

    try {
      const payload = await this.verifyRefreshToken(refreshToken);
      await this.sessionsRepository.update(
        {
          id: payload.jti,
          userId: payload.sub,
          tokenHash: this.hashToken(refreshToken),
          revokedAt: IsNull(),
        },
        { revokedAt: new Date() },
      );
    } catch {
      // The cookie is still removed by the controller, making logout idempotent.
    }
  }

  private async prepareTokenPair(
    user: Pick<UserEntity, 'id' | 'role'>,
    context: RequestContext,
  ): Promise<PreparedTokenPair> {
    const accessJti = randomUUID();
    const refreshJti = randomUUID();
    const basePayload = { sub: user.id, role: user.role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { ...basePayload, type: 'access', jti: accessJti } satisfies JwtPayload,
        {
          privateKey: getJwtPrivateKey(),
          algorithm: 'RS256',
          expiresIn: this.accessTtlSeconds,
        },
      ),
      this.jwtService.signAsync(
        { ...basePayload, type: 'refresh', jti: refreshJti } satisfies JwtPayload,
        {
          privateKey: getJwtPrivateKey(),
          algorithm: 'RS256',
          expiresIn: this.refreshTtlSeconds,
        },
      ),
    ]);

    return {
      tokens: {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: this.accessTtlSeconds,
      },
      session: this.sessionsRepository.create({
        id: refreshJti,
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + this.refreshTtlSeconds * 1000),
        revokedAt: null,
        replacedBySessionId: null,
        userAgent: context.userAgent,
        ipAddress: context.ipAddress,
      }),
    };
  }

  private async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        publicKey: getJwtPublicKey(),
        algorithms: ['RS256'],
      });
      if (payload.type !== 'refresh' || !payload.sub || !payload.jti) {
        throw new Error('Invalid refresh token payload');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === '23505'
    );
  }
}
