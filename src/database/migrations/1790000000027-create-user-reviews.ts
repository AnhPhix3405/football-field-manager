import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserReviews1790000000027 implements MigrationInterface {
  name = 'CreateUserReviews1790000000027';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE public.user_reviews (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    target_user_id uuid NOT NULL,
    reviewer_id uuid NOT NULL,
    post_id uuid NOT NULL,
    rating integer NOT NULL,
    is_flagged boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    comment text,
    CONSTRAINT "CHK_user_reviews_rating" CHECK (((rating >= 1) AND (rating <= 5)))
)`);
    await queryRunner.query(`ALTER TABLE ONLY public.user_reviews
    ADD CONSTRAINT "PK_24de027fbe1bf4d1c39817dc8da" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.user_reviews
    ADD CONSTRAINT "UQ_464b3c7305c93fb5c2625771035" UNIQUE (target_user_id, reviewer_id, post_id)`);
    await queryRunner.query(
      `CREATE INDEX "IDX_2a15dfcd7aa8b8f61431364d19" ON public.user_reviews USING btree (target_user_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_user_reviews_reviewer ON public.user_reviews USING btree (reviewer_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_user_reviews_target_created ON public.user_reviews USING btree (target_user_id, created_at)`,
    );
    await queryRunner.query(`ALTER TABLE ONLY public.user_reviews
    ADD CONSTRAINT "FK_user_reviews_post_id" FOREIGN KEY (post_id) REFERENCES public.posts(id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.user_reviews
    ADD CONSTRAINT "FK_user_reviews_reviewer_id" FOREIGN KEY (reviewer_id) REFERENCES public.users(id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.user_reviews
    ADD CONSTRAINT "FK_user_reviews_target_user_id" FOREIGN KEY (target_user_id) REFERENCES public.users(id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.user_reviews`);
  }
}
