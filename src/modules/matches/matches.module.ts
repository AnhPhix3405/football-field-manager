import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ConversationEntity,
  ConversationMemberEntity,
  PostEntity,
  PostMatchEntity,
} from '../../database/entities';
import { AuthModule } from '../auth/auth.module';
import {
  MatchesController,
  MyApplicationsController,
} from './matches.controller';
import { MatchesService } from './matches.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PostEntity,
      PostMatchEntity,
      ConversationEntity,
      ConversationMemberEntity,
    ]),
    AuthModule,
  ],
  controllers: [MatchesController, MyApplicationsController],
  providers: [MatchesService],
})
export class MatchesModule {}
