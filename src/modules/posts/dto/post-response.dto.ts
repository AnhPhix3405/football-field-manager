import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PostStatus,
  SkillLevel,
} from '../../../constants/enums/database.enums';

export class PostResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ nullable: true })
  content: string | null;

  @ApiPropertyOptional({ example: 10.7769, nullable: true })
  latitude: number | null;

  @ApiPropertyOptional({ example: 106.7009, nullable: true })
  longitude: number | null;

  @ApiProperty({ format: 'date' })
  playDate: string;

  @ApiProperty({ example: '18:00:00' })
  startTime: string;

  @ApiPropertyOptional({ example: '20:00:00', nullable: true })
  endTime: string | null;

  @ApiProperty({ enum: SkillLevel, nullable: true })
  skillLevelRequired: SkillLevel | null;

  @ApiProperty({ enum: PostStatus })
  status: PostStatus;

  @ApiProperty({ example: 2 })
  maxPlayers: number;

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
