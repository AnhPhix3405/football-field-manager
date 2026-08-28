import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFieldCourts1790000000006 implements MigrationInterface {
  name = 'CreateFieldCourts1790000000006';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE public.field_courts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    field_id uuid NOT NULL,
    name character varying NOT NULL,
    type character varying NOT NULL,
    status public.court_status_enum DEFAULT 'active'::public.court_status_enum NOT NULL
)`);
    await queryRunner.query(`ALTER TABLE ONLY public.field_courts
    ADD CONSTRAINT "PK_6be33cd911868d7f7c578cbc93c" PRIMARY KEY (id)`);
    await queryRunner.query(
      `CREATE INDEX "IDX_bb774c35a4f3285bf483e801e5" ON public.field_courts USING btree (field_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_field_courts_field_status ON public.field_courts USING btree (field_id, status)`,
    );
    await queryRunner.query(`ALTER TABLE ONLY public.field_courts
    ADD CONSTRAINT "FK_field_courts_field_id" FOREIGN KEY (field_id) REFERENCES public.fields(id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.field_courts`);
  }
}
