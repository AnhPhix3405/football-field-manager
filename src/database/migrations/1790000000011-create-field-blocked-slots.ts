import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFieldBlockedSlots1790000000011 implements MigrationInterface {
  name = 'CreateFieldBlockedSlots1790000000011';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE public.field_blocked_slots (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    field_court_id uuid NOT NULL,
    blocked_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    reason character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`ALTER TABLE ONLY public.field_blocked_slots
    ADD CONSTRAINT pk_field_blocked_slots PRIMARY KEY (id)`);
    await queryRunner.query(
      `CREATE INDEX idx_field_blocked_slots_court ON public.field_blocked_slots USING btree (field_court_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_field_blocked_slots_court_date ON public.field_blocked_slots USING btree (field_court_id, blocked_date)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_field_blocked_slots_lookup ON public.field_blocked_slots USING btree (field_court_id, blocked_date, start_time, end_time)`,
    );
    await queryRunner.query(`ALTER TABLE ONLY public.field_blocked_slots
    ADD CONSTRAINT "FK_field_blocked_slots_field_court_id" FOREIGN KEY (field_court_id) REFERENCES public.field_courts(id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.field_blocked_slots`);
  }
}
