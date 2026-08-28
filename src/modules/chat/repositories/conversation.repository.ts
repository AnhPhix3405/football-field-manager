import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ConversationType } from '../../../constants/enums/database.enums';
import { BaseRepository } from '../../../core/base/base.repository';
import { ConversationEntity } from '../entities/conversation.entity';

@Injectable()
export class ConversationRepository extends BaseRepository<ConversationEntity> {
  constructor(
    @InjectRepository(ConversationEntity)
    repository: Repository<ConversationEntity>,
  ) {
    super(repository);
  }

  createDirectForPost(
    manager: EntityManager,
    postId: string,
  ): Promise<ConversationEntity> {
    const repository = manager.getRepository(ConversationEntity);
    return repository.save(
      repository.create({
        type: ConversationType.DIRECT,
        relatedPostId: postId,
        relatedFieldId: null,
      }),
    );
  }
}
