import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PostEntity,
  PostStatus,
  UserEntity,
} from '../../database/entities';
import { CreatePostDto } from './dto/create-post.dto';
import {
  PaginatedPostsResponseDto,
  PostResponseDto,
} from './dto/post-response.dto';
import { SearchPostsQueryDto } from './dto/search-posts-query.dto';
import { UpdatePostDto } from './dto/update-post.dto';

const DEFAULT_RADIUS_KM = 10;
const EARTH_RADIUS_KM = 6371;

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postsRepository: Repository<PostEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async create(userId: string, dto: CreatePostDto): Promise<PostResponseDto> {
    this.validateTimeRange(dto.startTime, dto.endTime);

    const post = this.postsRepository.create({
      userId,
      title: dto.title.trim(),
      content: dto.content?.trim() || null,
      lat: String(dto.latitude),
      lng: String(dto.longitude),
      playDate: dto.playDate,
      startTime: dto.startTime,
      endTime: dto.endTime,
      skillLevelRequired: dto.skillLevelRequired ?? null,
      playersNeeded: dto.playersNeeded,
      acceptedPlayers: 0,
      status: PostStatus.OPEN,
    });

    return PostsService.toResponse(await this.postsRepository.save(post));
  }

  async findOne(id: string): Promise<PostResponseDto> {
    const post = await this.postsRepository.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    return PostsService.toResponse(post);
  }

  async search(
    currentUserId: string,
    query: SearchPostsQueryDto,
  ): Promise<PaginatedPostsResponseDto> {
    this.validateSearchRange(query);
    const coordinates = await this.resolveSearchCoordinates(
      currentUserId,
      query,
    );

    const queryBuilder = this.postsRepository
      .createQueryBuilder('post')
      .where('post.status = :status', { status: PostStatus.OPEN })
      .andWhere('post.userId != :currentUserId', { currentUserId })
      .andWhere('post.playDate >= CURRENT_DATE');

    if (query.playDateFrom) {
      queryBuilder.andWhere('post.playDate >= :playDateFrom', {
        playDateFrom: query.playDateFrom,
      });
    }
    if (query.playDateTo) {
      queryBuilder.andWhere('post.playDate <= :playDateTo', {
        playDateTo: query.playDateTo,
      });
    }
    if (query.startTimeFrom) {
      queryBuilder.andWhere('post.startTime >= :startTimeFrom', {
        startTimeFrom: query.startTimeFrom,
      });
    }
    if (query.endTimeTo) {
      queryBuilder.andWhere('post.endTime <= :endTimeTo', {
        endTimeTo: query.endTimeTo,
      });
    }
    if (query.skillLevel) {
      queryBuilder.andWhere('post.skillLevelRequired = :skillLevel', {
        skillLevel: query.skillLevel,
      });
    }

    if (coordinates) {
      const distanceSql = this.distanceSql();
      queryBuilder
        .addSelect(distanceSql, 'distance_km')
        .andWhere(`${distanceSql} <= :radiusKm`)
        .setParameters({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          radiusKm: query.radiusKm ?? DEFAULT_RADIUS_KM,
        })
        .orderBy('distance_km', 'ASC');
    }

    queryBuilder
      .addOrderBy('post.playDate', 'ASC')
      .addOrderBy('post.startTime', 'ASC');

    const total = await queryBuilder.getCount();
    const { entities, raw } = await queryBuilder
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getRawAndEntities();

    return {
      items: entities.map((post, index) =>
        PostsService.toResponse(
          post,
          raw[index]?.distance_km === undefined
            ? undefined
            : Number(raw[index].distance_km),
        ),
      ),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async update(
    id: string,
    userId: string,
    dto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    const post = await this.findOwnedPost(id, userId);
    const startTime = dto.startTime ?? post.startTime;
    const endTime = dto.endTime ?? post.endTime;
    this.validateTimeRange(startTime, endTime);

    if (dto.title !== undefined) post.title = dto.title.trim();
    if (dto.content !== undefined) post.content = dto.content.trim() || null;
    if (dto.latitude !== undefined) post.lat = String(dto.latitude);
    if (dto.longitude !== undefined) post.lng = String(dto.longitude);
    if (dto.playDate !== undefined) post.playDate = dto.playDate;
    if (dto.startTime !== undefined) post.startTime = dto.startTime;
    if (dto.endTime !== undefined) post.endTime = dto.endTime;
    if (dto.skillLevelRequired !== undefined) {
      post.skillLevelRequired = dto.skillLevelRequired;
    }
    if (dto.playersNeeded !== undefined) {
      if (dto.playersNeeded < post.acceptedPlayers) {
        throw new ConflictException(
          'playersNeeded cannot be lower than acceptedPlayers',
        );
      }
      post.playersNeeded = dto.playersNeeded;
      if (post.status !== PostStatus.CLOSED) {
        post.status =
          post.acceptedPlayers >= post.playersNeeded
            ? PostStatus.MATCHED
            : PostStatus.OPEN;
      }
    }

    return PostsService.toResponse(await this.postsRepository.save(post));
  }

  async remove(id: string, userId: string): Promise<void> {
    const post = await this.findOwnedPost(id, userId);
    await this.postsRepository.softRemove(post);
  }

  static toResponse(
    post: PostEntity,
    distanceKm?: number,
  ): PostResponseDto {
    return {
      id: post.id,
      userId: post.userId,
      title: post.title,
      content: post.content,
      latitude: Number(post.lat),
      longitude: Number(post.lng),
      playDate: post.playDate,
      startTime: post.startTime,
      endTime: post.endTime,
      skillLevelRequired: post.skillLevelRequired,
      status: post.status,
      playersNeeded: post.playersNeeded,
      acceptedPlayers: post.acceptedPlayers,
      ...(distanceKm === undefined
        ? {}
        : { distanceKm: Number(distanceKm.toFixed(2)) }),
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  private async findOwnedPost(
    id: string,
    userId: string,
  ): Promise<PostEntity> {
    const post = await this.postsRepository.findOne({
      where: { id, userId },
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  private async resolveSearchCoordinates(
    userId: string,
    query: SearchPostsQueryDto,
  ): Promise<{ latitude: number; longitude: number } | null> {
    const hasLatitude = query.latitude !== undefined;
    const hasLongitude = query.longitude !== undefined;
    if (hasLatitude !== hasLongitude) {
      throw new BadRequestException(
        'latitude and longitude must be provided together',
      );
    }

    if (hasLatitude && hasLongitude) {
      return {
        latitude: query.latitude as number,
        longitude: query.longitude as number,
      };
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (user?.lat !== null && user?.lat !== undefined &&
        user.lng !== null && user.lng !== undefined) {
      return { latitude: Number(user.lat), longitude: Number(user.lng) };
    }

    if (query.radiusKm !== undefined) {
      throw new BadRequestException(
        'Set a profile location or provide latitude and longitude',
      );
    }
    return null;
  }

  private validateSearchRange(query: SearchPostsQueryDto): void {
    if (
      query.playDateFrom &&
      query.playDateTo &&
      query.playDateFrom > query.playDateTo
    ) {
      throw new BadRequestException(
        'playDateFrom must be before or equal to playDateTo',
      );
    }
    if (
      query.startTimeFrom &&
      query.endTimeTo &&
      query.startTimeFrom >= query.endTimeTo
    ) {
      throw new BadRequestException(
        'startTimeFrom must be earlier than endTimeTo',
      );
    }
  }

  private validateTimeRange(startTime: string, endTime: string): void {
    if (startTime >= endTime) {
      throw new BadRequestException('startTime must be earlier than endTime');
    }
  }

  private distanceSql(): string {
    return `${EARTH_RADIUS_KM} * 2 * ASIN(SQRT(LEAST(1.0,
      POWER(SIN(RADIANS(CAST(post.lat AS double precision) - CAST(:latitude AS double precision)) / 2), 2) +
      COS(RADIANS(CAST(:latitude AS double precision))) *
      COS(RADIANS(CAST(post.lat AS double precision))) *
      POWER(SIN(RADIANS(CAST(post.lng AS double precision) - CAST(:longitude AS double precision)) / 2), 2)
    )))`;
  }
}
