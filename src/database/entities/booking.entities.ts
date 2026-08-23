import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { BookingStatus, PaymentMethod, PaymentStatus } from './database.enums';
@Entity('bookings') @Index(['fieldId','bookingDate','startTime','endTime']) export class BookingEntity {
 @PrimaryGeneratedColumn('uuid') id:string; @Index() @Column({name:'user_id',type:'uuid'}) userId:string; @Index() @Column({name:'field_id',type:'uuid'}) fieldId:string;
 @Index() @Column({name:'field_court_id',type:'uuid',nullable:true}) fieldCourtId:string|null; @Column({name:'booking_date',type:'date'}) bookingDate:string;
 @Column({name:'start_time',type:'time'}) startTime:string; @Column({name:'end_time',type:'time'}) endTime:string;
 @Column({type:'enum',enum:BookingStatus,enumName:'booking_status_enum',default:BookingStatus.PENDING}) status:BookingStatus;
 @Column({name:'total_price',type:'decimal',precision:14,scale:2}) totalPrice:string;
 @Column({name:'payment_method',type:'enum',enum:PaymentMethod,enumName:'payment_method_enum'}) paymentMethod:PaymentMethod;
 @Column({name:'payment_status',type:'enum',enum:PaymentStatus,enumName:'payment_status_enum',default:PaymentStatus.NOT_REQUIRED}) paymentStatus:PaymentStatus;
 @Column({name:'deposit_amount',type:'decimal',precision:14,scale:2,default:0}) depositAmount:string; @Column({name:'owner_note',type:'text',nullable:true}) ownerNote:string|null;
 @CreateDateColumn({name:'created_at',type:'timestamptz'}) createdAt:Date; @UpdateDateColumn({name:'updated_at',type:'timestamptz'}) updatedAt:Date;
}
@Entity('booking_services') @Unique(['bookingId','serviceId']) export class BookingServiceEntity {
 @PrimaryGeneratedColumn('uuid') id:string; @Index() @Column({name:'booking_id',type:'uuid'}) bookingId:string; @Column({name:'service_id',type:'uuid'}) serviceId:string;
 @Column({type:'int',default:1}) quantity:number; @Column({name:'price_snapshot',type:'decimal',precision:14,scale:2}) priceSnapshot:string;
}
