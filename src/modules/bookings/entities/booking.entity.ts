import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
} from '../../../constants/enums/database.enums';
@Entity('bookings')
@Index('IDX_bookings_user_created', ['userId', 'createdAt'])
@Index('IDX_bookings_field_date', ['fieldId', 'bookingDate'])
@Index('IDX_bookings_court_date', ['fieldCourtId', 'bookingDate'])
@Index('IDX_bookings_court_time', [
  'fieldCourtId',
  'bookingDate',
  'startTime',
  'endTime',
])
export class BookingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({
    name: 'user_id',
    type: 'uuid',
  })
  userId: string;

  @Index()
  @Column({
    name: 'field_id',
    type: 'uuid',
  })
  fieldId: string;

  @Index()
  @Column({
    name: 'field_court_id',
    type: 'uuid',
    nullable: true,
  })
  fieldCourtId: string | null;

  @Index('IDX_bookings_date')
  @Column({
    name: 'booking_date',
    type: 'date',
  })
  bookingDate: string;

  @Column({
    name: 'start_time',
    type: 'time',
  })
  startTime: string;

  @Column({
    name: 'end_time',
    type: 'time',
  })
  endTime: string;

  @Index('IDX_bookings_status')
  @Column({
    type: 'enum',
    enum: BookingStatus,
    enumName: 'booking_status_enum',
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({
    name: 'total_price',
    type: 'decimal',
    precision: 15,
    scale: 2,
  })
  totalPrice: string;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: PaymentMethod,
    enumName: 'payment_method_enum',
    nullable: true,
  })
  paymentMethod: PaymentMethod | null;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: PaymentStatus,
    enumName: 'payment_status_enum',
    default: PaymentStatus.UNPAID,
  })
  paymentStatus: PaymentStatus;

  @Column({
    name: 'deposit_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  depositAmount: string;

  @Column({
    name: 'owner_note',
    type: 'text',
    nullable: true,
  })
  ownerNote: string | null;

  @Column({
    name: 'cancelled_by',
    type: 'uuid',
    nullable: true,
  })
  cancelledBy: string | null;

  @Column({
    name: 'cancel_reason',
    type: 'text',
    nullable: true,
  })
  cancelReason: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt: Date;
}
