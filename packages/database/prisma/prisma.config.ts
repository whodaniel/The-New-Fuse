/**
 * Prisma Configuration for Migrate
 * This file contains the database connection configuration for Prisma Migrate
 * as required by the new Prisma 7+ configuration approach.
 *
 * See: https://pris.ly/d/config-datasource
 */
import { defineConfig } from '@prisma/migrate';

export default defineConfig({
  schema: './schema.prisma',
  datasources: { db: { url: process.env.DATABASE_URL } },
});
