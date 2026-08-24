import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
  TransactionStatus,
} from '../../../database/entities';

export class SelectedBookingServiceResponseDto {
  @ApiProperty({ format: 'uuid' }) serviceId: string;
  @ApiProperty() quantity: number;
  @ApiProperty() priceSnapshot: number;
  @ApiProperty() subtotal: number;
}

export class PaymentPlaceholderResponseDto {
  @ApiProperty({ format: 'uuid' }) transactionId: string;
  @ApiProperty({ example: 'placeholder' }) gateway: string;
  @ApiProperty({ example: 'placeholder:booking-uuid' }) gatewayReference: string;
  @ApiProperty() amount: number;
  @ApiProperty({ enum: TransactionStatus }) status: TransactionStatus;
  @ApiProperty({ example: 'https://payment.placeholder.local/checkout/transaction-uuid' })
  paymentUrl: string;
  @ApiProperty({ format: 'date-time' }) expiresAt: Date;
}

export class BookingResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) userId: string;
  @ApiProperty({ format: 'uuid' }) fieldId: string;
  @ApiProperty({ format: 'uuid' }) fieldCourtId: string;
  @ApiProperty() bookingDate: string;
  @ApiProperty() startTime: string;
  @ApiProperty() endTime: string;
  @ApiProperty({ enum: BookingStatus }) status: BookingStatus;
  @ApiProperty() fieldPrice: number;
  @ApiProperty() servicesPrice: number;
  @ApiProperty() totalPrice: number;
  @ApiProperty() depositAmount: number;
  @ApiProperty({ enum: PaymentMethod }) paymentMethod: PaymentMethod;
  @ApiProperty({ enum: PaymentStatus }) paymentStatus: PaymentStatus;
  @ApiProperty({ type: [SelectedBookingServiceResponseDto] })
  services: SelectedBookingServiceResponseDto[];
  @ApiPropertyOptional({ type: PaymentPlaceholderResponseDto, nullable: true })
  payment: PaymentPlaceholderResponseDto | null;
  @ApiProperty({ format: 'date-time' }) createdAt: Date;
  @ApiProperty({ format: 'date-time' }) updatedAt: Date;
}
