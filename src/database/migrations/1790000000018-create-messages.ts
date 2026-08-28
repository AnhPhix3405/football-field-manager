import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMessages1790000000018 implements MigrationInterface {
  name = 'CreateMessages1790000000018';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE public.messages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    conversation_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    content text,
    message_type public.message_type_enum DEFAULT 'text'::public.message_type_enum NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY (id)`);
    await queryRunner.query(
      `CREATE INDEX "IDX_22133395bd13b970ccd0c34ab2" ON public.messages USING btree (sender_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8584a1974e1ca95f4861d975ff" ON public.messages USING btree (conversation_id, created_at)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_messages_conversation ON public.messages USING btree (conversation_id)`,
    );
    await queryRunner.query(`ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "FK_messages_conversation_id" FOREIGN KEY (conversation_id) REFERENCES public.conversations(id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "FK_messages_sender_id" FOREIGN KEY (sender_id) REFERENCES public.users(id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.messages`);
  }
}
