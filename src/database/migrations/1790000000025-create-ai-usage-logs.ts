import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAiUsageLogs1790000000025 implements MigrationInterface {
  name = 'CreateAiUsageLogs1790000000025';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE public.ai_usage_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    feature public.ai_feature_enum NOT NULL,
    tokens_used integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`ALTER TABLE ONLY public.ai_usage_logs
    ADD CONSTRAINT "PK_7f42670987a1de5cb209a77e925" PRIMARY KEY (id)`);
    await queryRunner.query(
      `CREATE INDEX "IDX_5ae130ec36e163aca178827e5b" ON public.ai_usage_logs USING btree (user_id, feature, created_at)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_ai_usage_logs_feature ON public.ai_usage_logs USING btree (feature)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_ai_usage_logs_user ON public.ai_usage_logs USING btree (user_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_ai_usage_logs_user_created ON public.ai_usage_logs USING btree (user_id, created_at)`,
    );
    await queryRunner.query(`ALTER TABLE ONLY public.ai_usage_logs
    ADD CONSTRAINT "FK_ai_usage_logs_user_id" FOREIGN KEY (user_id) REFERENCES public.users(id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.ai_usage_logs`);
  }
}
