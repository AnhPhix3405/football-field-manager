import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMatchingMetadata1787560000000
  implements MigrationInterface
{
  name = 'AddMatchingMetadata1787560000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "posts" ADD "players_needed" integer NOT NULL DEFAULT 1',
    );
    await queryRunner.query(
      'ALTER TABLE "posts" ADD "accepted_players" integer NOT NULL DEFAULT 0',
    );
    await queryRunner.query(
      'ALTER TABLE "posts" ADD CONSTRAINT "CHK_posts_player_counts" CHECK ("accepted_players" >= 0 AND "players_needed" >= 1 AND "accepted_players" <= "players_needed")',
    );
    await queryRunner.query(
      'ALTER TABLE "post_matches" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()',
    );
    await queryRunner.query(
      'ALTER TABLE "post_matches" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "post_matches" DROP COLUMN "updated_at"',
    );
    await queryRunner.query(
      'ALTER TABLE "post_matches" DROP COLUMN "created_at"',
    );
    await queryRunner.query(
      'ALTER TABLE "posts" DROP CONSTRAINT "CHK_posts_player_counts"',
    );
    await queryRunner.query(
      'ALTER TABLE "posts" DROP COLUMN "accepted_players"',
    );
    await queryRunner.query(
      'ALTER TABLE "posts" DROP COLUMN "players_needed"',
    );
  }
}
