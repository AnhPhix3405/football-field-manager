import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MessageType } from '../../entity-registry';

export class ConversationEventDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  conversationId: string;
}

export class SendMessageDto extends ConversationEventDto {
  @ApiProperty({ example: 'See you at the field!', maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  content: string;

  @ApiPropertyOptional({
    enum: MessageType,
    default: MessageType.TEXT,
  })
  @IsOptional()
  @IsEnum(MessageType)
  messageType = MessageType.TEXT;
}

export class MessageHistoryQueryDto {
  @ApiPropertyOptional({
    description: 'Return messages created before this timestamp.',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  before?: string;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;
}
