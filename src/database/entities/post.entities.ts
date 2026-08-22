import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { MatchStatus, PostStatus, SkillLevel } from './database.enums';
@Entity('posts') @Index(['lat','lng']) export class PostEntity {
 @PrimaryGeneratedColumn('uuid') id:string; @Index() @Column({name:'user_id',type:'uuid'}) userId:string; @Column() title:string; @Column({type:'text',nullable:true}) content:string|null;
 @Column({type:'decimal',precision:10,scale:7}) lat:string; @Column({type:'decimal',precision:10,scale:7}) lng:string; @Index() @Column({name:'play_date',type:'date'}) playDate:string;
 @Column({name:'start_time',type:'time'}) startTime:string; @Column({name:'end_time',type:'time'}) endTime:string;
 @Column({name:'skill_level_required',type:'enum',enum:SkillLevel,enumName:'post_skill_level_enum',nullable:true}) skillLevelRequired:SkillLevel|null;
 @Column({type:'enum',enum:PostStatus,enumName:'post_status_enum',default:PostStatus.OPEN}) status:PostStatus;
 @CreateDateColumn({name:'created_at',type:'timestamptz'}) createdAt:Date; @UpdateDateColumn({name:'updated_at',type:'timestamptz'}) updatedAt:Date;
 @DeleteDateColumn({name:'deleted_at',type:'timestamptz',nullable:true}) deletedAt:Date|null;
}
@Entity('post_comments') export class PostCommentEntity {
 @PrimaryGeneratedColumn('uuid') id:string; @Index() @Column({name:'post_id',type:'uuid'}) postId:string; @Index() @Column({name:'user_id',type:'uuid'}) userId:string;
 @Column({type:'text'}) content:string; @CreateDateColumn({name:'created_at',type:'timestamptz'}) createdAt:Date;
}
@Entity('post_matches') @Unique(['postId','applicantId']) export class PostMatchEntity {
 @PrimaryGeneratedColumn('uuid') id:string; @Index() @Column({name:'post_id',type:'uuid'}) postId:string; @Index() @Column({name:'applicant_id',type:'uuid'}) applicantId:string;
 @Column({type:'enum',enum:MatchStatus,enumName:'match_status_enum',default:MatchStatus.PENDING}) status:MatchStatus;
 @Column({name:'conversation_id',type:'uuid',nullable:true}) conversationId:string|null;
}
