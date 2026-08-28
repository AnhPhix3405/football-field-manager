import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FieldEntity, UserEntity } from '../entity-registry';
import {
  ConversationEntity,
  ConversationMemberEntity,
  MessageEntity,
} from './entities';
import { AuthModule } from '../auth/auth.module';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import {
  ConversationMemberRepository,
  ConversationRepository,
} from './repositories';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConversationEntity,
      ConversationMemberEntity,
      MessageEntity,
      FieldEntity,
      UserEntity,
    ]),
    JwtModule.register({}),
    AuthModule,
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatGateway,
    ConversationRepository,
    ConversationMemberRepository,
  ],
  exports: [ChatService, ConversationRepository, ConversationMemberRepository],
})
export class ChatModule {}
