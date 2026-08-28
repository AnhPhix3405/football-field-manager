import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { SkillLevel } from '../../../constants/enums/database.enums';

export class CreatePostDto {
  @ApiProperty({
    example: 'Looking for a 5-a-side opponent',
    minLength: 5,
    maxLength: 150,
  })
  @IsString()
  @Length(5, 150)
  title: string;

  @ApiPropertyOptional({
    example: 'Friendly match near District 1.',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  content?: string;

  @ApiProperty({ example: 10.7769, minimum: -90, maximum: 90 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 106.7009, minimum: -180, maximum: 180 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({ example: '2026-09-01', format: 'date' })
  @IsDateString()
  playDate: string;

  @ApiProperty({ example: '18:00', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime: string;

  @ApiProperty({ example: '20:00', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime: string;

  @ApiPropertyOptional({
    enum: SkillLevel,
    example: SkillLevel.INTERMEDIATE,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(SkillLevel)
  skillLevelRequired?: SkillLevel | null;

  @ApiPropertyOptional({
    description:
      'Maximum number of opponents or players the post owner wants to find.',
    example: 1,
    default: 1,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  maxPlayers = 1;
}
