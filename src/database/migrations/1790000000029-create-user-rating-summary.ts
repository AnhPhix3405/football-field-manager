import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserRatingSummary1790000000029 implements MigrationInterface {
  name = 'CreateUserRatingSummary1790000000029';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE public.user_rating_summary (
    user_id uuid NOT NULL,
    avg_rating numeric(3,2) DEFAULT '0'::numeric NOT NULL,
    total_reviews integer DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    sportsmanship_score numeric(5,2) DEFAULT 0 NOT NULL
)`);
    await queryRunner.query(`ALTER TABLE ONLY public.user_rating_summary
    ADD CONSTRAINT "PK_592b84a02c86f8e371f374c93e4" PRIMARY KEY (user_id)`);
    await queryRunner.query(
      `CREATE INDEX idx_user_rating_summary_avg ON public.user_rating_summary USING btree (avg_rating)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_user_rating_summary_sportsmanship ON public.user_rating_summary USING btree (sportsmanship_score)`,
    );
    await queryRunner.query(`ALTER TABLE ONLY public.user_rating_summary
    ADD CONSTRAINT "FK_user_rating_summary_user_id" FOREIGN KEY (user_id) REFERENCES public.users(id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.user_rating_summary`);
  }
}
