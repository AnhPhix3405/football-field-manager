import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1790000000001 implements MigrationInterface {
  name = 'CreateUsers1790000000001';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying NOT NULL,
    phone character varying,
    password_hash character varying,
    role public.user_role_enum DEFAULT 'user'::public.user_role_enum NOT NULL,
    status public.user_status_enum DEFAULT 'active'::public.user_status_enum NOT NULL,
    lat numeric(10,7),
    lng numeric(10,7),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    auth_provider character varying DEFAULT 'local'::character varying NOT NULL,
    provider_id character varying
)`);
    await queryRunner.query(`ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email)`);
    await queryRunner.query(`ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE (phone)`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON public.users USING btree (email)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f169d18dc7fce81f4c20974fd0" ON public.users USING btree (phone) WHERE (phone IS NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_users_auth_provider_id ON public.users USING btree (auth_provider, provider_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_users_role ON public.users USING btree (role)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_users_status ON public.users USING btree (status)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.users`);
  }
}
