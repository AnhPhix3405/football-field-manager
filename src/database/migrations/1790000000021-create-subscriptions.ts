import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubscriptions1790000000021 implements MigrationInterface {
  name = 'CreateSubscriptions1790000000021';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE public.subscriptions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    owner_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    status public.subscription_status_enum DEFAULT 'pending_payment'::public.subscription_status_enum NOT NULL,
    start_date date,
    end_date date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY (id)`);
    await queryRunner.query(
      `CREATE INDEX "IDX_39a0b4bd3117b9d4c9cd696fee" ON public.subscriptions USING btree (owner_id, status)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_subscriptions_owner ON public.subscriptions USING btree (owner_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_subscriptions_plan ON public.subscriptions USING btree (plan_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_subscriptions_status ON public.subscriptions USING btree (status)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_subscriptions_status_end_date ON public.subscriptions USING btree (status, end_date)`,
    );
    await queryRunner.query(`ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT "FK_subscriptions_owner_id" FOREIGN KEY (owner_id) REFERENCES public.users(id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT "FK_subscriptions_plan_id" FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.subscriptions`);
  }
}
