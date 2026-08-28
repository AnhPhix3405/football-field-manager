import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import {
  UserRatingSummaryEntity,
  UserReviewEntity,
} from '../../entity-registry';

interface RatingStatsRow {
  count: number;
  average: number;
}

type CreateUserReviewData = Pick<
  UserReviewEntity,
  'targetUserId' | 'reviewerId' | 'postId' | 'rating' | 'comment' | 'isFlagged'
>;

@Injectable()
export class UserReviewRepository {
  constructor(private readonly dataSource: DataSource) {}

  create(manager: EntityManager, data: CreateUserReviewData) {
    const repository = manager.getRepository(UserReviewEntity);
    return repository.save(repository.create(data));
  }

  findAndCountByUserId(userId: string, skip: number, take: number) {
    return this.dataSource.getRepository(UserReviewEntity).findAndCount({
      where: { targetUserId: userId, isFlagged: false },
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
  }

  findSummary(userId: string) {
    return this.dataSource.getRepository(UserRatingSummaryEntity).findOne({
      where: { userId },
    });
  }

  async getStats(
    manager: EntityManager,
    userId: string,
  ): Promise<RatingStatsRow> {
    const [stats] = (await manager.query(
      `SELECT COUNT(*)::int AS count, COALESCE(AVG(rating), 0)::float AS average
       FROM user_reviews WHERE target_user_id = $1 AND is_flagged = false`,
      [userId],
    )) as unknown as RatingStatsRow[];
    return stats;
  }

  upsertSummary(
    manager: EntityManager,
    userId: string,
    average: string,
    totalReviews: number,
  ): Promise<unknown> {
    return manager.query(
      `INSERT INTO user_rating_summary
        (user_id, avg_rating, total_reviews, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (user_id) DO UPDATE SET
        avg_rating = EXCLUDED.avg_rating,
        total_reviews = EXCLUDED.total_reviews,
        updated_at = now()`,
      [userId, average, totalReviews],
    );
  }
}
