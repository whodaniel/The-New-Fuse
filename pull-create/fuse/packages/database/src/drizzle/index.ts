/**
 * Drizzle ORM Index
 * Central export point for all Drizzle-related modules
 */

// Export the database client and types
export { db, queryClient, schema, type Database, type Transaction } from './client';

// Export NestJS module and service
export {
  DRIZZLE_CLIENT,
  DrizzleModule,
  DrizzleService,
  type DrizzleClient,
  type DrizzleModuleOptions,
} from './drizzle.module';

// Export all schema tables
export * from './schema';

// Export all inferred types
export * from './types';

// Export all repositories
export * from './repositories';

// Export compatibility layer for Drizzle migration
export * from './compatibility';

// Export DatabaseService (unified database access layer)
// DrizzleService is exported from drizzle.module above for backwards compatibility
export { DatabaseService } from './database.service';

// Re-export useful Drizzle utilities
export {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  like,
  lt,
  lte,
  ne,
  not,
  notInArray,
  or,
  sql,
} from 'drizzle-orm';
