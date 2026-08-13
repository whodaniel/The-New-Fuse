/**
 * Test Setup
 * Initializes test database and provides utilities for test execution
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as schema from '../src/drizzle/schema/index.js';

// Test database configuration
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgresql://newfuse:secretpass123@localhost:5433/the_new_fuse_test';

let testClient: postgres.Sql | null = null;
let testDb: ReturnType<typeof drizzle> | null = null;

/**
 * Get or create test database client
 */
export function getTestDb() {
  if (!testDb) {
    testClient = postgres(TEST_DATABASE_URL, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    testDb = drizzle(testClient, { schema });
  }
  return testDb;
}

/**
 * Get test database client
 */
export function getTestClient() {
  if (!testClient) {
    getTestDb(); // Initialize if not already done
  }
  return testClient!;
}

/**
 * Clear all tables in the test database
 * Truncates in reverse dependency order to avoid foreign key violations
 */
export async function clearAllTables() {
  const db = getTestDb();

  try {
    // Disable foreign key checks temporarily
    await db.execute(sql`SET session_replication_role = 'replica'`);

    // Truncate all tables in reverse dependency order
    const tables = [
      'workflow_template_steps',
      'workflow_templates',
      'workflow_executions',
      'workflow_steps',
      'workflows',
      'task_executions',
      'task_pipelines',
      'tasks',
      'chat_messages',
      'chats',
      'agent_onboarding_events',
      'agent_directory_entries',
      'agent_capabilities',
      'agent_registrations',
      'agents',
      'sessions',
      'users',
    ];

    for (const table of tables) {
      await db.execute(sql.raw(`TRUNCATE TABLE "${table}" CASCADE`));
    }

    // Re-enable foreign key checks
    await db.execute(sql`SET session_replication_role = 'origin'`);
  } catch (error) {
    // Re-enable foreign key checks even if truncate fails
    await db.execute(sql`SET session_replication_role = 'origin'`);
    throw error;
  }
}

/**
 * Setup function called before all tests
 */
beforeAll(async () => {
  // Initialize database connection
  getTestDb();

  // Ensure test database is clean
  await clearAllTables();
});

/**
 * Cleanup function called before each test
 */
beforeEach(async () => {
  // Clean database before each test for isolation
  await clearAllTables();
});

/**
 * Cleanup after all tests complete
 */
afterAll(async () => {
  if (testClient) {
    await testClient.end();
    testClient = null;
    testDb = null;
  }
});
