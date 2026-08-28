import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFieldOpeningHours1790000000010 implements MigrationInterface {
  name = 'CreateFieldOpeningHours1790000000010';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE public.field_opening_hours (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    field_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    open_time time without time zone,
    close_time time without time zone,
    is_closed boolean DEFAULT false NOT NULL
)`);
    await queryRunner.query(`ALTER TABLE ONLY public.field_opening_hours
    ADD CONSTRAINT pk_field_opening_hours PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.field_opening_hours
    ADD CONSTRAINT uq_field_opening_hours_day UNIQUE (field_id, day_of_week)`);
    await queryRunner.query(`ALTER TABLE ONLY public.field_opening_hours
    ADD CONSTRAINT "FK_field_opening_hours_field_id" FOREIGN KEY (field_id) REFERENCES public.fields(id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.field_opening_hours`);
  }
}
