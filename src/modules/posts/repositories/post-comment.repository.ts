import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../../core/base/base.repository';
import { PostCommentEntity } from '../entities/post-comment.entity';

@Injectable()
export class PostCommentRepository extends BaseRepository<PostCommentEntity> {
  constructor(
    @InjectRepository(PostCommentEntity)
    repository: Repository<PostCommentEntity>,
  ) {
    super(repository);
  }
}
