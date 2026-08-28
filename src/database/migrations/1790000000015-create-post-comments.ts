import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePostComments1790000000015 implements MigrationInterface {
  name = 'CreatePostComments1790000000015';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE public.post_comments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT "PK_2e99e04b4a1b31de6f833c18ced" PRIMARY KEY (id)`);
    await queryRunner.query(
      `CREATE INDEX "IDX_8eb985b7bd35fd7bc760b6cbe8" ON public.post_comments USING btree (user_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e8ffd07822f03f90f637b13cd5" ON public.post_comments USING btree (post_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_post_comments_post_created ON public.post_comments USING btree (post_id, created_at)`,
    );
    await queryRunner.query(`ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT "FK_post_comments_post_id" FOREIGN KEY (post_id) REFERENCES public.posts(id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT "FK_post_comments_user_id" FOREIGN KEY (user_id) REFERENCES public.users(id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.post_comments`);
  }
}
