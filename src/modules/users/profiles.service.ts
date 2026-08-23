import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  PostEntity,
  UserEntity,
  UserProfileEntity,
} from '../../database/entities';
import { PaginatedPostsResponseDto } from '../posts/dto/post-response.dto';
import { PostsService } from '../posts/posts.service';
import { PostHistoryQueryDto } from './dto/post-history-query.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(UserProfileEntity)
    private readonly profilesRepository: Repository<UserProfileEntity>,
    @InjectRepository(PostEntity)
    private readonly postsRepository: Repository<PostEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async getMyProfile(userId: string): Promise<ProfileResponseDto> {
    const [user, profile] = await Promise.all([
      this.usersRepository.findOne({ where: { id: userId } }),
      this.profilesRepository.findOne({ where: { userId } }),
    ]);

    if (!user || !profile) {
      throw new NotFoundException('Profile not found');
    }

    return this.toResponse(user, profile);
  }

  async updateMyProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    try {
      await this.dataSource.transaction(async (manager) => {
        const user = await manager
          .getRepository(UserEntity)
          .findOne({ where: { id: userId } });
        const profile = await manager
          .getRepository(UserProfileEntity)
          .findOne({ where: { userId } });

        if (!user || !profile) {
          throw new NotFoundException('Profile not found');
        }

        if (dto.phone !== undefined) user.phone = dto.phone;
        if (dto.latitude !== undefined) {
          user.lat = dto.latitude === null ? null : String(dto.latitude);
        }
        if (dto.longitude !== undefined) {
          user.lng = dto.longitude === null ? null : String(dto.longitude);
        }
        if ((user.lat === null) !== (user.lng === null)) {
          throw new BadRequestException(
            'latitude and longitude must both be set or both be null',
          );
        }
        if (dto.fullName !== undefined) profile.fullName = dto.fullName.trim();
        if (dto.avatarUrl !== undefined) profile.avatarUrl = dto.avatarUrl;
        if (dto.bio !== undefined) profile.bio = dto.bio;
        if (dto.skillLevel !== undefined) profile.skillLevel = dto.skillLevel;
        if (dto.birthday !== undefined) profile.birthday = dto.birthday;
        if (dto.gender !== undefined) profile.gender = dto.gender;

        await manager.getRepository(UserEntity).save(user);
        await manager.getRepository(UserProfileEntity).save(profile);
      });
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Phone number already exists');
      }
      throw error;
    }

    return this.getMyProfile(userId);
  }

  async getMyPostHistory(
    userId: string,
    query: PostHistoryQueryDto,
  ): Promise<PaginatedPostsResponseDto> {
    const [posts, total] = await this.postsRepository.findAndCount({
      where: {
        userId,
        ...(query.status ? { status: query.status } : {}),
      },
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return {
      items: posts.map((post) => PostsService.toResponse(post)),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  private toResponse(
    user: UserEntity,
    profile: UserProfileEntity,
  ): ProfileResponseDto {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      skillLevel: profile.skillLevel,
      birthday: profile.birthday,
      gender: profile.gender,
      latitude: user.lat === null ? null : Number(user.lat),
      longitude: user.lng === null ? null : Number(user.lng),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
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
