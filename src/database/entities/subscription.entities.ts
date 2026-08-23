import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { SubscriptionStatus, TransactionStatus, TransactionType } from './database.enums';
@Entity('subscription_plans') export class SubscriptionPlanEntity {
 @PrimaryGeneratedColumn('uuid') id:string; @Column() name:string; @Column({type:'decimal',precision:14,scale:2}) price:string; @Column({name:'duration_days',type:'int'}) durationDays:number;
 @Column({type:'jsonb',default:()=>"'{}'::jsonb"}) benefit:Record<string,unknown>;
}
@Entity('subscriptions') @Index(['ownerId','status']) export class SubscriptionEntity {
 @PrimaryGeneratedColumn('uuid') id:string; @Column({name:'owner_id',type:'uuid'}) ownerId:string; @Column({name:'plan_id',type:'uuid'}) planId:string;
 @Column({type:'enum',enum:SubscriptionStatus,enumName:'subscription_status_enum',default:SubscriptionStatus.PENDING_PAYMENT}) status:SubscriptionStatus;
 @Column({name:'start_date',type:'date',nullable:true}) startDate:string|null; @Column({name:'end_date',type:'date',nullable:true}) endDate:string|null;
}
@Entity('transactions') @Index(['type','refId']) export class TransactionEntity {
 @PrimaryGeneratedColumn('uuid') id:string; @Index() @Column({name:'user_id',type:'uuid'}) userId:string;
 @Column({type:'enum',enum:TransactionType,enumName:'transaction_type_enum'}) type:TransactionType; @Column({name:'ref_id',type:'uuid',nullable:true}) refId:string|null;
 @Column({type:'decimal',precision:14,scale:2}) amount:string; @Column({type:'enum',enum:TransactionStatus,enumName:'transaction_status_enum',default:TransactionStatus.PENDING}) status:TransactionStatus;
 @Column({nullable:true}) gateway:string|null; @Index({unique:true,where:'gateway_ref IS NOT NULL'}) @Column({name:'gateway_ref',nullable:true}) gatewayRef:string|null;
 @CreateDateColumn({name:'created_at',type:'timestamptz'}) createdAt:Date;
}
