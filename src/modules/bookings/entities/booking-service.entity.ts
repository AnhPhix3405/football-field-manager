import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('booking_services')
@Unique(['bookingId', 'serviceId'])
export class BookingServiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({
    name: 'booking_id',
    type: 'uuid',
  })
  bookingId: string;

  @Column({
    name: 'service_id',
    type: 'uuid',
  })
  serviceId: string;

  @Column({
    type: 'int',
    default: 1,
  })
  quantity: number;

  @Column({
    name: 'price_snapshot',
    type: 'decimal',
    precision: 15,
    scale: 2,
  })
  priceSnapshot: string;
}
