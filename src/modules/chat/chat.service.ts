import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, LessThan, Not, Repository } from 'typeorm';
import {
  ConversationType,
  FieldEntity,
  FieldStatus,
  UserEntity,
  UserStatus,
} from '../entity-registry';
import {
  ConversationEntity,
  ConversationMemberEntity,
  MessageEntity,
} from './entities';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { MessageHistoryQueryDto, SendMessageDto } from './dto/chat.dto';
import {
  ConversationResponseDto,
  MessageResponseDto,
  ReadReceiptResponseDto,
} from './dto/chat-response.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ConversationEntity)
    private readonly conversationsRepository: Repository<ConversationEntity>,
    @InjectRepository(ConversationMemberEntity)
    private readonly membersRepository: Repository<ConversationMemberEntity>,
    @InjectRepository(MessageEntity)
    private readonly messagesRepository: Repository<MessageEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async createFieldConversation(
    fieldId: string,
    userId: string,
  ): Promise<ConversationResponseDto> {
    const conversationId = await this.dataSource.transaction(
      async (manager) => {
        await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
          `field-chat:${fieldId}:${userId}`,
        ]);
        const field = await manager.getRepository(FieldEntity).findOne({
          where: { id: fieldId, status: FieldStatus.ACTIVE },
        });
        if (!field) throw new NotFoundException('Field not found');
        if (field.ownerId === userId) {
          throw new ForbiddenException(
            'You cannot start a conversation with yourself',
          );
        }

        const candidates = await manager
          .getRepository(ConversationEntity)
          .find({
            where: { relatedFieldId: fieldId },
          });
        if (candidates.length > 0) {
          const candidateIds = candidates.map(
            (conversation) => conversation.id,
          );
          const memberships = await manager
            .getRepository(ConversationMemberEntity)
            .find({ where: { conversationId: In(candidateIds) } });
          const existing = candidates.find((conversation) => {
            const memberIds = memberships
              .filter((member) => member.conversationId === conversation.id)
              .map((member) => member.userId);
            return (
              memberIds.length === 2 &&
              memberIds.includes(userId) &&
              memberIds.includes(field.ownerId)
            );
          });
          if (existing) return existing.id;
        }

        const conversation = await manager
          .getRepository(ConversationEntity)
          .save(
            manager.getRepository(ConversationEntity).create({
              type: ConversationType.DIRECT,
              relatedPostId: null,
              relatedFieldId: field.id,
            }),
          );
        await manager.getRepository(ConversationMemberEntity).save([
          manager.getRepository(ConversationMemberEntity).create({
            conversationId: conversation.id,
            userId,
          }),
          manager.getRepository(ConversationMemberEntity).create({
            conversationId: conversation.id,
            userId: field.ownerId,
          }),
        ]);
        return conversation.id;
      },
    );

    const conversation = await this.conversationsRepository.findOne({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return this.toConversationResponse(conversation);
  }

  async validateActiveUser(userId: string): Promise<AuthenticatedUser> {
    const user = await this.usersRepository.findOne({
      where: { id: userId, status: UserStatus.ACTIVE },
    });
    if (!user) throw new UnauthorizedException('Account is not active');
    return { id: user.id, role: user.role };
  }

  async getConversationIds(userId: string): Promise<string[]> {
    const memberships = await this.membersRepository.find({
      where: { userId, deletedAt: IsNull() },
      select: { conversationId: true },
    });
    return memberships.map((membership) => membership.conversationId);
  }

  async listConversations(userId: string): Promise<ConversationResponseDto[]> {
    const conversationIds = await this.getConversationIds(userId);
    if (conversationIds.length === 0) return [];

    const [conversations, memberships] = await Promise.all([
      this.conversationsRepository.find({
        where: { id: In(conversationIds) },
        order: { createdAt: 'DESC' },
      }),
      this.membersRepository.find({
        where: { conversationId: In(conversationIds) },
      }),
    ]);

    return Promise.all(
      conversations.map(async (conversation) => {
        const lastMessage = await this.messagesRepository.findOne({
          where: { conversationId: conversation.id },
          order: { createdAt: 'DESC' },
        });
        return {
          id: conversation.id,
          type: conversation.type,
          relatedPostId: conversation.relatedPostId,
          relatedFieldId: conversation.relatedFieldId,
          memberIds: memberships
            .filter(
              (membership) => membership.conversationId === conversation.id,
            )
            .map((membership) => membership.userId),
          lastMessage: lastMessage ? this.toMessageResponse(lastMessage) : null,
          createdAt: conversation.createdAt,
        };
      }),
    );
  }

  async getHistory(
    conversationId: string,
    userId: string,
    query: MessageHistoryQueryDto,
  ): Promise<MessageResponseDto[]> {
    await this.assertMember(conversationId, userId);
    const messages = await this.messagesRepository.find({
      where: {
        conversationId,
        ...(query.before
          ? { createdAt: LessThan(new Date(query.before)) }
          : {}),
      },
      order: { createdAt: 'DESC' },
      take: query.limit,
    });
    return messages.reverse().map((message) => this.toMessageResponse(message));
  }

  async saveMessage(
    userId: string,
    dto: SendMessageDto,
  ): Promise<MessageResponseDto> {
    await this.assertMember(dto.conversationId, userId);
    const content = dto.content.trim();
    if (!content) {
      throw new ForbiddenException('Message content cannot be empty');
    }

    const message = this.messagesRepository.create({
      conversationId: dto.conversationId,
      senderId: userId,
      content,
      messageType: dto.messageType,
    });
    return this.toMessageResponse(await this.messagesRepository.save(message));
  }

  async markRead(
    conversationId: string,
    userId: string,
  ): Promise<ReadReceiptResponseDto> {
    await this.assertMember(conversationId, userId);
    const membership = await this.membersRepository.findOne({
      where: { conversationId, userId, deletedAt: IsNull() },
    });
    if (!membership)
      throw new ForbiddenException('You are not a conversation member');

    const unreadQuery = this.messagesRepository
      .createQueryBuilder('message')
      .where('message.conversationId = :conversationId', { conversationId })
      .andWhere('message.senderId != :userId', { userId });
    if (membership.lastReadAt) {
      unreadQuery.andWhere('message.createdAt > :lastReadAt', {
        lastReadAt: membership.lastReadAt,
      });
    }
    const updatedMessages = await unreadQuery.getCount();
    await this.membersRepository.update(
      { conversationId, userId },
      { lastReadAt: new Date(), deletedAt: null },
    );
    return {
      conversationId,
      updatedMessages,
    };
  }

  async assertMember(conversationId: string, userId: string): Promise<void> {
    const [conversation, membership] = await Promise.all([
      this.conversationsRepository.findOne({
        where: { id: conversationId },
      }),
      this.membersRepository.findOne({
        where: { conversationId, userId, deletedAt: IsNull() },
      }),
    ]);
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (!membership) {
      throw new ForbiddenException('You are not a conversation member');
    }
  }

  private async toConversationResponse(
    conversation: ConversationEntity,
  ): Promise<ConversationResponseDto> {
    const [members, lastMessage] = await Promise.all([
      this.membersRepository.find({
        where: { conversationId: conversation.id },
      }),
      this.messagesRepository.findOne({
        where: { conversationId: conversation.id },
        order: { createdAt: 'DESC' },
      }),
    ]);
    return {
      id: conversation.id,
      type: conversation.type,
      relatedPostId: conversation.relatedPostId,
      relatedFieldId: conversation.relatedFieldId,
      memberIds: members.map((member) => member.userId),
      lastMessage: lastMessage ? this.toMessageResponse(lastMessage) : null,
      createdAt: conversation.createdAt,
    };
  }

  private toMessageResponse(message: MessageEntity): MessageResponseDto {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      messageType: message.messageType,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }
}
