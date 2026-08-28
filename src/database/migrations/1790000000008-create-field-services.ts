import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFieldServices1790000000008 implements MigrationInterface {
  name = 'CreateFieldServices1790000000008';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE public.field_services (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    field_id uuid NOT NULL,
    name character varying NOT NULL,
    price numeric(15,2) NOT NULL,
    unit character varying,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`ALTER TABLE ONLY public.field_services
    ADD CONSTRAINT "PK_17576d37a7a87eded4dd6eb36ea" PRIMARY KEY (id)`);
    await queryRunner.query(
      `CREATE INDEX "IDX_cb1beabceee095ac2e8ed72c25" ON public.field_services USING btree (field_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_field_services_field_active ON public.field_services USING btree (field_id, is_active)`,
    );
    await queryRunner.query(`ALTER TABLE ONLY public.field_services
    ADD CONSTRAINT "FK_field_services_field_id" FOREIGN KEY (field_id) REFERENCES public.fields(id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.field_services`);
  }
}
