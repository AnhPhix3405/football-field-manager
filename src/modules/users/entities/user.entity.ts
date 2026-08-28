import { randomUUID } from 'node:crypto';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  SkillLevel,
  UserRole,
  UserStatus,
} from '../../../constants/enums/database.enums';

@Entity('users')
@Index('IDX_users_auth_provider_id', ['authProvider', 'providerId'])
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string = randomUUID();

  @Index({ unique: true })
  @Column({ unique: true })
  email: string;

  @Index({ unique: true, where: 'phone IS NOT NULL' })
  @Column({ type: 'varchar', nullable: true, unique: true })
  phone: string | null;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    nullable: true,
    select: false,
  })
  passwordHash: string | null;

  @Column({ name: 'auth_provider', type: 'varchar', default: 'local' })
  authProvider: string;

  @Column({ name: 'provider_id', type: 'varchar', nullable: true })
  providerId: string | null;

  @Index('IDX_users_role')
  @Column({
    type: 'enum',
    enum: UserRole,
    enumName: 'user_role_enum',
    default: UserRole.USER,
  })
  role: UserRole;

  @Index('IDX_users_status')
  @Column({
    type: 'enum',
    enum: UserStatus,
    enumName: 'user_status_enum',
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lat: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lng: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

@Entity('user_profiles')
export class UserProfileEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index({ unique: true })
  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;
  @Column({ name: 'full_name', type: 'varchar', nullable: true })
  fullName: string | null;
  @Column({ name: 'avatar_url', type: 'varchar', nullable: true }) avatarUrl:
    string | null;
  @Column({ type: 'text', nullable: true })
  bio: string | null;
  @Column({
    name: 'skill_level',
    type: 'enum',
    enum: SkillLevel,
    enumName: 'skill_level_enum',
    nullable: true,
  })
  skillLevel: SkillLevel | null;
  @Column({ type: 'date', nullable: true }) birthday: string | null;
  @Column({ type: 'varchar', nullable: true }) gender: string | null;
}

@Entity('owner_profiles')
export class OwnerProfileEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index({ unique: true })
  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;
  @Column({ name: 'business_name', type: 'varchar', nullable: true })
  businessName: string | null;
  @Column({ name: 'business_license', type: 'varchar', nullable: true })
  businessLicense: string | null;
  @Column({
    name: 'bank_account',
    type: 'varchar',
    nullable: true,
    select: false,
  })
  bankAccount: string | null;
  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt: Date | null;
}
