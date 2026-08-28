import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import {
  CourtStatus,
  DayType,
  DepositType,
  FieldStatus,
} from '../../../constants/enums/database.enums';
@Entity('fields')
@Index('IDX_fields_lat_lng', ['lat', 'lng'])
export class FieldEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ name: 'owner_id', type: 'uuid' }) ownerId: string;
  @Column() name: string;
  @Column() address: string;
  @Index() @Column({ type: 'varchar', nullable: true }) district: string | null;
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true }) lat:
    string | null;
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true }) lng:
    string | null;
  @Column({ type: 'text', nullable: true }) description: string | null;
  @Index('IDX_fields_status')
  @Column({
    type: 'enum',
    enum: FieldStatus,
    enumName: 'field_status_enum',
    default: FieldStatus.PENDING,
  })
  status: FieldStatus;
  @Column({ name: 'require_deposit', default: false }) requireDeposit: boolean;
  @Column({
    name: 'deposit_type',
    type: 'enum',
    enum: DepositType,
    enumName: 'deposit_type_enum',
    nullable: true,
  })
  depositType: DepositType | null;
  @Column({
    name: 'deposit_value',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  depositValue: string | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
@Entity('field_courts')
@Index('IDX_field_courts_field_status', ['fieldId', 'status'])
export class FieldCourtEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ name: 'field_id', type: 'uuid' }) fieldId: string;
  @Column() name: string;
  @Column() type: string;
  @Column({
    type: 'enum',
    enum: CourtStatus,
    enumName: 'court_status_enum',
    default: CourtStatus.ACTIVE,
  })
  status: CourtStatus;
}
@Entity('field_images')
export class FieldImageEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ name: 'field_id', type: 'uuid' }) fieldId: string;
  @Column() url: string;
  @Column({ name: 'is_thumbnail', default: false }) isThumbnail: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
@Entity('field_services')
@Index('IDX_field_services_field_active', ['fieldId', 'isActive'])
export class FieldServiceEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ name: 'field_id', type: 'uuid' }) fieldId: string;
  @Column() name: string;
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  price: string;
  @Column({ type: 'varchar', nullable: true }) unit: string | null;
  @Column({ name: 'is_active', default: true }) isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
@Entity('field_pricing')
@Index('IDX_field_pricing_court_day', ['fieldCourtId', 'dayType'])
@Index('IDX_field_pricing_lookup', [
  'fieldCourtId',
  'dayType',
  'startTime',
  'endTime',
])
export class FieldPricingEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index('IDX_field_pricing_court')
  @Column({ name: 'field_court_id', type: 'uuid' })
  fieldCourtId: string;
  @Column({
    name: 'day_type',
    type: 'enum',
    enum: DayType,
    enumName: 'day_type_enum',
  })
  dayType: DayType;
  @Column({ name: 'start_time', type: 'time' }) startTime: string;
  @Column({ name: 'end_time', type: 'time' }) endTime: string;
  @Column({ type: 'decimal', precision: 15, scale: 2 }) price: string;
}

@Entity('field_opening_hours')
@Unique('UQ_field_opening_hours_day', ['fieldId', 'dayOfWeek'])
export class FieldOpeningHoursEntity {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'field_id', type: 'uuid' }) fieldId: string;
  @Column({ name: 'day_of_week', type: 'int' }) dayOfWeek: number;
  @Column({ name: 'open_time', type: 'time', nullable: true })
  openTime: string | null;
  @Column({ name: 'close_time', type: 'time', nullable: true })
  closeTime: string | null;
  @Column({ name: 'is_closed', default: false }) isClosed: boolean;
}

@Entity('field_blocked_slots')
@Index('IDX_field_blocked_slots_court_date', ['fieldCourtId', 'blockedDate'])
@Index('IDX_field_blocked_slots_lookup', [
  'fieldCourtId',
  'blockedDate',
  'startTime',
  'endTime',
])
export class FieldBlockedSlotEntity {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Index('IDX_field_blocked_slots_court')
  @Column({ name: 'field_court_id', type: 'uuid' })
  fieldCourtId: string;

  @Column({ name: 'blocked_date', type: 'date' }) blockedDate: string;
  @Column({ name: 'start_time', type: 'time' }) startTime: string;
  @Column({ name: 'end_time', type: 'time' }) endTime: string;
  @Column({ type: 'varchar', nullable: true }) reason: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
