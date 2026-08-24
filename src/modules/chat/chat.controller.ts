import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../../core/dto/api-error-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { ChatService } from './chat.service';
import { MessageHistoryQueryDto } from './dto/chat.dto';
import {
  ConversationResponseDto,
  MessageResponseDto,
  ReadReceiptResponseDto,
} from './dto/chat-response.dto';

@ApiTags('Chat')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({
  description: 'The access token is missing, invalid, or expired.',
  type: ApiErrorResponseDto,
})
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('fields/:fieldId')
  @ApiOperation({
    summary: 'Create or reuse a direct conversation with a field owner',
  })
  @ApiParam({ name: 'fieldId', format: 'uuid' })
  @ApiCreatedResponse({ type: ConversationResponseDto })
  @ApiForbiddenResponse({
    description: 'The authenticated user owns the field.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  @ApiConflictResponse({ type: ApiErrorResponseDto })
  createFieldConversation(
    @Param('fieldId', ParseUUIDPipe) fieldId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ConversationResponseDto> {
    return this.chatService.createFieldConversation(fieldId, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List the authenticated user conversations' })
  @ApiOkResponse({ type: [ConversationResponseDto] })
  list(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ConversationResponseDto[]> {
    return this.chatService.listConversations(user.id);
  }

  @Get(':conversationId/messages')
  @ApiOperation({ summary: 'Read paginated message history' })
  @ApiParam({ name: 'conversationId', format: 'uuid' })
  @ApiOkResponse({ type: [MessageResponseDto] })
  @ApiBadRequestResponse({
    description: 'The conversation id or query is invalid.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'The user is not a conversation member.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  history(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: MessageHistoryQueryDto,
  ): Promise<MessageResponseDto[]> {
    return this.chatService.getHistory(conversationId, user.id, query);
  }

  @Patch(':conversationId/read')
  @ApiOperation({ summary: 'Mark received messages as read' })
  @ApiParam({ name: 'conversationId', format: 'uuid' })
  @ApiOkResponse({ type: ReadReceiptResponseDto })
  @ApiBadRequestResponse({
    description: 'The conversation id is not a valid UUID.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'The user is not a conversation member.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  markRead(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReadReceiptResponseDto> {
    return this.chatService.markRead(conversationId, user.id);
  }
}
