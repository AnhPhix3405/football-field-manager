import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { BaseRepository } from '../../../core/base/base.repository';
import { PostStatus } from '../../../constants/enums/database.enums';
import { SearchPostsQueryDto } from '../dto/search-posts-query.dto';
import { PostEntity } from '../entities/post.entity';

const EARTH_RADIUS_KM = 6371;

@Injectable()
export class PostRepository extends BaseRepository<PostEntity> {
  constructor(
    @InjectRepository(PostEntity)
    repository: Repository<PostEntity>,
  ) {
    super(repository);
  }

  findOwnedById(id: string, userId: string): Promise<PostEntity | null> {
    return this.repo.findOne({ where: { id, userId } });
  }

  findByIdWithLock(
    manager: EntityManager,
    id: string,
    lock: 'pessimistic_read' | 'pessimistic_write',
  ): Promise<PostEntity | null> {
    return manager
      .getRepository(PostEntity)
      .createQueryBuilder('post')
      .setLock(lock)
      .where('post.id = :id', { id })
      .getOne();
  }

  saveInTransaction(
    manager: EntityManager,
    post: PostEntity,
  ): Promise<PostEntity> {
    return manager.getRepository(PostEntity).save(post);
  }

  softRemove(post: PostEntity): Promise<PostEntity> {
    return this.repo.softRemove(post);
  }

  async searchOpen(
    currentUserId: string,
    query: SearchPostsQueryDto,
    coordinates: { latitude: number; longitude: number } | null,
  ): Promise<{
    entities: PostEntity[];
    distances: (number | undefined)[];
    total: number;
  }> {
    const queryBuilder = this.repo
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
          radiusKm: query.radiusKm ?? 10,
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
      entities,
      distances: raw.map((row: unknown) => {
        if (
          typeof row !== 'object' ||
          row === null ||
          !('distance_km' in row) ||
          row.distance_km === undefined
        ) {
          return undefined;
        }
        return Number(row.distance_km);
      }),
      total,
    };
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
