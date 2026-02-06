/**
 * Database Helper Utilities
 * Provides utility functions for test database operations
 */

import { sql } from 'drizzle-orm';
import { getTestDb } from '../setup';

/**
 * Execute raw SQL query (for setup/cleanup tasks)
 */
export async function executeRawSQL(query: string) {
  const db = getTestDb();
  return db.execute(sql.raw(query));
}

/**
 * Check if a table exists in the database
 */
export async function tableExists(tableName: string): Promise<boolean> {
  const db = getTestDb();
  const result = await db.execute(sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_name = ${tableName}
    );
  `);
  return result.rows[0]?.exists || false;
}

/**
 * Count rows in a table
 */
export async function countRows(tableName: string): Promise<number> {
  const db = getTestDb();
  const result = await db.execute(sql.raw(`SELECT COUNT(*) FROM "${tableName}"`));
  return parseInt(result.rows[0]?.count || '0', 10);
}

/**
 * Truncate a specific table
 */
export async function truncateTable(tableName: string): Promise<void> {
  const db = getTestDb();
  await db.execute(sql.raw(`TRUNCATE TABLE "${tableName}" CASCADE`));
}

/**
 * Get all rows from a table (for debugging)
 */
export async function getAllRows(tableName: string): Promise<any[]> {
  const db = getTestDb();
  const result = await db.execute(sql.raw(`SELECT * FROM "${tableName}"`));
  return result.rows;
}

/**
 * Wait for a condition to be true (polling with timeout)
 */
export async function waitForCondition(
  condition: () => Promise<boolean>,
  timeoutMs = 5000,
  pollIntervalMs = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Condition not met within ${timeoutMs}ms`);
}

/**
 * Sleep for a specified duration (for timing tests)
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a unique test identifier
 */
export function generateTestId(prefix = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a timestamp N seconds in the future
 */
export function futureTimestamp(secondsFromNow: number): Date {
  const date = new Date();
  date.setSeconds(date.getSeconds() + secondsFromNow);
  return date;
}

/**
 * Create a timestamp N seconds in the past
 */
export function pastTimestamp(secondsAgo: number): Date {
  const date = new Date();
  date.setSeconds(date.getSeconds() - secondsAgo);
  return date;
}

/**
 * Measure execution time of an async function
 */
export async function measureExecutionTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; durationMs: number }> {
  const startTime = performance.now();
  const result = await fn();
  const durationMs = performance.now() - startTime;
  return { result, durationMs };
}
