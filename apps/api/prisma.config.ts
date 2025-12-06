/**
 * Prisma Configuration for Prisma 7+
 * This file contains the database connection configuration for Prisma Migrate
 * as required by the new Prisma 7+ configuration approach.
 *
 * See: https://pris.ly/d/config-datasource
 */

import { defineConfig } from 'prisma/config';

export default defineConfig({
  datasource: {
    provider: 'postgresql',
    // Connection URL for Prisma Migrate - Railway provides DATABASE_URL
    url: process.env.DATABASE_URL ?? '',
  },
});
