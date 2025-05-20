# The New Fuse Testing Guide

This document provides comprehensive guidance for testing The New Fuse application across different levels, from unit testing to end-to-end testing.

## Table of Contents
1. [Testing Philosophy](#testing-philosophy)
2. [Testing Pyramid](#testing-pyramid)
3. [Test Organization](#test-organization)
4. [Unit Testing](#unit-testing)
5. [Integration Testing](#integration-testing)
6. [End-to-End Testing](#end-to-end-testing)
7. [Test Configuration](#test-configuration)
8. [Running Tests](#running-tests)
9. [Continuous Integration](#continuous-integration)
10. [Testing Best Practices](#testing-best-practices)
11. [Advanced Testing Topics](#advanced-testing-topics)
12. [Troubleshooting](#troubleshooting)

## Testing Philosophy

Our testing philosophy is guided by the following principles:

1. **Test real functionality, not implementation details**: Tests should verify that features work correctly from a user perspective.
2. **Quality over quantity**: A few well-designed tests are more valuable than many superficial ones.
3. **Balanced test pyramid**: Maintain an appropriate balance of unit, integration, and end-to-end tests.
4. **Shift left**: Find issues as early as possible in the development lifecycle.
5. **Continuous improvement**: Regularly review and enhance our testing approach.

## Testing Pyramid

We follow a balanced testing pyramid approach:

```
    /\
   /  \
  /E2E \
 /      \
/________\
/Integration\
/____________\
/____Unit_____\
```

### Unit Tests (80% coverage target)
- Test individual functions, methods, and classes in isolation
- Mock external dependencies
- Quick execution time
- Examples: Service methods, utility functions, isolated component logic

### Integration Tests (60% coverage target)
- Test interactions between components
- Partial mocking of external dependencies
- Medium execution time
- Examples: API endpoints, database operations, component interactions

### End-to-End Tests (50% coverage target)
- Test complete user workflows
- Minimal mocking
- Longer execution time
- Examples: User registration flow, checkout process, data visualization

## Test Organization

```
project/
├── apps/
│   ├── frontend/
│   │   └── src/
│   │       └── test/
│   │           ├── unit/
│   │           ├── integration/
│   │           └── e2e/
│   └── backend/
│       └── test/
│           ├── unit/
│           ├── integration/
│           └── e2e/
└── packages/
    └── core/
        └── src/
            └── test/
                ├── unit/
                └── integration/
```

In The New Fuse project, tests are organized in the following locations:

- `/test`: Contains basic test setup and utility files
- `/tests`: Contains global test setup, teardown, and integration tests
- `/src/test`: Contains the main test directories including:
  - `/src/test/factories`: Test data factories
  - `/src/test/helpers`: Test helper functions
  - `/src/test/integration`: Integration tests
  - `/src/test/suite`: Test suites for different components

## Unit Testing

Unit tests focus on testing individual components, functions, or classes in isolation.

### Setting Up Unit Tests

1. Create test files with `.test.ts` or `.spec.ts` extension
2. Place them adjacent to the code being tested or in a dedicated `__tests__` directory
3. Use Jest's testing utilities for assertions and mocking

### Writing Effective Unit Tests

```typescript
// Example unit test for a utility function
import { calculateTotal } from '../utils/calculations';

describe('calculateTotal', () => {
  it('should calculate total correctly with tax', () => {
    // Arrange
    const items = [
      { price: 10, quantity: 2 },
      { price: 15, quantity: 1 }
    ];
    const taxRate = 0.1;
    
    // Act
    const result = calculateTotal(items, taxRate);
    
    // Assert
    expect(result).toBe(38.5); // (10*2 + 15*1) * 1.1
  });
  
  it('should handle empty items array', () => {
    expect(calculateTotal([], 0.1)).toBe(0);
  });
});
```

### Unit Testing Best Practices

- Test both success and failure paths
- Use meaningful test data
- Test edge cases
- Mock external dependencies consistently
- Follow the AAA (Arrange-Act-Assert) pattern
- Keep tests independent from each other
- Use descriptive test names that explain the expected behavior

## Integration Testing

Integration tests verify that different parts of the application work together correctly.

### Integration Test Coverage

Integration tests cover:
- Service communication
- Workflow execution
- State synchronization
- Resource management
- Error handling

### Writing Integration Tests

```typescript
// Example integration test for an API endpoint
import { createTestContainer } from '../test-container';
import { ApiService } from '../../services/api-service';

describe('API Service Integration', () => {
  let container;
  let apiService;
  
  beforeAll(async () => {
    container = await createTestContainer();
    apiService = container.get(ApiService);
  });
  
  afterAll(async () => {
    await container.dispose();
  });
  
  it('should fetch user data correctly', async () => {
    // Act
    const result = await apiService.getUserData('test-user-id');
    
    // Assert
    expect(result).toHaveProperty('id', 'test-user-id');
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('email');
  });
});
```

### Integration Testing Best Practices

- Focus on testing component interactions
- Use realistic test data
- Test API contracts thoroughly
- Consider using container-based testing for database operations
- Ensure proper setup and teardown of test resources

## End-to-End Testing

End-to-End (E2E) tests verify that entire user workflows function correctly from start to finish.

### E2E Testing with Playwright

The New Fuse uses Playwright for E2E testing. The configuration is in `playwright.config.ts`.

```typescript
// Example E2E test with Playwright
import { test, expect } from '@playwright/test';

test('user can log in and access dashboard', async ({ page }) => {
  // Navigate to the login page
  await page.goto('/login');
  
  // Fill in login form
  await page.fill('[data-testid="email-input"]', 'test@example.com');
  await page.fill('[data-testid="password-input"]', 'password123');
  await page.click('[data-testid="login-button"]');
  
  // Verify redirect to dashboard
  await expect(page).toHaveURL('/dashboard');
  
  // Verify dashboard elements are visible
  await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
});
```

### E2E Testing Best Practices

- Test critical user flows
- Test on environments similar to production
- Minimize use of hardcoded waits and timeouts
- Consider testing across different browsers/devices
- Use data attributes for test selectors

## Test Configuration

### Jest Configuration

The New Fuse uses Jest as the primary testing framework. The main configuration is in `jest.config.ts`:

```typescript
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/types/**/*'
  ]
};
```

### Playwright Configuration

For E2E testing, Playwright is configured in `playwright.config.ts`:

```typescript
import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'on-first-retry'
  },
  projects: [
    {
      name: 'Chrome',
      use: { browserName: 'chromium' }
    },
    {
      name: 'Firefox',
      use: { browserName: 'firefox' }
    },
    {
      name: 'Safari',
      use: { browserName: 'webkit' }
    }
  ]
};

export default config;
```

## Running Tests

### Running Unit and Integration Tests

```bash
# Run all tests
yarn test

# Run unit tests only
yarn test:unit

# Run integration tests only
yarn test:integration

# Run tests with coverage
yarn test --coverage

# Run specific test file
yarn test path/to/test-file.test.ts

# Run tests in watch mode
yarn test --watch
```

### Running E2E Tests

```bash
# Run all E2E tests
yarn test:e2e

# Run E2E tests in a specific browser
yarn test:e2e --project=Chrome

# Run a specific E2E test file
yarn test:e2e path/to/test-file.spec.ts
```

## Continuous Integration

The New Fuse uses GitHub Actions for continuous integration testing:

- Unit and integration tests run on every pull request
- E2E tests run on merges to main branches
- Test coverage reports are generated and tracked
- Performance benchmarks are monitored

## Testing Best Practices

### General Best Practices

- Write deterministic tests that don't depend on external factors
- Follow the AAA (Arrange-Act-Assert) pattern
- Make tests independent from each other
- Use descriptive test names that explain the expected behavior
- Keep tests simple and focused on a single assertion

### Component Testing Best Practices

- Test component rendering
- Test user interactions
- Test state changes
- Test error states
- Use data-testid attributes for selecting elements

### API Testing Best Practices

- Test all API endpoints
- Test request validation
- Test error handling
- Test authentication and authorization
- Use realistic test data

## Advanced Testing Topics

### Security Testing

- Regular dependency scanning
- Static code analysis
- Authentication and authorization tests
- API security testing

### Performance Testing

- Load testing critical paths
- Response time monitoring
- Memory usage analysis
- Database query performance

### Accessibility Testing

- WCAG compliance verification
- Screen reader compatibility
- Keyboard navigation testing

### Visual Regression Testing

- Screenshot comparison for UI components
- Responsive design testing
- Theme switching validation

## Troubleshooting

### Common Issues

#### Tests Failing in CI but Passing Locally

- Check for environment differences
- Ensure all dependencies are properly installed
- Look for timing issues or race conditions

#### Slow Tests

- Identify and optimize slow-running tests
- Consider running tests in parallel
- Mock expensive operations when appropriate

#### Flaky Tests

- Identify and fix tests that fail intermittently
- Add proper waiting mechanisms for async operations
- Ensure proper test isolation

### Getting Help

If you encounter issues with testing:

1. Check the test logs for error messages
2. Review the testing documentation
3. Ask for help in the development team channel
4. Create an issue with detailed reproduction steps