/**
 * Prisma Configuration
 * This file contains the database connection configuration for Prisma
 */
export default {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
};
