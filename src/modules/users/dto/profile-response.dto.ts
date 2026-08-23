import { ApiProperty } from '@nestjs/swagger';
import { SkillLevel, UserRole, UserStatus } from '../../../database/entities';

export class ProfileResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'email', example: 'player@example.com' })
  email: string;

  @ApiProperty({ example: '+84901234567', nullable: true })
  phone: string | null;

  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  role: UserRole;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  status: UserStatus;

  @ApiProperty({ example: 'Nguyen Van A', nullable: true })
  fullName: string | null;

  @ApiProperty({ nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ nullable: true })
  bio: string | null;

  @ApiProperty({ enum: SkillLevel, nullable: true })
  skillLevel: SkillLevel | null;

  @ApiProperty({ format: 'date', nullable: true })
  birthday: string | null;

  @ApiProperty({ nullable: true })
  gender: string | null;

  @ApiProperty({ example: 10.7769, nullable: true })
  latitude: number | null;

  @ApiProperty({ example: 106.7009, nullable: true })
  longitude: number | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
