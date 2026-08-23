import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { SkillLevel, UserRole, UserStatus } from './database.enums';
@Entity('users') export class UserEntity {
 @PrimaryGeneratedColumn('uuid') id:string;
 @Index({unique:true}) @Column({unique:true}) email:string;
 @Index({unique:true,where:'phone IS NOT NULL'}) @Column({type:'varchar',nullable:true,unique:true}) phone:string|null;
 @Column({name:'password_hash',select:false}) passwordHash:string;
 @Column({type:'enum',enum:UserRole,enumName:'user_role_enum',default:UserRole.USER}) role:UserRole;
 @Column({type:'enum',enum:UserStatus,enumName:'user_status_enum',default:UserStatus.PENDING}) status:UserStatus;
 @Column({type:'decimal',precision:10,scale:7,nullable:true}) lat:string|null;
 @Column({type:'decimal',precision:10,scale:7,nullable:true}) lng:string|null;
 @CreateDateColumn({name:'created_at',type:'timestamptz'}) createdAt:Date;
 @UpdateDateColumn({name:'updated_at',type:'timestamptz'}) updatedAt:Date;
}
@Entity('user_profiles') export class UserProfileEntity {
 @PrimaryGeneratedColumn('uuid') id:string;
 @Index({unique:true}) @Column({name:'user_id',type:'uuid',unique:true}) userId:string;
 @Column({name:'full_name',type:'varchar',nullable:true}) fullName:string|null;
 @Column({name:'avatar_url',type:'varchar',nullable:true}) avatarUrl:string|null;
 @Column({type:'text',nullable:true}) bio:string|null;
 @Column({name:'skill_level',type:'enum',enum:SkillLevel,enumName:'skill_level_enum',nullable:true}) skillLevel:SkillLevel|null;
 @Column({type:'date',nullable:true}) birthday:string|null;
 @Column({type:'varchar',nullable:true}) gender:string|null;
}
@Entity('owner_profiles') export class OwnerProfileEntity {
 @PrimaryGeneratedColumn('uuid') id:string;
 @Index({unique:true}) @Column({name:'user_id',type:'uuid',unique:true}) userId:string;
 @Column({name:'business_name',type:'varchar',nullable:true}) businessName:string|null;
 @Column({name:'business_license',type:'varchar',nullable:true}) businessLicense:string|null;
 @Column({name:'bank_account',type:'varchar',nullable:true,select:false}) bankAccount:string|null;
 @Column({name:'verified_at',type:'timestamptz',nullable:true}) verifiedAt:Date|null;
}
