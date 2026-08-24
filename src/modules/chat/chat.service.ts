import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Not, Repository } from 'typeorm';
import {
  ConversationEntity,
  ConversationMemberEntity,
  MessageEntity,
  UserEntity,
  UserStatus,
} from '../../database/entities';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import {
  MessageHistoryQueryDto,
  SendMessageDto,
} from './dto/chat.dto';
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
  ) {}

  async validateActiveUser(userId: string): Promise<AuthenticatedUser> {
    const user = await this.usersRepository.findOne({
      where: { id: userId, status: UserStatus.ACTIVE },
    });
    if (!user) throw new UnauthorizedException('Account is not active');
    return { id: user.id, role: user.role };
  }

  async getConversationIds(userId: string): Promise<string[]> {
    const memberships = await this.membersRepository.find({
      where: { userId },
      select: { conversationId: true },
    });
    return memberships.map((membership) => membership.conversationId);
  }

  async listConversations(
    userId: string,
  ): Promise<ConversationResponseDto[]> {
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
              (membership) =>
                membership.conversationId === conversation.id,
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
      isRead: false,
    });
    return this.toMessageResponse(
      await this.messagesRepository.save(message),
    );
  }

  async markRead(
    conversationId: string,
    userId: string,
  ): Promise<ReadReceiptResponseDto> {
    await this.assertMember(conversationId, userId);
    const result = await this.messagesRepository.update(
      {
        conversationId,
        senderId: Not(userId),
        isRead: false,
      },
      { isRead: true },
    );
    return {
      conversationId,
      updatedMessages: result.affected ?? 0,
    };
  }

  async assertMember(conversationId: string, userId: string): Promise<void> {
    const [conversation, membership] = await Promise.all([
      this.conversationsRepository.findOne({
        where: { id: conversationId },
      }),
      this.membersRepository.findOne({
        where: { conversationId, userId },
      }),
    ]);
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (!membership) {
      throw new ForbiddenException('You are not a conversation member');
    }
  }

  private toMessageResponse(message: MessageEntity): MessageResponseDto {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      messageType: message.messageType,
      isRead: message.isRead,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }
}
