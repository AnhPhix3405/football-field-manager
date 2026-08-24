import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
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
import { CreateReviewDto, ReviewListQueryDto } from './dto/review.dto';
import {
  FieldReviewCreatedResponseDto,
  PaginatedFieldReviewsResponseDto,
  PaginatedUserReviewsResponseDto,
  UserReviewCreatedResponseDto,
} from './dto/review-response.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('fields/:bookingId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Review a field after an owned booking is completed' })
  @ApiParam({ name: 'bookingId', format: 'uuid' })
  @ApiCreatedResponse({ type: FieldReviewCreatedResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  @ApiConflictResponse({ type: ApiErrorResponseDto })
  reviewField(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReviewDto,
  ): Promise<FieldReviewCreatedResponseDto> {
    return this.reviewsService.reviewField(bookingId, user.id, dto);
  }

  @Post('users/:postId/:targetUserId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Review an opponent after an application has been accepted',
  })
  @ApiParam({ name: 'postId', format: 'uuid' })
  @ApiParam({ name: 'targetUserId', format: 'uuid' })
  @ApiCreatedResponse({ type: UserReviewCreatedResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  @ApiConflictResponse({ type: ApiErrorResponseDto })
  reviewUser(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Param('targetUserId', ParseUUIDPipe) targetUserId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReviewDto,
  ): Promise<UserReviewCreatedResponseDto> {
    return this.reviewsService.reviewUser(postId, targetUserId, user.id, dto);
  }

  @Get('fields/:fieldId')
  @ApiOperation({ summary: 'List public field reviews and rating summary' })
  @ApiParam({ name: 'fieldId', format: 'uuid' })
  @ApiOkResponse({ type: PaginatedFieldReviewsResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  listFieldReviews(
    @Param('fieldId', ParseUUIDPipe) fieldId: string,
    @Query() query: ReviewListQueryDto,
  ): Promise<PaginatedFieldReviewsResponseDto> {
    return this.reviewsService.listFieldReviews(fieldId, query);
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'List public opponent reviews and rating summary' })
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiOkResponse({ type: PaginatedUserReviewsResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  listUserReviews(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: ReviewListQueryDto,
  ): Promise<PaginatedUserReviewsResponseDto> {
    return this.reviewsService.listUserReviews(userId, query);
  }
}
