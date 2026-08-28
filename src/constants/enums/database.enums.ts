export enum UserRole {
  USER = 'user',
  OWNER = 'owner',
  ADMIN = 'admin',
}
export enum UserStatus {
  ACTIVE = 'active',
  BANNED = 'banned',
  PENDING = 'pending',
}
export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}
export enum FieldStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  HIDDEN = 'hidden',
  REJECTED = 'rejected',
}
export enum CourtStatus {
  ACTIVE = 'active',
  MAINTENANCE = 'maintenance',
  INACTIVE = 'inactive',
}
export enum DepositType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
}
export enum DayType {
  WEEKDAY = 'weekday',
  WEEKEND = 'weekend',
}
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}
export enum PaymentMethod {
  CASH = 'cash',
  VNPAY = 'vnpay',
}
export enum PaymentStatus {
  UNPAID = 'unpaid',
  PENDING = 'pending',
  PAID = 'paid',
  REFUNDED = 'refunded',
  FAILED = 'failed',
}
export enum PostStatus {
  OPEN = 'open',
  MATCHED = 'matched',
  CLOSED = 'closed',
}
export enum MatchStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}
export enum ConversationType {
  DIRECT = 'direct',
}
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
}
export enum NotificationType {
  BOOKING_CONFIRMED = 'booking_confirmed',
  BOOKING_REJECTED = 'booking_rejected',
  BOOKING_CANCELLED = 'booking_cancelled',
  MATCH_ACCEPTED = 'match_accepted',
  SUBSCRIPTION_EXPIRING = 'subscription_expiring',
  NEW_MESSAGE = 'new_message',
}
export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  PENDING_PAYMENT = 'pending_payment',
  CANCELLED = 'cancelled',
}
export enum TransactionType {
  SUBSCRIPTION = 'subscription',
  BOOKING_DEPOSIT = 'booking_deposit',
}
export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}
export enum ApprovalType {
  OWNER_REGISTER = 'owner_register',
  FIELD_CREATE = 'field_create',
  FIELD_UPDATE = 'field_update',
}
export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}
export enum AiFeature {
  CHATBOT = 'chatbot',
  MODERATION = 'moderation',
  MATCH_SUGGESTION = 'match_suggestion',
}
