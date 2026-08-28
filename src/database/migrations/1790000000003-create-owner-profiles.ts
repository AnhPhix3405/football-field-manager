import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOwnerProfiles1790000000003 implements MigrationInterface {
  name = 'CreateOwnerProfiles1790000000003';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE public.owner_profiles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    business_name character varying,
    business_license character varying,
    bank_account character varying,
    verified_at timestamp with time zone
)`);
    await queryRunner.query(`ALTER TABLE ONLY public.owner_profiles
    ADD CONSTRAINT "PK_f50964d90a34725685860cbdda5" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.owner_profiles
    ADD CONSTRAINT "UQ_f9da160266a21b0f39b6aeaca7a" UNIQUE (user_id)`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f9da160266a21b0f39b6aeaca7" ON public.owner_profiles USING btree (user_id)`,
    );
    await queryRunner.query(`ALTER TABLE ONLY public.owner_profiles
    ADD CONSTRAINT "FK_owner_profiles_user_id" FOREIGN KEY (user_id) REFERENCES public.users(id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.owner_profiles`);
  }
}
