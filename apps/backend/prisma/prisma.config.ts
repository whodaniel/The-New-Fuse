/**
 * Prisma Configuration for Migrate
 * This file contains the database connection configuration for Prisma Migrate
 * as required by the new Prisma 7+ configuration approach.
 *
 * See: https://pris.ly/d/config-datasource
 */

import { defineConfig } from '@prisma/migrate';

export default defineConfig({
  datasource: {
    provider: 'postgresql',
    // Connection URL for Prisma Migrate
    url: process.env.DATABASE_URL,
  },
});
