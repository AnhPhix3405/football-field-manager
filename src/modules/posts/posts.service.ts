import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostStatus } from '../../constants/enums/database.enums';
import { UserRepository } from '../users/repositories';
import { CreatePostDto } from './dto/create-post.dto';
import {
  PaginatedPostsResponseDto,
  PostResponseDto,
} from './dto/post-response.dto';
import { SearchPostsQueryDto } from './dto/search-posts-query.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostEntity } from './entities/post.entity';
import { PostMatchRepository, PostRepository } from './repositories';

@Injectable()
export class PostsService {
  constructor(
    private readonly postsRepository: PostRepository,
    private readonly usersRepository: UserRepository,
    private readonly matchesRepository: PostMatchRepository,
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
      maxPlayers: dto.maxPlayers,
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

    const { entities, distances, total } =
      await this.postsRepository.searchOpen(currentUserId, query, coordinates);

    return {
      items: entities.map((post, index) =>
        PostsService.toResponse(post, distances[index]),
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
    if (endTime === null) {
      throw new BadRequestException('endTime is required for an editable post');
    }
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
    if (dto.maxPlayers !== undefined) {
      const acceptedPlayers =
        await this.matchesRepository.countAcceptedByPostId(post.id);
      if (dto.maxPlayers < acceptedPlayers) {
        throw new ConflictException(
          'maxPlayers cannot be lower than the accepted application count',
        );
      }
      post.maxPlayers = dto.maxPlayers;
      if (post.status !== PostStatus.CLOSED) {
        post.status =
          acceptedPlayers >= post.maxPlayers
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

  static toResponse(post: PostEntity, distanceKm?: number): PostResponseDto {
    return {
      id: post.id,
      userId: post.userId,
      title: post.title,
      content: post.content,
      latitude: post.lat === null ? null : Number(post.lat),
      longitude: post.lng === null ? null : Number(post.lng),
      playDate: post.playDate,
      startTime: post.startTime,
      endTime: post.endTime,
      skillLevelRequired: post.skillLevelRequired,
      status: post.status,
      maxPlayers: post.maxPlayers,
      ...(distanceKm === undefined
        ? {}
        : { distanceKm: Number(distanceKm.toFixed(2)) }),
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  private async findOwnedPost(id: string, userId: string): Promise<PostEntity> {
    const post = await this.postsRepository.findOwnedById(id, userId);
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
    if (
      user?.lat !== null &&
      user?.lat !== undefined &&
      user.lng !== null &&
      user.lng !== undefined
    ) {
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
}
