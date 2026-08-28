import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserProfiles1790000000002 implements MigrationInterface {
  name = 'CreateUserProfiles1790000000002';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE public.user_profiles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    full_name character varying,
    avatar_url character varying,
    bio text,
    skill_level public.skill_level_enum,
    birthday date,
    gender character varying
)`);
    await queryRunner.query(`ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT "PK_1ec6662219f4605723f1e41b6cb" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT "UQ_6ca9503d77ae39b4b5a6cc3ba88" UNIQUE (user_id)`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_6ca9503d77ae39b4b5a6cc3ba8" ON public.user_profiles USING btree (user_id)`,
    );
    await queryRunner.query(`ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT "FK_user_profiles_user_id" FOREIGN KEY (user_id) REFERENCES public.users(id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.user_profiles`);
  }
}
