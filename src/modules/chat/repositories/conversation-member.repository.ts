import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { BaseRepository } from '../../../core/base/base.repository';
import { ConversationMemberEntity } from '../entities/conversation-member.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ConversationMemberRepository extends BaseRepository<ConversationMemberEntity> {
  constructor(
    @InjectRepository(ConversationMemberEntity)
    repository: Repository<ConversationMemberEntity>,
  ) {
    super(repository);
  }

  addMembers(
    manager: EntityManager,
    conversationId: string,
    userIds: string[],
  ): Promise<ConversationMemberEntity[]> {
    const repository = manager.getRepository(ConversationMemberEntity);
    return repository.save(
      userIds.map((userId) => repository.create({ conversationId, userId })),
    );
  }
}
