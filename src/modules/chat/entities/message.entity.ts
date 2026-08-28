import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MessageType } from '../../entity-registry';

@Entity('messages')
@Index(['conversationId', 'createdAt'])
@Index('IDX_messages_conversation', ['conversationId'])
export class MessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'conversation_id',
    type: 'uuid',
  })
  conversationId: string;

  @Index()
  @Column({
    name: 'sender_id',
    type: 'uuid',
  })
  senderId: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  content: string | null;

  @Column({
    name: 'message_type',
    type: 'enum',
    enum: MessageType,
    enumName: 'message_type_enum',
    default: MessageType.TEXT,
  })
  messageType: MessageType;

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
