import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFieldPricing1790000000009 implements MigrationInterface {
  name = 'CreateFieldPricing1790000000009';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE public.field_pricing (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    field_court_id uuid NOT NULL,
    day_type public.day_type_enum NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    price numeric(15,2) NOT NULL
)`);
    await queryRunner.query(`ALTER TABLE ONLY public.field_pricing
    ADD CONSTRAINT "PK_921bd4d902b3804419d92c99806" PRIMARY KEY (id)`);
    await queryRunner.query(
      `CREATE INDEX idx_field_pricing_court ON public.field_pricing USING btree (field_court_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_field_pricing_court_day ON public.field_pricing USING btree (field_court_id, day_type)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_field_pricing_lookup ON public.field_pricing USING btree (field_court_id, day_type, start_time, end_time)`,
    );
    await queryRunner.query(`ALTER TABLE ONLY public.field_pricing
    ADD CONSTRAINT "FK_field_pricing_field_court_id" FOREIGN KEY (field_court_id) REFERENCES public.field_courts(id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.field_pricing`);
  }
}
