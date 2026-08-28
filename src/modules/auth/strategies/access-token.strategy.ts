import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { UserEntity, UserStatus } from '../../entity-registry';
import {
  AuthenticatedUser,
  JwtPayload,
} from '../interfaces/jwt-payload.interface';
import { getJwtPublicKey } from '../utils/jwt-key.util';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: getJwtPublicKey(),
      algorithms: ['RS256'],
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (payload.type !== 'access')
      throw new UnauthorizedException('Invalid token type');

    const user = await this.usersRepository.findOne({
      where: { id: payload.sub, status: UserStatus.ACTIVE },
    });
    if (!user) throw new UnauthorizedException('Account is not active');

    return { id: user.id, role: user.role };
  }
}
