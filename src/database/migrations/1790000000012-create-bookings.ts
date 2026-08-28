import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBookings1790000000012 implements MigrationInterface {
  name = 'CreateBookings1790000000012';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE public.bookings (
        id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
        user_id uuid NOT NULL,
        field_id uuid NOT NULL,
        field_court_id uuid,
        booking_date date NOT NULL,
        start_time time without time zone NOT NULL,
        end_time time without time zone NOT NULL,
        status public.booking_status_enum DEFAULT 'pending'::public.booking_status_enum NOT NULL,
        total_price numeric(15,2) NOT NULL,
        payment_method public.payment_method_enum,
        payment_status public.payment_status_enum DEFAULT 'unpaid'::public.payment_status_enum NOT NULL,
        deposit_amount numeric(15,2) DEFAULT '0'::numeric NOT NULL,
        owner_note text,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL,
        cancelled_by uuid,
        cancel_reason text,
        CONSTRAINT "CHK_bookings_valid_time" CHECK ((start_time < end_time))
    )`);
    await queryRunner.query(`ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT "EXCL_bookings_no_overlap" EXCLUDE USING gist (field_court_id WITH =, booking_date WITH =, tsrange((booking_date + start_time), (booking_date + end_time), '[)'::text) WITH &&) WHERE (((field_court_id IS NOT NULL) AND (status = 'confirmed'::public.booking_status_enum)))`);
    await queryRunner.query(`ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT "PK_bee6805982cc1e248e94ce94957" PRIMARY KEY (id)`);
    await queryRunner.query(
      `CREATE INDEX "IDX_64cd97487c5c42806458ab5520" ON public.bookings USING btree (user_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_88c0e04c7c95a23d0049ba05fc" ON public.bookings USING btree (field_court_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f80ee3c0f6b2adf57520dc9e97" ON public.bookings USING btree (field_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_bookings_court_date ON public.bookings USING btree (field_court_id, booking_date)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_bookings_court_time ON public.bookings USING btree (field_court_id, booking_date, start_time, end_time)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_bookings_date ON public.bookings USING btree (booking_date)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_bookings_field_date ON public.bookings USING btree (field_id, booking_date)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_bookings_status ON public.bookings USING btree (status)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_bookings_user_created ON public.bookings USING btree (user_id, created_at)`,
    );
    await queryRunner.query(`ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT "FK_bookings_cancelled_by" FOREIGN KEY (cancelled_by) REFERENCES public.users(id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT "FK_bookings_field_court_id" FOREIGN KEY (field_court_id) REFERENCES public.field_courts(id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT "FK_bookings_field_id" FOREIGN KEY (field_id) REFERENCES public.fields(id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT "FK_bookings_user_id" FOREIGN KEY (user_id) REFERENCES public.users(id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.bookings`);
  }
}
