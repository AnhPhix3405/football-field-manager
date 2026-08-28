import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFieldImages1790000000007 implements MigrationInterface {
  name = 'CreateFieldImages1790000000007';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE public.field_images (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    field_id uuid NOT NULL,
    url character varying NOT NULL,
    is_thumbnail boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`ALTER TABLE ONLY public.field_images
    ADD CONSTRAINT "PK_fcdca2406605c29b9f9ead003af" PRIMARY KEY (id)`);
    await queryRunner.query(
      `CREATE INDEX "IDX_756ccc25e9484dcf6453f90947" ON public.field_images USING btree (field_id)`,
    );
    await queryRunner.query(`ALTER TABLE ONLY public.field_images
    ADD CONSTRAINT "FK_field_images_field_id" FOREIGN KEY (field_id) REFERENCES public.fields(id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.field_images`);
  }
}
