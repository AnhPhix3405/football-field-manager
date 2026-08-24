import { MigrationInterface, QueryRunner } from 'typeorm';

export class PreventOverlappingBookings1787650000000
  implements MigrationInterface
{
  name = 'PreventOverlappingBookings1787650000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "btree_gist"');
    await queryRunner.query(
      'ALTER TABLE "bookings" ADD CONSTRAINT "CHK_bookings_valid_time" CHECK ("start_time" < "end_time")',
    );
    await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD CONSTRAINT "EXCL_bookings_no_overlap"
      EXCLUDE USING gist (
        "field_court_id" WITH =,
        "booking_date" WITH =,
        tsrange(
          ("booking_date" + "start_time")::timestamp,
          ("booking_date" + "end_time")::timestamp,
          '[)'
        ) WITH &&
      )
      WHERE (
        "field_court_id" IS NOT NULL
        AND "status" IN ('pending', 'confirmed')
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "bookings" DROP CONSTRAINT "EXCL_bookings_no_overlap"',
    );
    await queryRunner.query(
      'ALTER TABLE "bookings" DROP CONSTRAINT "CHK_bookings_valid_time"',
    );
  }
}
