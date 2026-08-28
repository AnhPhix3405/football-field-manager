import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDatabaseInfrastructure1790000000000 implements MigrationInterface {
  name = 'CreateDatabaseInfrastructure1790000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public`,
    );
    await queryRunner.query(
      `COMMENT ON EXTENSION btree_gist IS 'support for indexing common datatypes in GiST'`,
    );
    await queryRunner.query(
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public`,
    );
    await queryRunner.query(
      `COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)'`,
    );
    await queryRunner.query(`CREATE TYPE public.ai_feature_enum AS ENUM (
    'chatbot',
    'moderation',
    'match_suggestion'
)`);
    await queryRunner.query(`CREATE TYPE public.approval_status_enum AS ENUM (
    'pending',
    'approved',
    'rejected'
)`);
    await queryRunner.query(`CREATE TYPE public.approval_type_enum AS ENUM (
    'owner_register',
    'field_create',
    'field_update'
)`);
    await queryRunner.query(`CREATE TYPE public.booking_status_enum AS ENUM (
    'pending',
    'confirmed',
    'rejected',
    'cancelled',
    'completed'
)`);
    await queryRunner.query(`CREATE TYPE public.conversation_type_enum AS ENUM (
    'direct'
)`);
    await queryRunner.query(`CREATE TYPE public.court_status_enum AS ENUM (
    'active',
    'maintenance',
    'inactive'
)`);
    await queryRunner.query(`CREATE TYPE public.day_type_enum AS ENUM (
    'weekday',
    'weekend'
)`);
    await queryRunner.query(`CREATE TYPE public.deposit_type_enum AS ENUM (
    'percentage',
    'fixed_amount'
)`);
    await queryRunner.query(`CREATE TYPE public.field_status_enum AS ENUM (
    'pending',
    'active',
    'hidden',
    'rejected'
)`);
    await queryRunner.query(`CREATE TYPE public.match_status_enum AS ENUM (
    'pending',
    'accepted',
    'rejected'
)`);
    await queryRunner.query(`CREATE TYPE public.message_type_enum AS ENUM (
    'text',
    'image'
)`);
    await queryRunner.query(`CREATE TYPE public.notification_type_enum AS ENUM (
    'booking_confirmed',
    'booking_rejected',
    'subscription_expiring',
    'new_message',
    'booking_cancelled',
    'match_accepted'
)`);
    await queryRunner.query(`CREATE TYPE public.payment_method_enum AS ENUM (
    'cash',
    'vnpay'
)`);
    await queryRunner.query(`CREATE TYPE public.payment_status_enum AS ENUM (
    'unpaid',
    'pending',
    'paid',
    'refunded',
    'failed'
)`);
    await queryRunner.query(`CREATE TYPE public.post_skill_level_enum AS ENUM (
    'beginner',
    'intermediate',
    'advanced'
)`);
    await queryRunner.query(`CREATE TYPE public.post_status_enum AS ENUM (
    'open',
    'matched',
    'closed'
)`);
    await queryRunner.query(`CREATE TYPE public.skill_level_enum AS ENUM (
    'beginner',
    'intermediate',
    'advanced'
)`);
    await queryRunner.query(`CREATE TYPE public.subscription_status_enum AS ENUM (
    'active',
    'expired',
    'pending_payment',
    'cancelled'
)`);
    await queryRunner.query(`CREATE TYPE public.transaction_status_enum AS ENUM (
    'pending',
    'success',
    'failed',
    'refunded'
)`);
    await queryRunner.query(`CREATE TYPE public.transaction_type_enum AS ENUM (
    'subscription',
    'booking_deposit'
)`);
    await queryRunner.query(`CREATE TYPE public.user_role_enum AS ENUM (
    'user',
    'owner',
    'admin'
)`);
    await queryRunner.query(`CREATE TYPE public.user_status_enum AS ENUM (
    'active',
    'banned',
    'pending'
)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TYPE IF EXISTS public.user_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS public.user_role_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS public.transaction_type_enum`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS public.transaction_status_enum`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS public.subscription_status_enum`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS public.skill_level_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS public.post_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS public.post_skill_level_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS public.payment_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS public.payment_method_enum`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS public.notification_type_enum`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS public.message_type_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS public.match_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS public.field_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS public.deposit_type_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS public.day_type_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS public.court_status_enum`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS public.conversation_type_enum`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS public.booking_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS public.approval_type_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS public.approval_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS public.ai_feature_enum`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS btree_gist`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
  }
}
