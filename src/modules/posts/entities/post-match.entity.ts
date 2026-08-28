import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { MatchStatus } from '../../../constants/enums/database.enums';

@Entity('post_matches')
@Unique(['postId', 'applicantId'])
@Index('IDX_post_matches_post_status', ['postId', 'status'])
export class PostMatchEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({
    name: 'post_id',
    type: 'uuid',
  })
  postId: string;

  @Index()
  @Column({
    name: 'applicant_id',
    type: 'uuid',
  })
  applicantId: string;

  @Column({
    type: 'enum',
    enum: MatchStatus,
    enumName: 'match_status_enum',
    default: MatchStatus.PENDING,
  })
  status: MatchStatus;

  @Column({
    name: 'conversation_id',
    type: 'uuid',
    nullable: true,
  })
  conversationId: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt: Date;
}
