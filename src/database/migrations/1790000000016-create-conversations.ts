import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateConversations1790000000016 implements MigrationInterface {
  name = 'CreateConversations1790000000016';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE public.conversations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    type public.conversation_type_enum DEFAULT 'direct'::public.conversation_type_enum NOT NULL,
    related_post_id uuid,
    related_field_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT "PK_ee34f4f7ced4ec8681f26bf04ef" PRIMARY KEY (id)`);
    await queryRunner.query(
      `CREATE INDEX "IDX_19bb13367263f4abb451b75838" ON public.conversations USING btree (related_post_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d863718b78a19a4259f34dcae2" ON public.conversations USING btree (related_field_id)`,
    );
    await queryRunner.query(`ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT "FK_conversations_related_field_id" FOREIGN KEY (related_field_id) REFERENCES public.fields(id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT "FK_conversations_related_post_id" FOREIGN KEY (related_post_id) REFERENCES public.posts(id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.conversations`);
  }
}
