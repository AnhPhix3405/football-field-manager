import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateConversationMembers1790000000017 implements MigrationInterface {
  name = 'CreateConversationMembers1790000000017';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE public.conversation_members (
    conversation_id uuid NOT NULL,
    user_id uuid NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    last_read_at timestamp with time zone
)`);
    await queryRunner.query(`ALTER TABLE ONLY public.conversation_members
    ADD CONSTRAINT "PK_5fa9076068b6f2a26fb793d2439" PRIMARY KEY (conversation_id, user_id)`);
    await queryRunner.query(
      `CREATE INDEX idx_conversation_members_user ON public.conversation_members USING btree (user_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_conversation_members_user_deleted ON public.conversation_members USING btree (user_id, deleted_at)`,
    );
    await queryRunner.query(`ALTER TABLE ONLY public.conversation_members
    ADD CONSTRAINT "FK_conversation_members_conversation_id" FOREIGN KEY (conversation_id) REFERENCES public.conversations(id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.conversation_members
    ADD CONSTRAINT "FK_conversation_members_user_id" FOREIGN KEY (user_id) REFERENCES public.users(id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.conversation_members`);
  }
}
