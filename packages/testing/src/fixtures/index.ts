/**
 * Test Fixtures
 *
 * Common test data and fixtures for use across the monorepo.
 */

import { randomString, randomEmail, randomUUID } from '../utils/test-helpers.js';

/**
 * User fixtures
 */
export const createUserFixture = (overrides: Partial<any> = {}) => ({
  id: randomUUID(),
  email: randomEmail(),
  name: `Test User ${randomString(5)}`,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Agent fixtures
 */
export const createAgentFixture = (overrides: Partial<any> = {}) => ({
  id: randomUUID(),
  name: `Test Agent ${randomString(5)}`,
  type: 'test',
  status: 'active',
  capabilities: ['test-capability'],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Workflow fixtures
 */
export const createWorkflowFixture = (overrides: Partial<any> = {}) => ({
  id: randomUUID(),
  name: `Test Workflow ${randomString(5)}`,
  description: 'Test workflow description',
  nodes: [],
  edges: [],
  status: 'draft',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Message fixtures
 */
export const createMessageFixture = (overrides: Partial<any> = {}) => ({
  id: randomUUID(),
  content: `Test message ${randomString(10)}`,
  role: 'user',
  timestamp: new Date(),
  ...overrides,
});

/**
 * API Response fixtures
 */
export const createApiResponseFixture = <T>(data: T, overrides: Partial<any> = {}) => ({
  success: true,
  data,
  message: 'Success',
  timestamp: new Date().toISOString(),
  ...overrides,
});

/**
 * Error fixtures
 */
export const createErrorFixture = (overrides: Partial<any> = {}) => ({
  success: false,
  error: {
    code: 'TEST_ERROR',
    message: 'Test error message',
    details: {},
  },
  timestamp: new Date().toISOString(),
  ...overrides,
});

/**
 * Pagination fixtures
 */
export const createPaginationFixture = (overrides: Partial<any> = {}) => ({
  page: 1,
  limit: 10,
  total: 100,
  totalPages: 10,
  hasNext: true,
  hasPrev: false,
  ...overrides,
});

/**
 * Create array of fixtures
 */
export function createFixtureArray<T>(
  fixtureFactory: (overrides?: any) => T,
  count: number,
  overrides?: Partial<T>
): T[] {
  return Array.from({ length: count }, (_, index) =>
    fixtureFactory({ ...overrides, index })
  );
}
