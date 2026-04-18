/**
 * Drizzle ORM Client
 * Provides the database connection and client instance
 */
// @ts-ignore
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Database connection URL
const connectionString =
  process.env.DATABASE_URL ??
  process.env.MARKETPLACE_DATABASE_URL ??
  'postgresql://localhost:5432/fuse';

// Create the postgres.js client connection
// For query purposes (used by Drizzle ORM)
export const queryClient = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create the Drizzle ORM instance with schema
export const db = drizzle(queryClient, { schema });

// Export the schema for type inference
export { schema };

// Type for the database instance
export type Database = typeof db;

// Type for transaction
export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
