import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RatingSummaryResponseDto {
  @ApiProperty() averageRating: number;
  @ApiProperty() totalReviews: number;
  @ApiPropertyOptional({
    description: 'Bayesian ranking score used for fields.',
  })
  bayesianScore?: number;
}

export class FieldReviewResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) fieldId: string;
  @ApiProperty({ format: 'uuid' }) reviewerId: string;
  @ApiProperty({ format: 'uuid' }) bookingId: string;
  @ApiProperty({ minimum: 1, maximum: 5 }) rating: number;
  @ApiPropertyOptional({ nullable: true }) comment: string | null;
  @ApiProperty({ format: 'date-time' }) createdAt: Date;
  @ApiProperty({ format: 'date-time' }) updatedAt: Date;
}

export class UserReviewResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) targetUserId: string;
  @ApiProperty({ format: 'uuid' }) reviewerId: string;
  @ApiProperty({ format: 'uuid' }) postId: string;
  @ApiProperty({ minimum: 1, maximum: 5 }) rating: number;
  @ApiPropertyOptional({ nullable: true }) comment: string | null;
  @ApiProperty({ format: 'date-time' }) createdAt: Date;
  @ApiProperty({ format: 'date-time' }) updatedAt: Date;
}

export class FieldReviewCreatedResponseDto {
  @ApiProperty({ type: FieldReviewResponseDto }) review: FieldReviewResponseDto;
  @ApiProperty({ type: RatingSummaryResponseDto })
  summary: RatingSummaryResponseDto;
}

export class UserReviewCreatedResponseDto {
  @ApiProperty({ type: UserReviewResponseDto }) review: UserReviewResponseDto;
  @ApiProperty({ type: RatingSummaryResponseDto })
  summary: RatingSummaryResponseDto;
}

export class PaginatedFieldReviewsResponseDto {
  @ApiProperty({ type: [FieldReviewResponseDto] })
  items: FieldReviewResponseDto[];
  @ApiProperty({ type: RatingSummaryResponseDto })
  summary: RatingSummaryResponseDto;
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}

export class PaginatedUserReviewsResponseDto {
  @ApiProperty({ type: [UserReviewResponseDto] })
  items: UserReviewResponseDto[];
  @ApiProperty({ type: RatingSummaryResponseDto })
  summary: RatingSummaryResponseDto;
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}
