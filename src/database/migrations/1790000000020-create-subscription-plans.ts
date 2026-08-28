import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubscriptionPlans1790000000020 implements MigrationInterface {
  name = 'CreateSubscriptionPlans1790000000020';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE public.subscription_plans (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    price numeric(15,2) NOT NULL,
    duration_days integer NOT NULL,
    benefit jsonb,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT "PK_9ab8fe6918451ab3d0a4fb6bb0c" PRIMARY KEY (id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.subscription_plans`);
  }
}
