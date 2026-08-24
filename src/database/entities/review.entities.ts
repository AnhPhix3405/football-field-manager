import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('field_reviews')
@Unique(['bookingId'])
@Check('CHK_field_reviews_rating', 'rating >= 1 AND rating <= 5')
export class FieldReviewEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ name: 'field_id', type: 'uuid' }) fieldId: string;
  @Column({ name: 'reviewer_id', type: 'uuid' }) reviewerId: string;
  @Column({ name: 'booking_id', type: 'uuid' }) bookingId: string;
  @Column({ type: 'int' }) rating: number;
  @Column({ type: 'text', nullable: true }) comment: string | null;
  @Column({ name: 'is_flagged', default: false }) isFlagged: boolean;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
}

@Entity('user_reviews')
@Unique(['targetUserId', 'reviewerId', 'postId'])
@Check('CHK_user_reviews_rating', 'rating >= 1 AND rating <= 5')
export class UserReviewEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ name: 'target_user_id', type: 'uuid' }) targetUserId: string;
  @Column({ name: 'reviewer_id', type: 'uuid' }) reviewerId: string;
  @Column({ name: 'post_id', type: 'uuid' }) postId: string;
  @Column({ type: 'int' }) rating: number;
  @Column({ type: 'text', nullable: true }) comment: string | null;
  @Column({ name: 'is_flagged', default: false }) isFlagged: boolean;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
}

@Entity('field_rating_summary')
export class FieldRatingSummaryEntity {
  @PrimaryColumn({ name: 'field_id', type: 'uuid' }) fieldId: string;
  @Column({ name: 'avg_rating', type: 'decimal', precision: 3, scale: 2, default: 0 }) avgRating: string;
  @Column({ name: 'total_reviews', type: 'int', default: 0 }) totalReviews: number;
  @Index() @Column({ name: 'bayesian_score', type: 'decimal', precision: 8, scale: 4, default: 0 }) bayesianScore: string;
  @Index() @Column() district: string;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
}

@Entity('user_rating_summary')
export class UserRatingSummaryEntity {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' }) userId: string;
  @Column({ name: 'avg_rating', type: 'decimal', precision: 3, scale: 2, default: 0 }) avgRating: string;
  @Column({ name: 'total_reviews', type: 'int', default: 0 }) totalReviews: number;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
}
