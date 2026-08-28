import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { BaseRepository } from '../../../core/base/base.repository';
import { MatchStatus } from '../../../constants/enums/database.enums';
import { PostMatchEntity } from '../entities/post-match.entity';

@Injectable()
export class PostMatchRepository extends BaseRepository<PostMatchEntity> {
  constructor(
    @InjectRepository(PostMatchEntity)
    repository: Repository<PostMatchEntity>,
  ) {
    super(repository);
  }

  countAcceptedByPostId(
    postId: string,
    manager?: EntityManager,
  ): Promise<number> {
    return (manager?.getRepository(PostMatchEntity) ?? this.repo).count({
      where: { postId, status: MatchStatus.ACCEPTED },
    });
  }

  findByPostId(postId: string): Promise<PostMatchEntity[]> {
    return this.repo.find({ where: { postId }, order: { createdAt: 'ASC' } });
  }

  findByApplicantId(applicantId: string): Promise<PostMatchEntity[]> {
    return this.repo.find({
      where: { applicantId },
      order: { createdAt: 'DESC' },
    });
  }

  findByIdAndPostIdWithWriteLock(
    manager: EntityManager,
    id: string,
    postId: string,
  ): Promise<PostMatchEntity | null> {
    return manager
      .getRepository(PostMatchEntity)
      .createQueryBuilder('application')
      .setLock('pessimistic_write')
      .where('application.id = :id', { id })
      .andWhere('application.postId = :postId', { postId })
      .getOne();
  }

  createPending(
    manager: EntityManager,
    postId: string,
    applicantId: string,
  ): PostMatchEntity {
    return manager.getRepository(PostMatchEntity).create({
      postId,
      applicantId,
      status: MatchStatus.PENDING,
      conversationId: null,
    });
  }

  saveInTransaction(
    manager: EntityManager,
    application: PostMatchEntity,
  ): Promise<PostMatchEntity> {
    return manager.getRepository(PostMatchEntity).save(application);
  }
}
