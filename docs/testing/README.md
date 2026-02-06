# Testing Guide

Complete guide for writing and running tests in The New Fuse monorepo.

## Table of Contents

1. [Overview](#overview)
2. [Test Types](#test-types)
3. [Getting Started](#getting-started)
4. [Writing Tests](#writing-tests)
5. [Running Tests](#running-tests)
6. [Best Practices](#best-practices)
7. [CI/CD Integration](#cicd-integration)
8. [Troubleshooting](#troubleshooting)

## Overview

The New Fuse uses a comprehensive testing strategy that includes:

- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Test interactions between multiple components/services
- **E2E Tests**: Test complete user workflows end-to-end

### Testing Tools

- **Jest**: For backend/NestJS unit and integration tests
- **Vitest**: For frontend/React unit tests (faster, modern alternative to Jest)
- **Playwright**: For E2E testing across browsers
- **React Testing Library**: For testing React components
- **Supertest**: For testing HTTP endpoints

## Test Types

### Unit Tests

Test individual functions, classes, or components in isolation.

**Location**: `src/**/__tests__/*.test.ts` or `src/**/*.spec.ts`

**Examples**:

- Testing a utility function
- Testing a React component
- Testing a service class

### Integration Tests

Test interactions between multiple components or services.

**Location**: `test/**/*.spec.ts` or `src/**/*.integration.test.ts`

**Examples**:

- Testing API endpoints with database
- Testing service-to-service communication
- Testing complex component interactions

### E2E Tests

Test complete user workflows through the UI.

**Location**: `e2e/**/*.spec.ts`

**Examples**:

- User registration and login flow
- Creating and running a workflow
- Admin dashboard operations

## Getting Started

### Prerequisites

```bash
# Install dependencies
pnpm install

# Install Playwright browsers (for E2E tests)
pnpm exec playwright install --with-deps
```

### Project Structure

```
fuse/
├── e2e/                          # E2E tests with Playwright
│   ├── example.spec.ts
│   ├── workflows/
│   ├── utils/                    # E2E test helpers
│   └── fixtures/                 # E2E test data
├── packages/
│   ├── testing/                  # Shared testing utilities
│   │   ├── src/
│   │   │   ├── utils/           # Test helpers
│   │   │   ├── fixtures/        # Test data
│   │   │   └── setup/           # Setup files
│   │   └── package.json
│   └── */
│       ├── src/
│       │   └── __tests__/       # Unit tests
│       └── test/                # Integration tests
├── apps/
│   └── */
│       ├── src/
│       │   └── __tests__/       # Unit tests
│       └── test/                # Integration tests
├── jest.config.base.js          # Base Jest config
├── jest.config.nestjs.js        # NestJS Jest config
├── vitest.config.base.ts        # Base Vitest config
├── vitest.config.react.ts       # React Vitest config
└── playwright.config.ts         # Playwright config
```

## Writing Tests

### Unit Tests (React/Frontend with Vitest)

```typescript
// apps/frontend/src/components/__tests__/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Unit Tests (NestJS/Backend with Jest)

```typescript
// apps/api-gateway/src/services/__tests__/user.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user.service';
import { createMockRepository } from '@the-new-fuse/testing';

describe('UserService', () => {
  let service: UserService;
  let mockUserRepository: any;

  beforeEach(async () => {
    mockUserRepository = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: 'UserRepository',
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a user', async () => {
    const userData = { email: 'test@example.com', name: 'Test User' };
    mockUserRepository.save.mockResolvedValue({ id: '1', ...userData });

    const result = await service.create(userData);

    expect(result).toEqual({ id: '1', ...userData });
    expect(mockUserRepository.save).toHaveBeenCalledWith(userData);
  });
});
```

### Integration Tests (API Endpoints)

```typescript
// apps/api-gateway/test/users.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Users (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/users (GET)', () => {
    return request(app.getHttpServer())
      .get('/users')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it('/users (POST)', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({ email: 'test@example.com', name: 'Test User' })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.email).toBe('test@example.com');
      });
  });
});
```

### E2E Tests (Playwright)

```typescript
// e2e/workflows/workflow-creation.spec.ts
import { test, expect } from '@playwright/test';
import { login, waitForApiResponse } from '../utils/test-helpers';

test.describe('Workflow Creation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'user@test.com', 'password');
    await page.goto('/workflows');
  });

  test('should create a new workflow', async ({ page }) => {
    // Click create button
    await page.click('button[data-testid="create-workflow"]');

    // Fill in workflow details
    await page.fill('input[name="name"]', 'My Test Workflow');
    await page.fill('textarea[name="description"]', 'Test description');

    // Save workflow
    const responsePromise = waitForApiResponse(page, '/api/workflows');
    await page.click('button[type="submit"]');
    await responsePromise;

    // Verify success
    await expect(page.getByText('Workflow created successfully')).toBeVisible();
  });
});
```

## Running Tests

### All Tests

```bash
# Run all tests (unit, integration, e2e)
pnpm test

# Run all tests with coverage
pnpm test:coverage
```

### Unit Tests

```bash
# Run all unit tests
pnpm test:unit

# Run unit tests for a specific package
pnpm --filter @the-new-fuse/core test

# Run unit tests in watch mode
pnpm test:unit -- --watch
```

### Integration Tests

```bash
# Run all integration tests
pnpm test:integration

# Run integration tests for specific app
pnpm --filter @the-new-fuse/api-gateway test:e2e
```

### E2E Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e -- --ui

# Run E2E tests in debug mode
pnpm test:e2e -- --debug

# Run specific E2E test file
pnpm test:e2e -- e2e/workflows/workflow-creation.spec.ts

# Run E2E tests on specific browser
pnpm test:e2e -- --project=chromium
```

### Coverage

```bash
# Generate coverage report
pnpm test:coverage

# View coverage report
open coverage/index.html
```

## Best Practices

### General

1. **Write tests first (TDD)** when adding new features
2. **Keep tests isolated** - each test should be independent
3. **Use descriptive test names** - clearly state what is being tested
4. **Follow AAA pattern** - Arrange, Act, Assert
5. **Don't test implementation details** - focus on behavior
6. **Mock external dependencies** - avoid hitting real APIs or databases in unit
   tests

### Unit Tests

```typescript
describe('ComponentName', () => {
  // ✅ Good: Descriptive test names
  it('should display error message when form validation fails', () => {
    // Test implementation
  });

  // ❌ Bad: Vague test names
  it('should work', () => {
    // Test implementation
  });
});
```

### Integration Tests

1. **Use test database** - never test against production data
2. **Clean up after tests** - reset database state between tests
3. **Test realistic scenarios** - use real database queries, not mocks
4. **Use fixtures** - create reusable test data

### E2E Tests

1. **Test critical user paths** - focus on most important workflows
2. **Use data-testid attributes** - for reliable element selection
3. **Avoid hardcoded waits** - use Playwright's auto-waiting
4. **Test across browsers** - ensure cross-browser compatibility
5. **Keep tests independent** - each test should set up its own state

### Coverage Goals

- **Minimum**: 50% coverage for all code
- **Target**: 60% coverage for business logic
- **Critical paths**: 80%+ coverage for auth, payments, core features

## CI/CD Integration

Tests run automatically on:

- **Pull Requests**: All tests must pass before merging
- **Push to main/develop**: Full test suite runs
- **Nightly builds**: Extended test suite with performance tests

### CI Pipeline

1. **Lint & Type Check**: Verify code quality
2. **Unit Tests**: Fast feedback on changes
3. **Integration Tests**: Verify service interactions
4. **E2E Tests**: Verify user workflows
5. **Coverage Report**: Track test coverage

### Test Sharding

Tests are split across multiple runners for faster execution:

```yaml
strategy:
  matrix:
    shard: [1, 2, 3, 4]
```

## Troubleshooting

### Common Issues

#### Tests timing out

```typescript
// Increase timeout for slow tests
it('should handle slow operation', async () => {
  // ...
}, 30000); // 30 second timeout
```

#### Module resolution errors

```bash
# Clear cache and reinstall
pnpm clean
pnpm install
```

#### Playwright browser issues

```bash
# Reinstall browsers
pnpm exec playwright install --with-deps
```

#### Memory issues

```bash
# Run tests with more memory
NODE_OPTIONS="--max-old-space-size=4096" pnpm test
```

### Debug Mode

```bash
# Debug unit tests
pnpm test -- --inspect-brk

# Debug E2E tests
pnpm test:e2e -- --debug
```

### Useful Commands

```bash
# Update snapshots
pnpm test -- --update-snapshots

# Run tests matching pattern
pnpm test -- --testNamePattern="user login"

# Run only changed tests
pnpm test -- --onlyChanged

# Run tests with verbose output
pnpm test -- --verbose
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Getting Help

- Check existing tests for examples
- Review test utilities in `packages/testing`
- Ask in `#testing` channel on Slack
- Refer to this documentation

---

**Last Updated**: 2025-11-18
