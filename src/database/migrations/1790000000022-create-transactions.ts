import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTransactions1790000000022 implements MigrationInterface {
  name = 'CreateTransactions1790000000022';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE public.transactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    type public.transaction_type_enum NOT NULL,
    ref_id uuid NOT NULL,
    amount numeric(15,2) NOT NULL,
    status public.transaction_status_enum DEFAULT 'pending'::public.transaction_status_enum NOT NULL,
    gateway character varying,
    gateway_ref character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY (id)`);
    await queryRunner.query(
      `CREATE INDEX "IDX_4ca327ebb6c902e8bad5932105" ON public.transactions USING btree (type, ref_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e9acc6efa76de013e8c1553ed2" ON public.transactions USING btree (user_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_transactions_gateway_ref ON public.transactions USING btree (gateway_ref)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_transactions_ref_id ON public.transactions USING btree (ref_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_transactions_status ON public.transactions USING btree (status)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_transactions_user_created ON public.transactions USING btree (user_id, created_at)`,
    );
    await queryRunner.query(`ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT "FK_transactions_user_id" FOREIGN KEY (user_id) REFERENCES public.users(id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.transactions`);
  }
}
