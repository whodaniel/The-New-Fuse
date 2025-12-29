# Phase 4: Integration Test Suite - Implementation Plan

**Date**: December 29, 2024
**Priority**: HIGH (User-requested)
**Estimate**: 3-4 days
**Status**: PLANNING

## 🎯 Objectives

Create a comprehensive integration test suite for all Drizzle ORM repositories to ensure:
1. All 88 repository methods work correctly
2. Database operations are reliable and consistent
3. Performance benchmarks are established
4. Data integrity is maintained
5. Error handling works as expected

## 📋 Scope

### Repositories to Test (5 total, 88 methods)

1. **DrizzleUserRepository** (15 methods)
   - User CRUD operations
   - Session management
   - Email/username lookups
   - Password management

2. **DrizzleAgentRepository** (23 methods)
   - Agent CRUD operations
   - Search and filtering
   - Registration workflow
   - Capability management
   - Directory entries

3. **DrizzleChatRepository** (12 methods)
   - Chat and message CRUD
   - Ephemeral messages
   - History retrieval
   - Cleanup operations

4. **DrizzleTaskRepository** (18 methods)
   - Task management
   - Pipeline operations
   - Execution tracking
   - Status management

5. **DrizzleWorkflowRepository** (20 methods)
   - Workflow CRUD
   - Step management
   - Execution tracking
   - Template operations

## 🏗️ Test Infrastructure

### Test Environment Setup

```typescript
// packages/database/__tests__/setup.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/drizzle/schema';

// Test database configuration
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ||
  'postgresql://newfuse:secretpass123@localhost:5433/the_new_fuse_test';

let testDb: any;
let testClient: any;

export async function setupTestDatabase() {
  testClient = postgres(TEST_DATABASE_URL, { max: 1 });
  testDb = drizzle(testClient, { schema });

  // Run migrations
  // Clean all tables

  return testDb;
}

export async function teardownTestDatabase() {
  await testClient.end();
}

export async function clearAllTables() {
  // Truncate all tables in reverse dependency order
}
```

### Test Utilities

```typescript
// packages/database/__tests__/utils/factories.ts
/**
 * Test data factories for creating consistent test fixtures
 */

export const UserFactory = {
  build: (overrides = {}) => ({
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
    hashedPassword: '$2b$10$...',
    ...overrides,
  }),
};

export const AgentFactory = {
  build: (overrides = {}) => ({
    name: `test-agent-${Date.now()}`,
    userId: 'user-id',
    type: 'CHAT',
    status: 'ACTIVE',
    ...overrides,
  }),
};

// ... similar factories for other entities
```

### Assertion Helpers

```typescript
// packages/database/__tests__/utils/assertions.ts
/**
 * Custom assertions for database tests
 */

export function expectDatabaseRow(row: any, expected: Partial<any>) {
  expect(row).toBeDefined();
  expect(row).toMatchObject(expected);
  expect(row.id).toBeDefined();
  expect(row.createdAt).toBeInstanceOf(Date);
  expect(row.updatedAt).toBeInstanceOf(Date);
}

export function expectSoftDeleted(row: any) {
  expect(row).toBeNull(); // Soft deleted rows should not be returned
}

export function expectTimestampValid(timestamp: Date) {
  expect(timestamp).toBeInstanceOf(Date);
  expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
}
```

## 📝 Test Structure

### Test File Organization

```
packages/database/
├── __tests__/
│   ├── setup.ts                          # Test environment setup
│   ├── teardown.ts                       # Test cleanup
│   ├── utils/
│   │   ├── factories.ts                  # Test data factories
│   │   ├── assertions.ts                 # Custom assertions
│   │   └── database-helpers.ts           # DB utility functions
│   ├── repositories/
│   │   ├── user.repository.test.ts       # 15 tests
│   │   ├── agent.repository.test.ts      # 23 tests
│   │   ├── chat.repository.test.ts       # 12 tests
│   │   ├── task.repository.test.ts       # 18 tests
│   │   └── workflow.repository.test.ts   # 20 tests
│   └── performance/
│       ├── benchmark.test.ts             # Performance tests
│       └── load.test.ts                  # Load tests
└── jest.config.js                        # Jest configuration
```

### Test Pattern for Each Repository

```typescript
// Example: packages/database/__tests__/repositories/user.repository.test.ts
import { setupTestDatabase, teardownTestDatabase, clearAllTables } from '../setup';
import { drizzleUserRepository } from '../../src/drizzle/repositories/user.repository';
import { UserFactory } from '../utils/factories';
import { expectDatabaseRow } from '../utils/assertions';

describe('DrizzleUserRepository', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearAllTables();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = UserFactory.build();
      const user = await drizzleUserRepository.create(userData);

      expectDatabaseRow(user, {
        email: userData.email,
        name: userData.name,
      });
      expect(user.hashedPassword).toBe(userData.hashedPassword);
    });

    it('should enforce unique email constraint', async () => {
      const userData = UserFactory.build();
      await drizzleUserRepository.create(userData);

      // Attempt to create duplicate should fail
      await expect(
        drizzleUserRepository.create(userData)
      ).rejects.toThrow();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const userData = UserFactory.build();
      const created = await drizzleUserRepository.create(userData);

      const found = await drizzleUserRepository.findByEmail(userData.email);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });

    it('should return null for non-existent email', async () => {
      const found = await drizzleUserRepository.findByEmail('nonexistent@example.com');
      expect(found).toBeNull();
    });
  });

  // ... 13 more test suites for remaining methods
});
```

## 🎯 Test Categories

### 1. CRUD Operations (Happy Path)
- Create entities with valid data
- Read entities by ID, email, etc.
- Update entities with valid data
- Delete entities (soft delete)

### 2. Edge Cases
- Non-existent IDs return null
- Soft-deleted entities are filtered out
- Empty result sets handled correctly
- Null/undefined parameter handling

### 3. Data Validation
- Required fields enforced
- Unique constraints respected
- Foreign key relationships maintained
- Data types validated

### 4. Pagination
- Page 1 returns first N items
- Offset/limit work correctly
- Total count is accurate
- Empty pages handled

### 5. Search and Filtering
- Case-insensitive search works
- Multiple criteria AND together correctly
- Empty search returns all results
- Special characters handled

### 6. Concurrent Operations
- Multiple creates don't conflict
- Optimistic locking (if implemented)
- Race conditions handled

### 7. Error Handling
- Database errors thrown correctly
- Constraint violations caught
- Transaction rollbacks work
- Timeout handling

### 8. Performance Benchmarks
- Create operations < 50ms (single)
- Read operations < 10ms (by ID)
- Pagination < 100ms (page of 50)
- Complex queries < 200ms

## 📊 Coverage Goals

### Code Coverage Targets
- **Line Coverage**: 90%+
- **Branch Coverage**: 85%+
- **Function Coverage**: 100%
- **Statement Coverage**: 90%+

### Test Coverage Matrix

| Repository | Methods | Tests | Coverage Target |
|------------|---------|-------|-----------------|
| User       | 15      | 30+   | 95%             |
| Agent      | 23      | 46+   | 95%             |
| Chat       | 12      | 24+   | 95%             |
| Task       | 18      | 36+   | 95%             |
| Workflow   | 20      | 40+   | 95%             |
| **Total**  | **88**  | **176+** | **95%**      |

*Note: ~2 tests per method (happy path + edge case)*

## 🔧 Jest Configuration

```javascript
// packages/database/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/drizzle/repositories/**/*.ts',
    '!src/drizzle/repositories/index.ts',
  ],
  coverageThresholds: {
    global: {
      lines: 90,
      branches: 85,
      functions: 100,
      statements: 90,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  globalTeardown: '<rootDir>/__tests__/teardown.ts',
  testTimeout: 30000, // 30 seconds for integration tests
  verbose: true,
};
```

## 🚀 Implementation Timeline

### Day 1: Infrastructure (6-8 hours)
- [ ] Create test directory structure
- [ ] Set up Jest configuration
- [ ] Create test database setup/teardown
- [ ] Build test data factories
- [ ] Create assertion helpers
- [ ] Write documentation

### Day 2: Core Repository Tests (8-10 hours)
- [ ] DrizzleUserRepository tests (15 methods, ~30 tests)
- [ ] DrizzleChatRepository tests (12 methods, ~24 tests)
- [ ] Verify tests pass locally
- [ ] Achieve 90%+ coverage on these repos

### Day 3: Complex Repository Tests (8-10 hours)
- [ ] DrizzleAgentRepository tests (23 methods, ~46 tests)
- [ ] DrizzleTaskRepository tests (18 methods, ~36 tests)
- [ ] Verify tests pass locally
- [ ] Achieve 90%+ coverage on these repos

### Day 4: Workflow & Performance (6-8 hours)
- [ ] DrizzleWorkflowRepository tests (20 methods, ~40 tests)
- [ ] Performance benchmark tests
- [ ] Load tests
- [ ] Final coverage verification (95% target)
- [ ] CI/CD integration
- [ ] Documentation updates

## 🎓 Testing Best Practices

### Do's ✅
- Use factories for consistent test data
- Clean database between tests
- Test both success and failure cases
- Use descriptive test names
- Isolate tests (no dependencies)
- Test edge cases explicitly
- Mock external dependencies only
- Use transactions for cleanup when possible

### Don'ts ❌
- Don't test Drizzle ORM itself (trust the framework)
- Don't rely on test execution order
- Don't use production database
- Don't hardcode IDs or timestamps
- Don't skip cleanup (causes flaky tests)
- Don't test implementation details
- Don't create overly complex test setups

## 📈 Success Criteria

### Must Have
- ✅ All 88 repository methods have tests
- ✅ 90%+ code coverage achieved
- ✅ All tests pass locally
- ✅ Tests run in < 2 minutes total
- ✅ No flaky tests (100% reliability)

### Nice to Have
- ⭐ Performance benchmarks established
- ⭐ Load tests for concurrent operations
- ⭐ CI/CD integration completed
- ⭐ Test documentation comprehensive
- ⭐ 95%+ code coverage achieved

## 🔗 Integration with CI/CD

### GitHub Actions Workflow

```yaml
# .github/workflows/database-tests.yml
name: Database Tests

on:
  push:
    branches: [main, develop]
    paths:
      - 'packages/database/**'
  pull_request:
    paths:
      - 'packages/database/**'

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14-alpine
        env:
          POSTGRES_USER: newfuse
          POSTGRES_PASSWORD: secretpass123
          POSTGRES_DB: the_new_fuse_test
        ports:
          - 5433:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Run migrations
        run: pnpm --filter @the-new-fuse/database drizzle:migrate
        env:
          DATABASE_URL: postgresql://newfuse:secretpass123@localhost:5433/the_new_fuse_test

      - name: Run tests
        run: pnpm --filter @the-new-fuse/database test
        env:
          TEST_DATABASE_URL: postgresql://newfuse:secretpass123@localhost:5433/the_new_fuse_test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./packages/database/coverage/lcov.info
```

## 📚 Documentation

### Test Documentation Requirements
1. README in `__tests__/` explaining how to run tests
2. Inline comments for complex test scenarios
3. Performance benchmark results documented
4. Coverage report generation
5. Troubleshooting guide

## 🎉 Expected Outcomes

Upon completion of Phase 4, we will have:
1. **176+ integration tests** covering all repository methods
2. **95% code coverage** of repository code
3. **Performance baselines** for all operations
4. **Reliable CI/CD** test pipeline
5. **Complete confidence** in database layer quality
6. **Documentation** for future test development

This comprehensive test suite will ensure the Drizzle migration is production-ready and provides a solid foundation for future development.
