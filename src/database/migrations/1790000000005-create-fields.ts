import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFields1790000000005 implements MigrationInterface {
  name = 'CreateFields1790000000005';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE public.fields (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    owner_id uuid NOT NULL,
    name character varying NOT NULL,
    address character varying NOT NULL,
    district character varying,
    lat numeric(10,7),
    lng numeric(10,7),
    description text,
    status public.field_status_enum DEFAULT 'pending'::public.field_status_enum NOT NULL,
    require_deposit boolean DEFAULT false NOT NULL,
    deposit_type public.deposit_type_enum,
    deposit_value numeric(15,2),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`ALTER TABLE ONLY public.fields
    ADD CONSTRAINT "PK_ee7a215c6cd77a59e2cb3b59d41" PRIMARY KEY (id)`);
    await queryRunner.query(
      `CREATE INDEX "IDX_bb540818c27426841e06b36b09" ON public.fields USING btree (district)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fd7b6f73d3dbe8cb0cc5cd510c" ON public.fields USING btree (owner_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_fields_lat_lng ON public.fields USING btree (lat, lng)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_fields_status ON public.fields USING btree (status)`,
    );
    await queryRunner.query(`ALTER TABLE ONLY public.fields
    ADD CONSTRAINT "FK_fields_owner_id" FOREIGN KEY (owner_id) REFERENCES public.users(id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.fields`);
  }
}
