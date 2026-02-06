# Database Package Tests

Integration tests for Drizzle ORM repositories in The New Fuse.

## Overview

This test suite provides comprehensive integration tests for all 5 Drizzle
repositories (88 methods total) with 95% code coverage target.

## Setup

### Prerequisites

1. **PostgreSQL Database**: Test database running on port 5433
2. **Node.js**: Version 20 or higher
3. **pnpm**: Package manager

### Environment Variables

Create a `.env.test` file or set `TEST_DATABASE_URL`:

```bash
TEST_DATABASE_URL=postgresql://newfuse:secretpass123@localhost:5433/the_new_fuse_test
```

### Installation

```bash
# Install dependencies
pnpm install

# Run database migrations
pnpm drizzle:migrate
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run tests with verbose output
pnpm test:verbose
```

## Test Structure

```
__tests__/
├── setup.ts                          # Test environment setup
├── teardown.ts                       # Global cleanup
├── utils/
│   ├── factories.ts                  # Test data factories
│   ├── assertions.ts                 # Custom assertions
│   └── database-helpers.ts           # DB utility functions
├── repositories/
│   ├── user.repository.test.ts       # UserRepository tests (15 methods)
│   ├── agent.repository.test.ts      # AgentRepository tests (23 methods)
│   ├── chat.repository.test.ts       # ChatRepository tests (12 methods)
│   ├── task.repository.test.ts       # TaskRepository tests (18 methods)
│   └── workflow.repository.test.ts   # WorkflowRepository tests (20 methods)
└── performance/
    ├── benchmark.test.ts             # Performance benchmarks
    └── load.test.ts                  # Load tests
```

## Test Utilities

### Factories

Test data factories provide consistent fixtures:

```typescript
import { UserFactory, AgentFactory } from './utils/factories';

// Create user data
const userData = await UserFactory.build();
const user = await drizzleUserRepository.create(userData);

// Create multiple users
const users = await UserFactory.buildList(5);
```

### Assertions

Custom assertion helpers for common patterns:

```typescript
import { expectDatabaseRow, expectValidPagination } from './utils/assertions';

// Assert database row structure
expectDatabaseRow(user, { email: 'test@example.com' });

// Assert pagination result
expectValidPagination(result, 10); // 10 total items
```

### Database Helpers

Utility functions for database operations:

```typescript
import {
  countRows,
  truncateTable,
  measureExecutionTime,
} from './utils/database-helpers';

// Count rows
const count = await countRows('users');

// Measure performance
const { result, durationMs } = await measureExecutionTime(async () => {
  return await drizzleUserRepository.findById(userId);
});
expect(durationMs).toBeLessThan(10); // Should complete in < 10ms
```

## Writing Tests

### Test Template

```typescript
import { drizzleUserRepository } from '../../src/drizzle/repositories/user.repository';
import { UserFactory } from '../utils/factories';
import { expectDatabaseRow } from '../utils/assertions';

describe('DrizzleUserRepository', () => {
  describe('methodName', () => {
    it('should do something', async () => {
      // Arrange
      const userData = await UserFactory.build();

      // Act
      const result = await drizzleUserRepository.create(userData);

      // Assert
      expectDatabaseRow(result, { email: userData.email });
    });

    it('should handle edge case', async () => {
      // Test edge case...
    });
  });
});
```

### Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Database is automatically cleaned between tests
3. **Naming**: Use descriptive test names ("should do X when Y")
4. **Coverage**: Test happy path + edge cases for each method
5. **Performance**: Keep tests fast (< 100ms each)
6. **Assertions**: Use custom helpers for consistency

## Coverage Goals

| Repository | Methods | Tests    | Coverage Target |
| ---------- | ------- | -------- | --------------- |
| User       | 15      | 30+      | 95%             |
| Agent      | 23      | 46+      | 95%             |
| Chat       | 12      | 24+      | 95%             |
| Task       | 18      | 36+      | 95%             |
| Workflow   | 20      | 40+      | 95%             |
| **Total**  | **88**  | **176+** | **95%**         |

## Troubleshooting

### Database Connection Errors

```bash
# Ensure PostgreSQL is running
docker ps | grep postgres

# Start Docker services if needed
pnpm docker:start
```

### Test Failures

```bash
# Clean database
pnpm drizzle:push --force

# Run migrations
pnpm drizzle:migrate

# Try tests again
pnpm test
```

### Slow Tests

```bash
# Check database performance
pnpm drizzle:studio

# Run specific test file
pnpm test user.repository.test.ts
```

## CI/CD Integration

Tests run automatically on:

- Every push to `main` or `develop`
- Every pull request affecting `packages/database/**`

GitHub Actions workflow: `.github/workflows/database-tests.yml`

## Documentation

- [Phase 4 Test Plan](../../../docs/database/PHASE_4_TEST_PLAN.md)
- [Migration Progress](../../../docs/database/MIGRATION_PROGRESS_REPORT.md)
- [Drizzle Migration Guide](../../../docs/database/DRIZZLE_MIGRATION_GUIDE.md)
