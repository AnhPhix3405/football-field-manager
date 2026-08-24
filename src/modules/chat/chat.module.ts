import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ConversationEntity,
  ConversationMemberEntity,
  MessageEntity,
  UserEntity,
} from '../../database/entities';
import { AuthModule } from '../auth/auth.module';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConversationEntity,
      ConversationMemberEntity,
      MessageEntity,
      UserEntity,
    ]),
    JwtModule.register({}),
    AuthModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}
