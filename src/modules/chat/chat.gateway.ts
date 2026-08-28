import { UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import type {
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';
import type {
  AuthenticatedUser,
  JwtPayload,
} from '../auth/interfaces/jwt-payload.interface';
import { getJwtPublicKey } from '../auth/utils/jwt-key.util';
import { ChatService } from './chat.service';
import { ConversationEventDto, SendMessageDto } from './dto/chat.dto';

type ChatSocket = Socket & {
  data: {
    user?: AuthenticatedUser;
  };
};

const allowedOrigins = (
  process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://localhost:3001'
)
  .split(',')
  .map((origin) => origin.trim());

@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) => new WsException(errors),
  }),
)
@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Namespace;

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(client: ChatSocket): Promise<void> {
    try {
      const token = this.extractToken(client);
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        publicKey: getJwtPublicKey(),
        algorithms: ['RS256'],
      });
      if (payload.type !== 'access' || !payload.sub) {
        throw new Error('Invalid access token');
      }

      client.data.user = await this.chatService.validateActiveUser(payload.sub);
      const conversationIds = await this.chatService.getConversationIds(
        payload.sub,
      );
      await Promise.all(
        conversationIds.map((id) => client.join(this.conversationRoom(id))),
      );
    } catch (error: unknown) {
      client.emit('auth:error', {
        message: error instanceof Error ? error.message : 'Unauthorized',
      });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: ChatSocket): void {
    void client;
  }

  @SubscribeMessage('conversation:join')
  joinConversation(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() dto: ConversationEventDto,
  ): Promise<{ conversationId: string; joined: true }> {
    return this.handleWs(async () => {
      const user = this.requireUser(client);
      await this.chatService.assertMember(dto.conversationId, user.id);
      await client.join(this.conversationRoom(dto.conversationId));
      return { conversationId: dto.conversationId, joined: true };
    });
  }

  @SubscribeMessage('message:send')
  sendMessage(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() dto: SendMessageDto,
  ) {
    return this.handleWs(async () => {
      const user = this.requireUser(client);
      const message = await this.chatService.saveMessage(user.id, dto);
      const room = this.conversationRoom(dto.conversationId);
      await client.join(room);
      this.server.to(room).emit('message:new', message);
      return message;
    });
  }

  @SubscribeMessage('message:read')
  markRead(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() dto: ConversationEventDto,
  ) {
    return this.handleWs(async () => {
      const user = this.requireUser(client);
      const receipt = await this.chatService.markRead(
        dto.conversationId,
        user.id,
      );
      this.server
        .to(this.conversationRoom(dto.conversationId))
        .emit('message:read', { ...receipt, readByUserId: user.id });
      return receipt;
    });
  }

  private requireUser(client: ChatSocket): AuthenticatedUser {
    if (!client.data.user) throw new WsException('Unauthorized');
    return client.data.user;
  }

  private extractToken(client: ChatSocket): string {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken) return authToken;

    const authorization = client.handshake.headers.authorization;
    if (
      typeof authorization === 'string' &&
      authorization.startsWith('Bearer ')
    ) {
      return authorization.slice(7);
    }
    throw new Error('Access token is required');
  }

  private conversationRoom(conversationId: string): string {
    return `conversation:${conversationId}`;
  }

  private async handleWs<T>(action: () => Promise<T>): Promise<T> {
    try {
      return await action();
    } catch (error: unknown) {
      if (error instanceof WsException) throw error;
      throw new WsException(
        error instanceof Error ? error.message : 'WebSocket request failed',
      );
    }
  }
}
