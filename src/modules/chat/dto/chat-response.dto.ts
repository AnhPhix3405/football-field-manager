import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConversationType, MessageType } from '../../entity-registry';

export class MessageResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  conversationId: string;

  @ApiProperty({ format: 'uuid' })
  senderId: string;

  @ApiPropertyOptional({ nullable: true })
  content: string | null;

  @ApiProperty({ enum: MessageType })
  messageType: MessageType;

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
