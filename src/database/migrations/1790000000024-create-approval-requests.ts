import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateApprovalRequests1790000000024 implements MigrationInterface {
  name = 'CreateApprovalRequests1790000000024';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE public.approval_requests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    type public.approval_type_enum NOT NULL,
    target_id uuid NOT NULL,
    requested_by uuid NOT NULL,
    status public.approval_status_enum DEFAULT 'pending'::public.approval_status_enum NOT NULL,
    reviewed_by uuid,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    reviewed_at timestamp with time zone
)`);
    await queryRunner.query(`ALTER TABLE ONLY public.approval_requests
    ADD CONSTRAINT "PK_484806bb8ff331b851fc75973c0" PRIMARY KEY (id)`);
    await queryRunner.query(
      `CREATE INDEX "IDX_0bcfff2aed6c93f6fa089720b3" ON public.approval_requests USING btree (requested_by)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_802fa9cdd54c528cbd63a3b148" ON public.approval_requests USING btree (type, target_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_approval_requests_reviewed_by ON public.approval_requests USING btree (reviewed_by)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_approval_requests_status ON public.approval_requests USING btree (status)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_approval_requests_status_created ON public.approval_requests USING btree (status, created_at)`,
    );
    await queryRunner.query(`ALTER TABLE ONLY public.approval_requests
    ADD CONSTRAINT "FK_approval_requests_requested_by" FOREIGN KEY (requested_by) REFERENCES public.users(id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.approval_requests
    ADD CONSTRAINT "FK_approval_requests_reviewed_by" FOREIGN KEY (reviewed_by) REFERENCES public.users(id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.approval_requests`);
  }
}
