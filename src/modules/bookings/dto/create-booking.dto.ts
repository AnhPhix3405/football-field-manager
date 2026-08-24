import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../../../database/entities';

export class BookingServiceSelectionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  serviceId: string;

  @ApiPropertyOptional({ default: 1, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  quantity = 1;
}

export class CreateBookingDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  fieldId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  fieldCourtId: string;

  @ApiProperty({ example: '2026-09-01' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  bookingDate: string;

  @ApiProperty({ example: '18:00' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime: string;

  @ApiProperty({ example: '20:00' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime: string;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.DEPOSIT_ONLINE })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ type: [BookingServiceSelectionDto] })
  @IsOptional()
  @IsArray()
  @ArrayUnique((item: BookingServiceSelectionDto) => item.serviceId)
  @ValidateNested({ each: true })
  @Type(() => BookingServiceSelectionDto)
  services: BookingServiceSelectionDto[] = [];
}
