import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFieldReviews1790000000026 implements MigrationInterface {
  name = 'CreateFieldReviews1790000000026';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE public.field_reviews (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    field_id uuid NOT NULL,
    reviewer_id uuid NOT NULL,
    booking_id uuid NOT NULL,
    rating integer NOT NULL,
    is_flagged boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    comment text,
    CONSTRAINT "CHK_field_reviews_rating" CHECK (((rating >= 1) AND (rating <= 5)))
)`);
    await queryRunner.query(`ALTER TABLE ONLY public.field_reviews
    ADD CONSTRAINT "PK_9c84a27be944ba0c3bc9a9bcff3" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.field_reviews
    ADD CONSTRAINT uq_field_reviews_booking_reviewer UNIQUE (booking_id, reviewer_id)`);
    await queryRunner.query(
      `CREATE INDEX "IDX_0401bfc63155e3d2e154631c85" ON public.field_reviews USING btree (field_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_field_reviews_field_created ON public.field_reviews USING btree (field_id, created_at)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_field_reviews_reviewer ON public.field_reviews USING btree (reviewer_id)`,
    );
    await queryRunner.query(`ALTER TABLE ONLY public.field_reviews
    ADD CONSTRAINT "FK_field_reviews_booking_id" FOREIGN KEY (booking_id) REFERENCES public.bookings(id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.field_reviews
    ADD CONSTRAINT "FK_field_reviews_field_id" FOREIGN KEY (field_id) REFERENCES public.fields(id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.field_reviews
    ADD CONSTRAINT "FK_field_reviews_reviewer_id" FOREIGN KEY (reviewer_id) REFERENCES public.users(id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.field_reviews`);
  }
}
