# The New Fuse Comprehensive Testing Guide

This document provides a complete guide to testing The New Fuse application, covering everything from the underlying philosophy to advanced strategies and CI/CD integration.

## 1. Testing Philosophy & Strategy

Our testing philosophy is guided by these core principles:

- **Test Real Functionality**: Focus on validating that features work from a user's perspective, not just on implementation details.
- **Quality Over Quantity**: A few well-designed, meaningful tests are more valuable than many superficial ones.
- **Balanced Test Pyramid**: Maintain a healthy mix of unit, integration, and end-to-end tests.
- **Shift Left**: Identify and resolve issues as early as possible in the development lifecycle.
- **Continuous Improvement**: Regularly review and enhance our testing processes and strategies.

## 2. The Testing Pyramid

We follow a balanced testing pyramid to ensure comprehensive coverage.

```
    /\
   /  \
  / E2E \
 /       \
/_________\
/Integration\
/____________\
/____Unit____\
```

- **Unit Tests (~80% coverage target)**: Test individual functions and components in isolation. They are fast and form the base of our pyramid.
- **Integration Tests (~60% coverage target)**: Test the interactions between different components, services, and external systems.
- **End-to-End (E2E) Tests (~50% coverage target)**: Test complete user workflows from start to finish, simulating real-world scenarios.

## 3. Test Organization

Tests are organized within the packages they correspond to, typically in a `__tests__` directory or with a `.test.ts`/`.spec.ts` suffix.

```
project/
├── apps/
│   └── frontend/
│       └── src/
│           └── __tests__/
│               ├── unit/
│               ├── integration/
│               └── e2e/
└── packages/
    └── core/
        └── src/
            └── __tests__/
                ├── unit/
                └── integration/
```

## 4. Running Tests

### Quick Commands

```bash
# Run all tests in the monorepo
pnpm test

# Run tests for a specific package (e.g., 'shared')
pnpm test:shared

# Run tests and generate a coverage report
pnpm test:coverage

# Run a specific test file
npx jest path/to/your.test.ts --no-watchman

# Run tests in watch mode for TDD
pnpm test --watch
```

### E2E Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run E2E tests in a specific browser
pnpm test:e2e --project=Chrome
```

## 5. Types of Testing

### Unit Testing

Unit tests focus on the smallest parts of the application in isolation.

- **Best Practices**:
    - Follow the Arrange-Act-Assert (AAA) pattern.
    - Test success paths, failure paths, and edge cases.
    - Mock all external dependencies.
    - Keep tests independent and deterministic.

### Integration Testing

Integration tests verify that different parts of the application work together correctly.

- **Coverage**:
    - Service-to-service communication (e.g., API to database).
    - Workflow execution and state synchronization.
    - Resource management and error handling across components.
- **Best Practices**:
    - Use realistic test data.
    - Mock external services that are not part of the integration being tested.
    - Clean up resources (e.g., database entries) after tests.

### End-to-End (E2E) Testing

E2E tests simulate full user workflows. We use **Playwright** for this.

- **Best Practices**:
    - Focus on critical user flows (e.g., login, core feature usage).
    - Use `data-testid` attributes for stable element selection.
    - Avoid hardcoded waits; use Playwright's auto-waiting capabilities.

### WebSocket Testing

A crucial part of our system is real-time communication via WebSockets.

1.  **Start the Test Server**: `node test-websocket-server.cjs`
2.  **Use the Browser Client**: Open `browser-test-client.html` to connect and send messages.
3.  **Test against the real VS Code server**: The VS Code extension runs its own WebSocket server on port `3710`. Use the browser client or the Node.js test client (`test-vscode-extension-websocket.js`) to validate.

- **Message Types**:
    - **Client to Server**: `AUTH`, `PING`, `CODE_INPUT`, `AI_QUERY`
    - **Server to Client**: `AUTH_RESPONSE`, `PONG`, `AI_RESPONSE`, `ERROR`

## 6. Test Configuration

- **Jest**: The primary configuration is in the root `jest.config.js`, with package-specific overrides where necessary. It's set up with `ts-jest` for seamless TypeScript support.
- **Playwright**: E2E test configuration is in `playwright.config.ts`, defining browsers, base URL, and trace settings.

## 7. Advanced Testing

### Sandbox Environments & Artifacts

For testing file operations and code execution, we use sandboxed environments. The `@the-new-fuse/testing` package provides an `artifactManager` to generate test artifacts, snapshots, and logs, which are crucial for debugging and validation.

```typescript
// Example: Creating a snapshot artifact
import { artifactManager } from '@the-new-fuse/testing';

it('creates a snapshot of complex data', () => {
  const complexData = { user: { id: 1, name: 'Test' } };
  artifactManager.createSnapshot('user-data', complexData);
  expect(complexData.user.id).toBe(1);
});
```

### Security, Performance, and Accessibility

- **Security**: We perform regular dependency scanning, static code analysis, and authentication/authorization tests.
- **Performance**: We conduct load testing on critical paths and monitor response times and memory usage.
- **Accessibility**: We verify WCAG compliance and test for screen reader and keyboard navigation compatibility.

## 8. Continuous Integration (CI/CD)

Our CI pipeline (using GitHub Actions) is central to our quality assurance process.

- **On Every PR**: Unit and integration tests are run automatically.
- **On Merge to Main**: E2E tests are executed.
- **Reporting**: Test results, coverage reports, and performance benchmarks are posted directly to pull requests.
- **Artifacts**: Test artifacts are uploaded and stored for a retention period, allowing for post-mortem debugging.

## 9. Troubleshooting

- **CI Failures**: Check for environment differences between local and CI environments.
- **Flaky Tests**: Investigate and fix tests that fail intermittently, often by improving async handling or test isolation.
- **Slow Tests**: Profile and optimize slow tests, or mock expensive operations.
- **Watchman Issues**: If tests hang, run with the `--no-watchman` flag.


