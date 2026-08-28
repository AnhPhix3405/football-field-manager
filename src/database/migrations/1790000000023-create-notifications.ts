import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotifications1790000000023 implements MigrationInterface {
  name = 'CreateNotifications1790000000023';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    type public.notification_type_enum NOT NULL,
    title character varying NOT NULL,
    content text,
    ref_id uuid,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY (id)`);
    await queryRunner.query(
      `CREATE INDEX "IDX_0f57a0c3adbbfd460935b7b046" ON public.notifications USING btree (user_id, is_read, created_at)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_notifications_user_created ON public.notifications USING btree (user_id, created_at)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_notifications_user_read ON public.notifications USING btree (user_id, is_read)`,
    );
    await queryRunner.query(`ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "FK_notifications_user_id" FOREIGN KEY (user_id) REFERENCES public.users(id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.notifications`);
  }
}
