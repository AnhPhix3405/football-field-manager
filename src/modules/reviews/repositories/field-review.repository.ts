import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import {
  FieldRatingSummaryEntity,
  FieldReviewEntity,
} from '../../entity-registry';

interface RatingStatsRow {
  count: number;
  average: number;
}

type CreateFieldReviewData = Pick<
  FieldReviewEntity,
  'fieldId' | 'reviewerId' | 'bookingId' | 'rating' | 'comment' | 'isFlagged'
>;

@Injectable()
export class FieldReviewRepository {
  constructor(private readonly dataSource: DataSource) {}

  create(manager: EntityManager, data: CreateFieldReviewData) {
    const repository = manager.getRepository(FieldReviewEntity);
    return repository.save(repository.create(data));
  }

  findAndCountByFieldId(fieldId: string, skip: number, take: number) {
    return this.dataSource.getRepository(FieldReviewEntity).findAndCount({
      where: { fieldId, isFlagged: false },
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
  }

  findSummary(fieldId: string) {
    return this.dataSource.getRepository(FieldRatingSummaryEntity).findOne({
      where: { fieldId },
    });
  }

  async getStats(
    manager: EntityManager,
    fieldId: string,
  ): Promise<RatingStatsRow> {
    const [stats] = (await manager.query(
      `SELECT COUNT(*)::int AS count, COALESCE(AVG(rating), 0)::float AS average
       FROM field_reviews WHERE field_id = $1 AND is_flagged = false`,
      [fieldId],
    )) as unknown as RatingStatsRow[];
    return stats;
  }

  async getGlobalAverage(manager: EntityManager): Promise<number> {
    const [stats] = (await manager.query(
      `SELECT COALESCE(AVG(rating), 3)::float AS average
       FROM field_reviews WHERE is_flagged = false`,
    )) as unknown as RatingStatsRow[];
    return Number(stats.average);
  }

  upsertSummary(
    manager: EntityManager,
    fieldId: string,
    average: string,
    totalReviews: number,
    bayesianScore: string,
  ): Promise<unknown> {
    return manager.query(
      `INSERT INTO field_rating_summary
        (field_id, avg_rating, total_reviews, bayesian_score, updated_at)
       VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (field_id) DO UPDATE SET
        avg_rating = EXCLUDED.avg_rating,
        total_reviews = EXCLUDED.total_reviews,
        bayesian_score = EXCLUDED.bayesian_score,
        updated_at = now()`,
      [fieldId, average, totalReviews, bayesianScore],
    );
  }
}
