import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PostStatus,
  SkillLevel,
} from '../../../database/entities';

export class PostResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ nullable: true })
  content: string | null;

  @ApiProperty({ example: 10.7769 })
  latitude: number;

  @ApiProperty({ example: 106.7009 })
  longitude: number;

  @ApiProperty({ format: 'date' })
  playDate: string;

  @ApiProperty({ example: '18:00:00' })
  startTime: string;

  @ApiProperty({ example: '20:00:00' })
  endTime: string;

  @ApiProperty({ enum: SkillLevel, nullable: true })
  skillLevelRequired: SkillLevel | null;

  @ApiProperty({ enum: PostStatus })
  status: PostStatus;

  @ApiProperty({ example: 2 })
  playersNeeded: number;

  @ApiProperty({ example: 1 })
  acceptedPlayers: number;

  @ApiPropertyOptional({
    description: 'Distance from the selected search center in kilometers.',
    example: 3.42,
  })
  distanceKm?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedPostsResponseDto {
  @ApiProperty({ type: [PostResponseDto] })
  items: PostResponseDto[];

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}
