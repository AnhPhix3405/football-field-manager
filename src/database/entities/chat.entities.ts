import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ConversationType, MessageType } from './database.enums';
@Entity('conversations') export class ConversationEntity {
 @PrimaryGeneratedColumn('uuid') id:string; @Column({type:'enum',enum:ConversationType,enumName:'conversation_type_enum',default:ConversationType.DIRECT}) type:ConversationType;
 @Index() @Column({name:'related_post_id',type:'uuid',nullable:true}) relatedPostId:string|null; @Index() @Column({name:'related_field_id',type:'uuid',nullable:true}) relatedFieldId:string|null;
 @CreateDateColumn({name:'created_at',type:'timestamptz'}) createdAt:Date; @Column({name:'deleted_by_sender',type:'timestamptz',nullable:true}) deletedBySender:Date|null;
 @Column({name:'deleted_by_receiver',type:'timestamptz',nullable:true}) deletedByReceiver:Date|null;
}
@Entity('conversation_members') export class ConversationMemberEntity {
 @PrimaryColumn({name:'conversation_id',type:'uuid'}) conversationId:string; @PrimaryColumn({name:'user_id',type:'uuid'}) userId:string;
 @CreateDateColumn({name:'joined_at',type:'timestamptz'}) joinedAt:Date;
}
@Entity('messages') @Index(['conversationId','createdAt']) export class MessageEntity {
 @PrimaryGeneratedColumn('uuid') id:string; @Column({name:'conversation_id',type:'uuid'}) conversationId:string; @Index() @Column({name:'sender_id',type:'uuid'}) senderId:string;
 @Column({type:'text'}) content:string; @Column({name:'message_type',type:'enum',enum:MessageType,enumName:'message_type_enum',default:MessageType.TEXT}) messageType:MessageType;
 @Column({name:'is_read',default:false}) isRead:boolean; @CreateDateColumn({name:'created_at',type:'timestamptz'}) createdAt:Date; @UpdateDateColumn({name:'updated_at',type:'timestamptz'}) updatedAt:Date;
}
