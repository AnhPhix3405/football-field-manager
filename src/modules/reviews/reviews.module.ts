import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ReviewsController } from './reviews.controller';
import { FieldReviewRepository } from './repositories/field-review.repository';
import { UserReviewRepository } from './repositories/user-review.repository';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [AuthModule],
  controllers: [ReviewsController],
  providers: [ReviewsService, FieldReviewRepository, UserReviewRepository],
  exports: [ReviewsService],
})
export class ReviewsModule {}
