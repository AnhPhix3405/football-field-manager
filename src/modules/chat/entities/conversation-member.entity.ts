import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';

@Entity('conversation_members')
@Index('IDX_conversation_members_user', ['userId'])
@Index('IDX_conversation_members_user_deleted', ['userId', 'deletedAt'])
export class ConversationMemberEntity {
  @PrimaryColumn({
    name: 'conversation_id',
    type: 'uuid',
  })
  conversationId: string;

  @PrimaryColumn({
    name: 'user_id',
    type: 'uuid',
  })
  userId: string;

  @CreateDateColumn({
    name: 'joined_at',
    type: 'timestamptz',
  })
  joinedAt: Date;

  @Column({
    name: 'deleted_at',
    type: 'timestamptz',
    nullable: true,
  })
  deletedAt: Date | null;

  @Column({
    name: 'last_read_at',
    type: 'timestamptz',
    nullable: true,
  })
  lastReadAt: Date | null;
}
