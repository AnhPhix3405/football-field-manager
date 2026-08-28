import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { EntityManager } from 'typeorm';
import {
  BookingStatus,
  BookingEntity,
  FieldEntity,
  FieldReviewEntity,
  MatchStatus,
  PostEntity,
  PostMatchEntity,
  UserEntity,
  UserReviewEntity,
  UserStatus,
} from '../entity-registry';
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
import { FieldReviewRepository } from './repositories/field-review.repository';
import { UserReviewRepository } from './repositories/user-review.repository';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly fieldReviewRepository: FieldReviewRepository,
    private readonly userReviewRepository: UserReviewRepository,
  ) {}

  async reviewField(
    bookingId: string,
    reviewerId: string,
    dto: CreateReviewDto,
  ): Promise<FieldReviewCreatedResponseDto> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        await this.lock(manager, `field-review:${bookingId}`);
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

        const review = await this.fieldReviewRepository.create(manager, {
          fieldId: field.id,
          reviewerId,
          bookingId: booking.id,
          rating: dto.rating,
          comment: dto.comment?.trim() || null,
          isFlagged: false,
        });
        const summary = await this.updateFieldSummary(manager, field.id);
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
        await this.lock(
          manager,
          `user-review:${postId}:${targetUserId}:${reviewerId}`,
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

        const review = await this.userReviewRepository.create(manager, {
          targetUserId,
          reviewerId,
          postId,
          rating: dto.rating,
          comment: dto.comment?.trim() || null,
          isFlagged: false,
        });
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
    const [[reviews, total], summary] = await Promise.all([
      this.fieldReviewRepository.findAndCountByFieldId(
        fieldId,
        (query.page - 1) * query.limit,
        query.limit,
      ),
      this.fieldReviewRepository.findSummary(fieldId),
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
    const [[reviews, total], summary] = await Promise.all([
      this.userReviewRepository.findAndCountByUserId(
        userId,
        (query.page - 1) * query.limit,
        query.limit,
      ),
      this.userReviewRepository.findSummary(userId),
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
  ): Promise<RatingSummaryResponseDto> {
    await this.lock(manager, `field-summary:${fieldId}`);
    const [fieldStats, globalAverage] = await Promise.all([
      this.fieldReviewRepository.getStats(manager, fieldId),
      this.fieldReviewRepository.getGlobalAverage(manager),
    ]);
    const count = Number(fieldStats.count);
    const average = Number(fieldStats.average);
    const minimumReviews = 5;
    const bayesian =
      (count / (count + minimumReviews)) * average +
      (minimumReviews / (count + minimumReviews)) * globalAverage;
    await this.fieldReviewRepository.upsertSummary(
      manager,
      fieldId,
      average.toFixed(2),
      count,
      bayesian.toFixed(4),
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
    await this.lock(manager, `user-summary:${userId}`);
    const stats = await this.userReviewRepository.getStats(manager, userId);
    const count = Number(stats.count);
    const average = Number(stats.average);
    await this.userReviewRepository.upsertSummary(
      manager,
      userId,
      average.toFixed(2),
      count,
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

  private lock(manager: EntityManager, key: string): Promise<unknown> {
    return manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [key]);
  }
}
