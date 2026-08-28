import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePosts1790000000014 implements MigrationInterface {
  name = 'CreatePosts1790000000014';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE public.posts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    title character varying NOT NULL,
    content text,
    lat numeric(10,7),
    lng numeric(10,7),
    play_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone,
    skill_level_required public.post_skill_level_enum,
    status public.post_status_enum DEFAULT 'open'::public.post_status_enum NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    max_players integer NOT NULL
)`);
    await queryRunner.query(`ALTER TABLE ONLY public.posts
    ADD CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY (id)`);
    await queryRunner.query(
      `CREATE INDEX "IDX_7374a48c04249418e45384b643" ON public.posts USING btree (play_date)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9d6a751a1943909d10bcc5a140" ON public.posts USING btree (lat, lng)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c4f9a7bd77b489e711277ee598" ON public.posts USING btree (user_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_posts_deleted_at ON public.posts USING btree (deleted_at)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_posts_status ON public.posts USING btree (status)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_posts_status_created ON public.posts USING btree (status, created_at)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_posts_status_play_date ON public.posts USING btree (status, play_date)`,
    );
    await queryRunner.query(`ALTER TABLE ONLY public.posts
    ADD CONSTRAINT "FK_posts_user_id" FOREIGN KEY (user_id) REFERENCES public.users(id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.posts`);
  }
}
