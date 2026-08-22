import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { CourtStatus, DayType, DepositType, FieldStatus } from './database.enums';
@Entity('fields') export class FieldEntity {
 @PrimaryGeneratedColumn('uuid') id:string; @Index() @Column({name:'owner_id',type:'uuid'}) ownerId:string;
 @Column() name:string; @Column() address:string; @Index() @Column() district:string;
 @Column({type:'decimal',precision:10,scale:7,nullable:true}) lat:string|null; @Column({type:'decimal',precision:10,scale:7,nullable:true}) lng:string|null;
 @Column({type:'text',nullable:true}) description:string|null;
 @Column({type:'enum',enum:FieldStatus,enumName:'field_status_enum',default:FieldStatus.PENDING}) status:FieldStatus;
 @Column({name:'require_deposit',default:false}) requireDeposit:boolean;
 @Column({name:'deposit_type',type:'enum',enum:DepositType,enumName:'deposit_type_enum',nullable:true}) depositType:DepositType|null;
 @Column({name:'deposit_value',type:'decimal',precision:14,scale:2,nullable:true}) depositValue:string|null;
 @CreateDateColumn({name:'created_at',type:'timestamptz'}) createdAt:Date; @UpdateDateColumn({name:'updated_at',type:'timestamptz'}) updatedAt:Date;
}
@Entity('field_courts') export class FieldCourtEntity {
 @PrimaryGeneratedColumn('uuid') id:string; @Index() @Column({name:'field_id',type:'uuid'}) fieldId:string; @Column() name:string; @Column() type:string;
 @Column({type:'enum',enum:CourtStatus,enumName:'court_status_enum',default:CourtStatus.ACTIVE}) status:CourtStatus;
}
@Entity('field_images') export class FieldImageEntity {
 @PrimaryGeneratedColumn('uuid') id:string; @Index() @Column({name:'field_id',type:'uuid'}) fieldId:string; @Column() url:string; @Column({name:'is_thumbnail',default:false}) isThumbnail:boolean;
}
@Entity('field_services') export class FieldServiceEntity {
 @PrimaryGeneratedColumn('uuid') id:string; @Index() @Column({name:'field_id',type:'uuid'}) fieldId:string; @Column() name:string;
 @Column({type:'decimal',precision:14,scale:2,default:0}) price:string; @Column({nullable:true}) unit:string|null;
}
@Entity('field_pricing') export class FieldPricingEntity {
 @PrimaryGeneratedColumn('uuid') id:string; @Index() @Column({name:'field_id',type:'uuid'}) fieldId:string;
 @Column({name:'day_type',type:'enum',enum:DayType,enumName:'day_type_enum'}) dayType:DayType;
 @Column({name:'start_time',type:'time'}) startTime:string; @Column({name:'end_time',type:'time'}) endTime:string;
 @Column({type:'decimal',precision:14,scale:2}) price:string;
}
