import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { ChatModule } from './modules/chat/chat.module';
import { FieldsModule } from './modules/fields/fields.module';
import { MatchesModule } from './modules/matches/matches.module';
import { PostsModule } from './modules/posts/posts.module';
import { ProfilesModule } from './modules/users/profiles.module';
import { ReviewsModule } from './modules/reviews/reviews.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    AuthModule,
    ProfilesModule,
    PostsModule,
    MatchesModule,
    ChatModule,
    FieldsModule,
    BookingsModule,
    ReviewsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
