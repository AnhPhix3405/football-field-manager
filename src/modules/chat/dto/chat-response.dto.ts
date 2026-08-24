import { ApiProperty } from '@nestjs/swagger';
import {
  ConversationType,
  MessageType,
} from '../../../database/entities';

export class MessageResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  conversationId: string;

  @ApiProperty({ format: 'uuid' })
  senderId: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ enum: MessageType })
  messageType: MessageType;

  @ApiProperty()
  isRead: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ConversationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: ConversationType })
  type: ConversationType;

  @ApiProperty({ format: 'uuid', nullable: true })
  relatedPostId: string | null;

  @ApiProperty({ format: 'uuid', nullable: true })
  relatedFieldId: string | null;

  @ApiProperty({ type: [String], format: 'uuid' })
  memberIds: string[];

  @ApiProperty({ type: MessageResponseDto, nullable: true })
  lastMessage: MessageResponseDto | null;

  @ApiProperty()
  createdAt: Date;
}

export class ReadReceiptResponseDto {
  @ApiProperty({ format: 'uuid' })
  conversationId: string;

  @ApiProperty({ example: 3 })
  updatedMessages: number;
}
