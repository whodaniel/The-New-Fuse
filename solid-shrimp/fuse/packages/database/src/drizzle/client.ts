/**
 * Drizzle ORM Client
 * Provides the database connection and client instance
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Database connection URL
const connectionString = process.env.DATABASE_URL ?? 'postgresql://localhost:5432/fuse';

// Create the postgres.js client connection
// For query purposes (used by Drizzle ORM)
const queryClient = postgres(connectionString, {
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Idle connection timeout in seconds
  connect_timeout: 10, // Connection timeout in seconds
});

// Create the Drizzle ORM instance with schema
export const db = drizzle(queryClient, { schema });

// Export the schema for type inference
export { schema };

// Export the query client for direct SQL access if needed
export { queryClient };

// Type for the database instance
export type Database = typeof db;

// Type for transaction
export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
