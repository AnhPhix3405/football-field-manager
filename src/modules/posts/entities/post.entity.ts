import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import {
  PostStatus,
  SkillLevel,
} from '../../../constants/enums/database.enums';

@Entity('posts')
@Index(['lat', 'lng'])
@Index('IDX_posts_status_created', ['status', 'createdAt'])
@Index('IDX_posts_status_play_date', ['status', 'playDate'])
export class PostEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  lat: string | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  lng: string | null;

  @Index()
  @Column({
    name: 'play_date',
    type: 'date',
  })
  playDate: string;

  @Column({
    name: 'start_time',
    type: 'time',
  })
  startTime: string;

  @Column({
    name: 'end_time',
    type: 'time',
    nullable: true,
  })
  endTime: string | null;

  @Column({
    name: 'skill_level_required',
    type: 'enum',
    enum: SkillLevel,
    enumName: 'post_skill_level_enum',
    nullable: true,
  })
  skillLevelRequired: SkillLevel | null;

  @Column({
    name: 'max_players',
    type: 'integer',
  })
  maxPlayers: number;

  @Index('IDX_posts_status')
  @Column({
    type: 'enum',
    enum: PostStatus,
    enumName: 'post_status_enum',
    default: PostStatus.OPEN,
  })
  status: PostStatus;

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

  @Index('IDX_posts_deleted_at')
  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    nullable: true,
  })
  deletedAt: Date | null;
}
