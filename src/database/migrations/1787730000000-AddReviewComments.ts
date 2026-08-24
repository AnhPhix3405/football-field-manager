import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReviewComments1787730000000 implements MigrationInterface {
  name = 'AddReviewComments1787730000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "field_reviews" ADD "comment" text',
    );
    await queryRunner.query(
      'ALTER TABLE "user_reviews" ADD "comment" text',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "user_reviews" DROP COLUMN "comment"',
    );
    await queryRunner.query(
      'ALTER TABLE "field_reviews" DROP COLUMN "comment"',
    );
  }
}
