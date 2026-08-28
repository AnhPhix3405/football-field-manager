import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ProfilesModule } from '../users/profiles.module';
import { POST_ENTITIES } from './entities';
import { PostsController } from './posts.controller';
import {
  PostCommentRepository,
  PostMatchRepository,
  PostRepository,
} from './repositories';
import { PostsService } from './posts.service';

@Module({
  imports: [
    TypeOrmModule.forFeature(POST_ENTITIES),
    AuthModule,
    ProfilesModule,
  ],
  controllers: [PostsController],
  providers: [
    PostsService,
    PostRepository,
    PostCommentRepository,
    PostMatchRepository,
  ],
  exports: [PostsService, PostRepository, PostMatchRepository],
})
export class PostsModule {}
