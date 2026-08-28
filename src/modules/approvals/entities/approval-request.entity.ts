import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  ApprovalStatus,
  ApprovalType,
} from '../../../constants/enums/database.enums';

@Entity('approval_requests')
@Index(['type', 'targetId'])
@Index('IDX_approval_requests_status_created', ['status', 'createdAt'])
export class ApprovalRequestEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'enum', enum: ApprovalType, enumName: 'approval_type_enum' })
  type: ApprovalType;
  @Column({ name: 'target_id', type: 'uuid' }) targetId: string;
  @Index() @Column({ name: 'requested_by', type: 'uuid' }) requestedBy: string;
  @Index('IDX_approval_requests_status')
  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    enumName: 'approval_status_enum',
    default: ApprovalStatus.PENDING,
  })
  status: ApprovalStatus;
  @Index('IDX_approval_requests_reviewed_by')
  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy: string | null;
  @Column({ type: 'text', nullable: true }) note: string | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;
}
