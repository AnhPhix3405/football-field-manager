import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('post_comments')
@Index('IDX_post_comments_post_created', ['postId', 'createdAt'])
export class PostCommentEntity {
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
    name: 'user_id',
    type: 'uuid',
  })
  userId: string;

  @Column({
    type: 'text',
  })
  content: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;
}
