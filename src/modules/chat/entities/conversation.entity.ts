import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ConversationType } from '../../../constants/enums/database.enums';

@Entity('conversations')
export class ConversationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ConversationType,
    enumName: 'conversation_type_enum',
    default: ConversationType.DIRECT,
  })
  type: ConversationType;

  @Index()
  @Column({
    name: 'related_post_id',
    type: 'uuid',
    nullable: true,
  })
  relatedPostId: string | null;

  @Index()
  @Column({
    name: 'related_field_id',
    type: 'uuid',
    nullable: true,
  })
  relatedFieldId: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;
}
