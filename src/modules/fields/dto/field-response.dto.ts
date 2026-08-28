import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CourtStatus,
  DayType,
  DepositType,
} from '../../../constants/enums/database.enums';

export class FieldServiceResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ example: 'Parking' }) name: string;
  @ApiProperty({ example: 20000 }) price: number;
  @ApiPropertyOptional({ example: 'vehicle', nullable: true }) unit:
    string | null;
}

export class FieldPricingResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ enum: DayType }) dayType: DayType;
  @ApiProperty({ example: '06:00:00' }) startTime: string;
  @ApiProperty({ example: '17:00:00' }) endTime: string;
  @ApiProperty({ example: 250000, description: 'Hourly price.' }) price: number;
}

export class FieldCourtResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ example: 'Court A' }) name: string;
  @ApiProperty({ example: '5-a-side' }) type: string;
  @ApiProperty({ enum: CourtStatus }) status: CourtStatus;
}

export class FieldSummaryResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ example: 'Victory Football Field' }) name: string;
  @ApiProperty() address: string;
  @ApiPropertyOptional({ nullable: true }) district: string | null;
  @ApiPropertyOptional({ nullable: true }) latitude: number | null;
  @ApiPropertyOptional({ nullable: true }) longitude: number | null;
  @ApiPropertyOptional({ example: 2.4 }) distanceKm?: number;
  @ApiPropertyOptional({ example: 200000, nullable: true }) minimumHourlyPrice:
    number | null;
  @ApiPropertyOptional({ nullable: true }) thumbnailUrl: string | null;
  @ApiProperty({ type: [String] }) services: string[];
}

export class PaginatedFieldsResponseDto {
  @ApiProperty({ type: [FieldSummaryResponseDto] })
  items: FieldSummaryResponseDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}

export class FieldDetailResponseDto extends FieldSummaryResponseDto {
  @ApiPropertyOptional({ nullable: true }) description: string | null;
  @ApiProperty({ format: 'uuid' }) ownerId: string;
  @ApiProperty() requireDeposit: boolean;
  @ApiPropertyOptional({ enum: DepositType, nullable: true })
  depositType: DepositType | null;
  @ApiPropertyOptional({ nullable: true }) depositValue: number | null;
  @ApiProperty({ type: [String] }) images: string[];
  @ApiProperty({ type: [FieldCourtResponseDto] })
  courts: FieldCourtResponseDto[];
  @ApiProperty({ type: [FieldServiceResponseDto] })
  availableServices: FieldServiceResponseDto[];
  @ApiProperty({ type: [FieldPricingResponseDto] })
  pricing: FieldPricingResponseDto[];
}

export class BookedSlotResponseDto {
  @ApiProperty({ example: '18:00:00' }) startTime: string;
  @ApiProperty({ example: '20:00:00' }) endTime: string;
}

export class CourtAvailabilityResponseDto extends FieldCourtResponseDto {
  @ApiPropertyOptional({
    description: 'Returned when a requested time range is supplied.',
  })
  isAvailable?: boolean;
  @ApiProperty({ type: [BookedSlotResponseDto] })
  bookedSlots: BookedSlotResponseDto[];
}

export class FieldAvailabilityResponseDto {
  @ApiProperty({ format: 'uuid' }) fieldId: string;
  @ApiProperty({ example: '2026-09-01' }) date: string;
  @ApiPropertyOptional({
    description: 'Number of available courts for the requested time range.',
  })
  availableCourtCount?: number;
  @ApiProperty({ type: [CourtAvailabilityResponseDto] })
  courts: CourtAvailabilityResponseDto[];
}
