export * from '../constants/enums/database.enums';
export * from './users/entities/user.entity';
export * from './auth/entities/auth-session.entity';
export * from './fields/entities/field.entity';
export * from './bookings/entities';
export * from './posts/entities';
export * from './chat/entities';
export * from './subscriptions/entities/subscription.entity';
export * from './reviews/entities/review.entity';
export * from './notifications/entities/notification.entity';
export * from './approvals/entities/approval-request.entity';
export * from './ai-usage/entities/ai-usage-log.entity';

import { AiUsageLogEntity } from './ai-usage/entities/ai-usage-log.entity';
import { ApprovalRequestEntity } from './approvals/entities/approval-request.entity';
import { AuthSessionEntity } from './auth/entities/auth-session.entity';
import { BookingEntity, BookingServiceEntity } from './bookings/entities';
import {
  ConversationEntity,
  ConversationMemberEntity,
  MessageEntity,
} from './chat/entities';
import {
  FieldBlockedSlotEntity,
  FieldCourtEntity,
  FieldEntity,
  FieldImageEntity,
  FieldOpeningHoursEntity,
  FieldPricingEntity,
  FieldServiceEntity,
} from './fields/entities/field.entity';
import { NotificationEntity } from './notifications/entities/notification.entity';

import {
  PostCommentEntity,
  PostEntity,
  PostMatchEntity,
} from './posts/entities';
import {
  FieldRatingSummaryEntity,
  FieldReviewEntity,
  UserRatingSummaryEntity,
  UserReviewEntity,
} from './reviews/entities/review.entity';
import {
  SubscriptionEntity,
  SubscriptionPlanEntity,
  TransactionEntity,
} from './subscriptions/entities/subscription.entity';
import {
  OwnerProfileEntity,
  UserEntity,
  UserProfileEntity,
} from './users/entities/user.entity';

export const DATABASE_ENTITIES = [
  UserEntity,
  UserProfileEntity,
  OwnerProfileEntity,
  AuthSessionEntity,
  FieldEntity,
  FieldCourtEntity,
  FieldImageEntity,
  FieldServiceEntity,
  FieldPricingEntity,
  FieldOpeningHoursEntity,
  FieldBlockedSlotEntity,
  BookingEntity,
  BookingServiceEntity,
  PostEntity,
  PostCommentEntity,
  PostMatchEntity,
  ConversationEntity,
  ConversationMemberEntity,
  MessageEntity,
  SubscriptionPlanEntity,
  SubscriptionEntity,
  TransactionEntity,
  NotificationEntity,
  ApprovalRequestEntity,
  AiUsageLogEntity,
  FieldReviewEntity,
  UserReviewEntity,
  FieldRatingSummaryEntity,
  UserRatingSummaryEntity,
];
