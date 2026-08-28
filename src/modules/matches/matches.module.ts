import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';
import { PostsModule } from '../posts/posts.module';
import {
  MatchesController,
  MyApplicationsController,
} from './matches.controller';
import { MatchesService } from './matches.service';

@Module({
  imports: [AuthModule, PostsModule, ChatModule],
  controllers: [MatchesController, MyApplicationsController],
  providers: [MatchesService],
})
export class MatchesModule {}
