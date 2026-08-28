import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { PostEntity } from '../posts/entities/post.entity';
import { UserEntity, UserProfileEntity } from './entities/user.entity';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { UserRepository } from './repositories';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, UserProfileEntity, PostEntity]),
    AuthModule,
  ],
  controllers: [ProfilesController],
  providers: [ProfilesService, UserRepository],
  exports: [UserRepository],
})
export class ProfilesModule {}
