import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { EntityManager } from 'typeorm';
import {
  BookingEntity,
  BookingStatus,
  FieldEntity,
  FieldRatingSummaryEntity,
  FieldReviewEntity,
  MatchStatus,
  PostEntity,
  PostMatchEntity,
  UserEntity,
  UserRatingSummaryEntity,
  UserReviewEntity,
  UserStatus,
} from '../../database/entities';
import { CreateReviewDto, ReviewListQueryDto } from './dto/review.dto';
import {
  FieldReviewCreatedResponseDto,
  FieldReviewResponseDto,
  PaginatedFieldReviewsResponseDto,
  PaginatedUserReviewsResponseDto,
  RatingSummaryResponseDto,
  UserReviewCreatedResponseDto,
  UserReviewResponseDto,
} from './dto/review-response.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly dataSource: DataSource) {}

  async reviewField(
    bookingId: string,
    reviewerId: string,
    dto: CreateReviewDto,
  ): Promise<FieldReviewCreatedResponseDto> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        await manager.query(
          'SELECT pg_advisory_xact_lock(hashtext($1))',
          [`field-review:${bookingId}`],
        );
        const booking = await manager.getRepository(BookingEntity).findOne({
          where: { id: bookingId, userId: reviewerId },
        });
        if (!booking) throw new NotFoundException('Booking not found');
        if (booking.status !== BookingStatus.COMPLETED) {
          throw new ConflictException(
            'The field can only be reviewed after the booking is completed',
          );
        }
        const field = await manager.getRepository(FieldEntity).findOne({
          where: { id: booking.fieldId },
        });
        if (!field) throw new NotFoundException('Field not found');

        const review = await manager.getRepository(FieldReviewEntity).save(
          manager.getRepository(FieldReviewEntity).create({
            fieldId: field.id,
            reviewerId,
            bookingId: booking.id,
            rating: dto.rating,
            comment: dto.comment?.trim() || null,
            isFlagged: false,
          }),
        );
        const summary = await this.updateFieldSummary(
          manager,
          field.id,
          field.district,
        );
        return { review: this.toFieldReview(review), summary };
      });
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('This booking has already been reviewed');
      }
      throw error;
    }
  }

  async reviewUser(
    postId: string,
    targetUserId: string,
    reviewerId: string,
    dto: CreateReviewDto,
  ): Promise<UserReviewCreatedResponseDto> {
    if (targetUserId === reviewerId) {
      throw new ForbiddenException('You cannot review yourself');
    }
    try {
      return await this.dataSource.transaction(async (manager) => {
        await manager.query(
          'SELECT pg_advisory_xact_lock(hashtext($1))',
          [`user-review:${postId}:${targetUserId}:${reviewerId}`],
        );
        const [post, targetUser] = await Promise.all([
          manager.getRepository(PostEntity).findOne({ where: { id: postId } }),
          manager.getRepository(UserEntity).findOne({
            where: { id: targetUserId, status: UserStatus.ACTIVE },
          }),
        ]);
        if (!post) throw new NotFoundException('Post not found');
        if (!targetUser) throw new NotFoundException('Target user not found');

        const acceptedMatch =
          post.userId === reviewerId
            ? await manager.getRepository(PostMatchEntity).findOne({
                where: {
                  postId,
                  applicantId: targetUserId,
                  status: MatchStatus.ACCEPTED,
                },
              })
            : targetUserId === post.userId
              ? await manager.getRepository(PostMatchEntity).findOne({
                  where: {
                    postId,
                    applicantId: reviewerId,
                    status: MatchStatus.ACCEPTED,
                  },
                })
              : null;
        if (!acceptedMatch) {
          throw new ForbiddenException(
            'Reviews are only allowed between the post owner and an accepted opponent',
          );
        }

        const review = await manager.getRepository(UserReviewEntity).save(
          manager.getRepository(UserReviewEntity).create({
            targetUserId,
            reviewerId,
            postId,
            rating: dto.rating,
            comment: dto.comment?.trim() || null,
            isFlagged: false,
          }),
        );
        const summary = await this.updateUserSummary(manager, targetUserId);
        return { review: this.toUserReview(review), summary };
      });
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'You have already reviewed this opponent for the post',
        );
      }
      throw error;
    }
  }

  async listFieldReviews(
    fieldId: string,
    query: ReviewListQueryDto,
  ): Promise<PaginatedFieldReviewsResponseDto> {
    const field = await this.dataSource.getRepository(FieldEntity).findOne({
      where: { id: fieldId },
    });
    if (!field) throw new NotFoundException('Field not found');
    const [reviews, total, summary] = await Promise.all([
      this.dataSource.getRepository(FieldReviewEntity).find({
        where: { fieldId, isFlagged: false },
        order: { createdAt: 'DESC' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.dataSource.getRepository(FieldReviewEntity).count({
        where: { fieldId, isFlagged: false },
      }),
      this.dataSource.getRepository(FieldRatingSummaryEntity).findOne({
        where: { fieldId },
      }),
    ]);
    return {
      items: reviews.map((review) => this.toFieldReview(review)),
      summary: summary
        ? {
            averageRating: Number(summary.avgRating),
            totalReviews: summary.totalReviews,
            bayesianScore: Number(summary.bayesianScore),
          }
        : { averageRating: 0, totalReviews: 0, bayesianScore: 0 },
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async listUserReviews(
    userId: string,
    query: ReviewListQueryDto,
  ): Promise<PaginatedUserReviewsResponseDto> {
    const user = await this.dataSource.getRepository(UserEntity).findOne({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');
    const [reviews, total, summary] = await Promise.all([
      this.dataSource.getRepository(UserReviewEntity).find({
        where: { targetUserId: userId, isFlagged: false },
        order: { createdAt: 'DESC' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.dataSource.getRepository(UserReviewEntity).count({
        where: { targetUserId: userId, isFlagged: false },
      }),
      this.dataSource.getRepository(UserRatingSummaryEntity).findOne({
        where: { userId },
      }),
    ]);
    return {
      items: reviews.map((review) => this.toUserReview(review)),
      summary: summary
        ? {
            averageRating: Number(summary.avgRating),
            totalReviews: summary.totalReviews,
          }
        : { averageRating: 0, totalReviews: 0 },
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  private async updateFieldSummary(
    manager: EntityManager,
    fieldId: string,
    district: string,
  ): Promise<RatingSummaryResponseDto> {
    await manager.query(
      'SELECT pg_advisory_xact_lock(hashtext($1))',
      [`field-summary:${fieldId}`],
    );
    const [fieldStats] = (await manager.query(
      `SELECT COUNT(*)::int AS count, COALESCE(AVG(rating), 0)::float AS average
       FROM field_reviews WHERE field_id = $1 AND is_flagged = false`,
      [fieldId],
    )) as Array<{ count: number; average: number }>;
    const [globalStats] = (await manager.query(
      `SELECT COALESCE(AVG(rating), 3)::float AS average
       FROM field_reviews WHERE is_flagged = false`,
    )) as Array<{ average: number }>;
    const count = Number(fieldStats.count);
    const average = Number(fieldStats.average);
    const globalAverage = Number(globalStats.average);
    const minimumReviews = 5;
    const bayesian =
      (count / (count + minimumReviews)) * average +
      (minimumReviews / (count + minimumReviews)) * globalAverage;
    await manager.query(
      `INSERT INTO field_rating_summary
        (field_id, avg_rating, total_reviews, bayesian_score, district, updated_at)
       VALUES ($1, $2, $3, $4, $5, now())
       ON CONFLICT (field_id) DO UPDATE SET
        avg_rating = EXCLUDED.avg_rating,
        total_reviews = EXCLUDED.total_reviews,
        bayesian_score = EXCLUDED.bayesian_score,
        district = EXCLUDED.district,
        updated_at = now()`,
      [fieldId, average.toFixed(2), count, bayesian.toFixed(4), district],
    );
    return {
      averageRating: Number(average.toFixed(2)),
      totalReviews: count,
      bayesianScore: Number(bayesian.toFixed(4)),
    };
  }

  private async updateUserSummary(
    manager: EntityManager,
    userId: string,
  ): Promise<RatingSummaryResponseDto> {
    await manager.query(
      'SELECT pg_advisory_xact_lock(hashtext($1))',
      [`user-summary:${userId}`],
    );
    const [stats] = (await manager.query(
      `SELECT COUNT(*)::int AS count, COALESCE(AVG(rating), 0)::float AS average
       FROM user_reviews WHERE target_user_id = $1 AND is_flagged = false`,
      [userId],
    )) as Array<{ count: number; average: number }>;
    const count = Number(stats.count);
    const average = Number(stats.average);
    await manager.query(
      `INSERT INTO user_rating_summary
        (user_id, avg_rating, total_reviews, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (user_id) DO UPDATE SET
        avg_rating = EXCLUDED.avg_rating,
        total_reviews = EXCLUDED.total_reviews,
        updated_at = now()`,
      [userId, average.toFixed(2), count],
    );
    return {
      averageRating: Number(average.toFixed(2)),
      totalReviews: count,
    };
  }

  private toFieldReview(review: FieldReviewEntity): FieldReviewResponseDto {
    return {
      id: review.id,
      fieldId: review.fieldId,
      reviewerId: review.reviewerId,
      bookingId: review.bookingId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }

  private toUserReview(review: UserReviewEntity): UserReviewResponseDto {
    return {
      id: review.id,
      targetUserId: review.targetUserId,
      reviewerId: review.reviewerId,
      postId: review.postId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
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
