import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AiFeature } from '../../../constants/enums/database.enums';

@Entity('ai_usage_logs')
@Index(['userId', 'feature', 'createdAt'])
@Index('IDX_ai_usage_logs_user_created', ['userId', 'createdAt'])
export class AiUsageLogEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index('IDX_ai_usage_logs_user')
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;
  @Index('IDX_ai_usage_logs_feature')
  @Column({ type: 'enum', enum: AiFeature, enumName: 'ai_feature_enum' })
  feature: AiFeature;
  @Column({ name: 'tokens_used', type: 'int', default: 0 }) tokensUsed: number;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
