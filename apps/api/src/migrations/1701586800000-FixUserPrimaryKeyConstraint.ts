import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixUserPrimaryKeyConstraint1701586800000 implements MigrationInterface {
  name = 'FixUserPrimaryKeyConstraint1701586800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // This migration handles the schema synchronization issue
    // Instead of dropping the primary key constraint, we'll ensure it exists properly

    // Check if the users table exists
    const tableExists = await queryRunner.hasTable('users');
    if (!tableExists) {
      // Create users table if it doesn't exist
      await queryRunner.query(`
                CREATE TABLE "users" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "email" character varying(255) NOT NULL,
                    "hashedPassword" character varying NOT NULL,
                    "name" character varying(100),
                    "role" character varying(50) NOT NULL DEFAULT 'user',
                    "refreshToken" character varying(500),
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "deletedAt" TIMESTAMP,
                    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
                    CONSTRAINT "UQ_users_email" UNIQUE ("email")
                )
            `);
    }

    // Ensure the primary key constraint exists
    await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'users_pkey'
                    AND conrelid = 'users'::regclass
                ) THEN
                    ALTER TABLE "users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");
                END IF;
            END $$;
        `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // This migration is not reversible as it's fixing a schema issue
  }
}
