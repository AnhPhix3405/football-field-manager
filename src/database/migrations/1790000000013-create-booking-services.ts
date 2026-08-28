import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBookingServices1790000000013 implements MigrationInterface {
  name = 'CreateBookingServices1790000000013';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE public.booking_services (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    booking_id uuid NOT NULL,
    service_id uuid NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    price_snapshot numeric(15,2) NOT NULL
)`);
    await queryRunner.query(`ALTER TABLE ONLY public.booking_services
    ADD CONSTRAINT "PK_8997bf4d0728c8740c87694d59a" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.booking_services
    ADD CONSTRAINT "UQ_12f15721492a512bc6165c44426" UNIQUE (booking_id, service_id)`);
    await queryRunner.query(
      `CREATE INDEX "IDX_813fb23d7e327b6d9cff929cce" ON public.booking_services USING btree (booking_id)`,
    );
    await queryRunner.query(`ALTER TABLE ONLY public.booking_services
    ADD CONSTRAINT "FK_booking_services_booking_id" FOREIGN KEY (booking_id) REFERENCES public.bookings(id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.booking_services
    ADD CONSTRAINT "FK_booking_services_service_id" FOREIGN KEY (service_id) REFERENCES public.field_services(id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.booking_services`);
  }
}
