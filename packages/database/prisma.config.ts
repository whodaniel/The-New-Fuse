import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

/**
 * Prisma v7 Configuration File
 *
 * This is the standard configuration for Prisma CLI operations.
 * The datasource URL is configured here instead of in schema.prisma
 * as per Prisma ORM v7 requirements.
 */

export default defineConfig({
  // Path to the Prisma schema file
  schema: 'prisma/schema.prisma',

  // Migrations configuration
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seed.ts',
  },

  // Database connection configuration
  datasource: {
    // The env() helper provides type-safe access to environment variables
    // and will throw an error if DATABASE_URL is not defined during commands
    // that require database access (migrate, db push, etc.)
    url: env('DATABASE_URL'),
  },
});
