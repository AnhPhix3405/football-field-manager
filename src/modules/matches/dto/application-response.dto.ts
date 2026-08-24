import { ApiProperty } from '@nestjs/swagger';
import { MatchStatus } from '../../../database/entities';

export class ApplicationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  postId: string;

  @ApiProperty({ format: 'uuid' })
  applicantId: string;

  @ApiProperty({ enum: MatchStatus })
  status: MatchStatus;

  @ApiProperty({ format: 'uuid', nullable: true })
  conversationId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ApplicationDecisionResponseDto extends ApplicationResponseDto {
  @ApiProperty({ example: 2 })
  playersNeeded: number;

  @ApiProperty({ example: 1 })
  acceptedPlayers: number;
}
