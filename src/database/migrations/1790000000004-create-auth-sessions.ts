import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthSessions1790000000004 implements MigrationInterface {
  name = 'CreateAuthSessions1790000000004';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE public.auth_sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_hash character varying(64) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    replaced_by_session_id uuid,
    user_agent character varying,
    ip_address character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`ALTER TABLE ONLY public.auth_sessions
    ADD CONSTRAINT "PK_auth_sessions" PRIMARY KEY (id)`);
    await queryRunner.query(
      `CREATE INDEX "IDX_auth_sessions_user_revoked" ON public.auth_sessions USING btree (user_id, revoked_at)`,
    );
    await queryRunner.query(`ALTER TABLE ONLY public.auth_sessions
    ADD CONSTRAINT "FK_auth_sessions_user" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.auth_sessions`);
  }
}
