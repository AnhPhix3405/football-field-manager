import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePostMatches1790000000019 implements MigrationInterface {
  name = 'CreatePostMatches1790000000019';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE public.post_matches (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    post_id uuid NOT NULL,
    applicant_id uuid NOT NULL,
    status public.match_status_enum DEFAULT 'pending'::public.match_status_enum NOT NULL,
    conversation_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`ALTER TABLE ONLY public.post_matches
    ADD CONSTRAINT "PK_618fcb78a7b75232326c1b52138" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.post_matches
    ADD CONSTRAINT "UQ_8f1d0e162496ea24d21619cce15" UNIQUE (post_id, applicant_id)`);
    await queryRunner.query(
      `CREATE INDEX "IDX_427e1e52f6accefda55ac33020" ON public.post_matches USING btree (applicant_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_547a10a97b30830634e4917ee8" ON public.post_matches USING btree (post_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_post_matches_post_status ON public.post_matches USING btree (post_id, status)`,
    );
    await queryRunner.query(`ALTER TABLE ONLY public.post_matches
    ADD CONSTRAINT "FK_post_matches_applicant_id" FOREIGN KEY (applicant_id) REFERENCES public.users(id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.post_matches
    ADD CONSTRAINT "FK_post_matches_conversation_id" FOREIGN KEY (conversation_id) REFERENCES public.conversations(id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.post_matches
    ADD CONSTRAINT "FK_post_matches_post_id" FOREIGN KEY (post_id) REFERENCES public.posts(id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.post_matches`);
  }
}
