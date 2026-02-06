import { afterAll, beforeAll, jest } from '@jest/globals';
import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
const vi = jest;

// Global test setup for integration tests
export async function setupIntegrationTests() {
  console.log('🚀 Setting up integration test environment...');

  // Ensure test environment variables are set
  if (!process.env.TEST_DATABASE_URL) {
    process.env.TEST_DATABASE_URL =
      'postgresql://postgres:postgres@localhost:5432/sync_integration_test';
  }

  if (!process.env.TEST_REDIS_URL) {
    process.env.TEST_REDIS_URL = 'redis://localhost:6379/15';
  }

  // Set test environment
  process.env.NODE_ENV = 'test';

  try {
    // Ensure test database exists and is migrated
    console.log('📊 Setting up test database...');
    execSync('npx db db push --force-reset', {
      env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
      stdio: 'pipe',
    });
    console.log('✅ Test database ready');
  } catch (error) {
    console.warn('⚠️  Database setup failed, tests may fail:', error);
  }

  // Create test artifacts directory
  const artifactsDir = path.join(process.cwd(), 'test-artifacts', 'integration');
  await fs.mkdir(artifactsDir, { recursive: true });
  process.env.TEST_ARTIFACTS_DIR = artifactsDir;

  console.log('✅ Integration test environment ready');
}

export async function teardownIntegrationTests() {
  console.log('🧹 Cleaning up integration test environment...');

  // Additional cleanup can be added here if needed

  console.log('✅ Integration test cleanup complete');
}

// Global setup and teardown
beforeAll(async () => {
  await setupIntegrationTests();
}, 30000); // 30 second timeout for setup

afterAll(async () => {
  await teardownIntegrationTests();
});
