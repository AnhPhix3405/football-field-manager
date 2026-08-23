import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { AiFeature, ApprovalStatus, ApprovalType, NotificationType } from './database.enums';
@Entity('notifications') @Index(['userId','isRead','createdAt']) export class NotificationEntity {
 @PrimaryGeneratedColumn('uuid') id:string; @Column({name:'user_id',type:'uuid'}) userId:string; @Column({type:'enum',enum:NotificationType,enumName:'notification_type_enum'}) type:NotificationType;
 @Column() title:string; @Column({type:'text'}) content:string; @Column({name:'ref_id',type:'uuid',nullable:true}) refId:string|null; @Column({name:'is_read',default:false}) isRead:boolean;
 @CreateDateColumn({name:'created_at',type:'timestamptz'}) createdAt:Date;
}
@Entity('approval_requests') @Index(['type','targetId']) export class ApprovalRequestEntity {
 @PrimaryGeneratedColumn('uuid') id:string; @Column({type:'enum',enum:ApprovalType,enumName:'approval_type_enum'}) type:ApprovalType;
 @Column({name:'target_id',type:'uuid',nullable:true}) targetId:string|null; @Index() @Column({name:'requested_by',type:'uuid'}) requestedBy:string;
 @Column({type:'enum',enum:ApprovalStatus,enumName:'approval_status_enum',default:ApprovalStatus.PENDING}) status:ApprovalStatus;
 @Column({name:'reviewed_by',type:'uuid',nullable:true}) reviewedBy:string|null; @Column({type:'text',nullable:true}) note:string|null;
 @CreateDateColumn({name:'created_at',type:'timestamptz'}) createdAt:Date;
}
@Entity('ai_usage_logs') @Index(['userId','feature','createdAt']) export class AiUsageLogEntity {
 @PrimaryGeneratedColumn('uuid') id:string; @Column({name:'user_id',type:'uuid'}) userId:string;
 @Column({type:'enum',enum:AiFeature,enumName:'ai_feature_enum'}) feature:AiFeature; @Column({name:'tokens_used',type:'int',default:0}) tokensUsed:number;
 @CreateDateColumn({name:'created_at',type:'timestamptz'}) createdAt:Date;
}
