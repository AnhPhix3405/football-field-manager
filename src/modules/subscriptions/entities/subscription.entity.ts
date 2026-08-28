import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  SubscriptionStatus,
  TransactionStatus,
  TransactionType,
} from '../../../constants/enums/database.enums';
@Entity('subscription_plans')
export class SubscriptionPlanEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() name: string;
  @Column({ type: 'decimal', precision: 15, scale: 2 }) price: string;
  @Column({ name: 'duration_days', type: 'int' }) durationDays: number;
  @Column({ type: 'jsonb', nullable: true }) benefit: Record<
    string,
    unknown
  > | null;
  @Column({ name: 'is_active', default: true }) isActive: boolean;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
@Entity('subscriptions')
@Index(['ownerId', 'status'])
@Index('IDX_subscriptions_status_end_date', ['status', 'endDate'])
export class SubscriptionEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index('IDX_subscriptions_owner')
  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;
  @Index('IDX_subscriptions_plan')
  @Column({ name: 'plan_id', type: 'uuid' })
  planId: string;
  @Index('IDX_subscriptions_status')
  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    enumName: 'subscription_status_enum',
    default: SubscriptionStatus.PENDING_PAYMENT,
  })
  status: SubscriptionStatus;
  @Column({ name: 'start_date', type: 'date', nullable: true }) startDate:
    string | null;
  @Column({ name: 'end_date', type: 'date', nullable: true }) endDate:
    string | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
@Entity('transactions')
@Index(['type', 'refId'])
@Index('IDX_transactions_user_created', ['userId', 'createdAt'])
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ name: 'user_id', type: 'uuid' }) userId: string;
  @Column({
    type: 'enum',
    enum: TransactionType,
    enumName: 'transaction_type_enum',
  })
  type: TransactionType;
  @Index('IDX_transactions_ref_id')
  @Column({ name: 'ref_id', type: 'uuid' })
  refId: string;
  @Column({ type: 'decimal', precision: 15, scale: 2 }) amount: string;
  @Index('IDX_transactions_status')
  @Column({
    type: 'enum',
    enum: TransactionStatus,
    enumName: 'transaction_status_enum',
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;
  @Column({ type: 'varchar', nullable: true }) gateway: string | null;
  @Index('IDX_transactions_gateway_ref')
  @Column({ name: 'gateway_ref', type: 'varchar', nullable: true })
  gatewayRef: string | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
