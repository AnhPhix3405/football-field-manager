import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFieldRatingSummary1790000000028 implements MigrationInterface {
  name = 'CreateFieldRatingSummary1790000000028';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE public.field_rating_summary (
    field_id uuid NOT NULL,
    avg_rating numeric(3,2) DEFAULT '0'::numeric NOT NULL,
    total_reviews integer DEFAULT 0 NOT NULL,
    bayesian_score numeric(5,3) DEFAULT '0'::numeric NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`ALTER TABLE ONLY public.field_rating_summary
    ADD CONSTRAINT "PK_fc01b20ef049ed9b50510f488f0" PRIMARY KEY (field_id)`);
    await queryRunner.query(
      `CREATE INDEX "IDX_4397e1893c028b96e04f208f76" ON public.field_rating_summary USING btree (bayesian_score)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_field_rating_summary_avg ON public.field_rating_summary USING btree (avg_rating)`,
    );
    await queryRunner.query(`ALTER TABLE ONLY public.field_rating_summary
    ADD CONSTRAINT "FK_field_rating_summary_field_id" FOREIGN KEY (field_id) REFERENCES public.fields(id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.field_rating_summary`);
  }
}
