import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { SkillLevel } from '../../entity-registry';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'Nguyen Van A',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  fullName?: string;

  @ApiPropertyOptional({
    example: '+84901234567',
    nullable: true,
    pattern: '^[0-9+]{9,15}$',
  })
  @IsOptional()
  @Matches(/^[0-9+]{9,15}$/)
  phone?: string | null;

  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/example/image/upload/avatar.jpg',
    nullable: true,
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  avatarUrl?: string | null;

  @ApiPropertyOptional({
    example: 'Usually plays as a midfielder.',
    nullable: true,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string | null;

  @ApiPropertyOptional({
    enum: SkillLevel,
    example: SkillLevel.INTERMEDIATE,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(SkillLevel)
  skillLevel?: SkillLevel | null;

  @ApiPropertyOptional({
    example: '2000-06-15',
    nullable: true,
    format: 'date',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  birthday?: string | null;

  @ApiPropertyOptional({
    example: 'male',
    nullable: true,
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  gender?: string | null;

  @ApiPropertyOptional({
    example: 10.7769,
    nullable: true,
    minimum: -90,
    maximum: 90,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number | null;

  @ApiPropertyOptional({
    example: 106.7009,
    nullable: true,
    minimum: -180,
    maximum: 180,
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number | null;
}
