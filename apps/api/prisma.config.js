/**
 * Prisma Configuration
 * Centralized configuration for Prisma client with support for:
 * - Environment variables
 * - Railway deployment
 * - Local development
 * - Production environments
 */

/**
 * Get database URL for Prisma client
 * Supports Railway environment and local development
 */
function getDatabaseUrl() {
  // Try Railway DATABASE_URL first
  const railwayUrl = process.env.DATABASE_URL;
  if (railwayUrl) {
    return railwayUrl;
  }

  // Fallback to individual environment variables for local development
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const user = process.env.DB_USERNAME || 'postgres';
  const password = process.env.DB_PASSWORD || 'postgres';
  const database = process.env.DB_DATABASE || 'the_new_fuse';

  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}

/**
 * Get Prisma client configuration
 * This is used to configure the PrismaClient constructor
 */
const config = {
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
};

module.exports = config;
