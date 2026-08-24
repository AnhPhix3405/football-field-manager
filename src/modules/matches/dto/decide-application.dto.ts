import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { MatchStatus } from '../../../database/entities';

const ALLOWED_DECISIONS = [MatchStatus.ACCEPTED, MatchStatus.REJECTED];

export class DecideApplicationDto {
  @ApiProperty({
    enum: ALLOWED_DECISIONS,
    example: MatchStatus.ACCEPTED,
  })
  @IsIn(ALLOWED_DECISIONS)
  decision: MatchStatus.ACCEPTED | MatchStatus.REJECTED;
}
