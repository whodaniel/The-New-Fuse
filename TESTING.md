# The New Fuse Testing Framework Guide

## Quick Reference for AI Coders

```
# Run all tests
yarn test

# Run tests for a specific package
yarn test:shared

# Run tests with coverage
yarn test:coverage

# Run a specific test file
npx jest path/to/test.ts --no-watchman

# Create a new test file
# Place in __tests__ directory or name with .test.ts extension
```

## Overview
Comprehensive documentation for testing in The New Fuse monorepo, covering Jest unit testing, Playwright E2E testing, and advanced testing strategies. This guide is designed to help developers and AI coders understand and extend the testing capabilities of The New Fuse platform.

## Table of Contents

1. [What is Jest and Why We Use It](#what-is-jest-and-why-we-use-it)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
   - [Jest Configuration for Monorepo](#jest-configuration-for-monorepo)
   - [TypeScript Integration](#typescript-integration)
   - [Playwright Configuration](#playwright-configuration)
4. [Usage Examples](#usage-examples)
   - [Running Jest Tests](#running-jest-tests)
   - [Writing Tests](#writing-tests)
   - [Execute E2E Tests](#execute-e2e-tests)
   - [MCP Testing](#mcp-testing)
5. [Advanced Jest Capabilities](#advanced-jest-capabilities)
   - [Sandbox Testing Environments](#sandbox-testing-environments)
   - [Execution Sandboxes](#execution-sandboxes)
   - [API Mocking](#api-mocking)
   - [Continuous Integration](#continuous-integration)
   - [Instant Artifact Output Generation](#instant-artifact-output-generation)
6. [Troubleshooting](#troubleshooting)
   - [Common Issues](#common-issues)
   - [Best Practices](#best-practices)
7. [CI/CD Integration](#cicd-integration)
8. [Testing Roadmap](#testing-roadmap-for-the-new-fuse)
   - [Short-Term Goals](#short-term-goals)
   - [Medium-Term Goals](#medium-term-goals)
   - [Long-Term Goals](#long-term-goals)
   - [Implementation Guidelines](#implementation-guidelines)

## What is Jest and Why We Use It

Jest is a powerful JavaScript testing framework developed by Facebook that provides a complete solution for testing JavaScript/TypeScript applications. For The New Fuse, Jest offers several critical benefits:

### Key Benefits for The New Fuse

1. **Quality Assurance for Complex Architecture**
   - Tests individual components in isolation
   - Verifies integration between packages
   - Ensures changes in one package don't break dependent packages

2. **Confidence During Refactoring**
   - Provides safety nets when refactoring code
   - Gives immediate feedback when changes break functionality
   - Verifies that new implementations match expected behavior

3. **Developer Experience**
   - Fast feedback during development with watch mode
   - VS Code integration for in-editor test results
   - Direct TypeScript support through ts-jest
   - Enables test-driven development practices

4. **Monorepo Support**
   - Tests across package boundaries
   - Resolves workspace dependencies correctly
   - Allows package-specific test configurations
   - Enables targeted testing of specific packages

## Prerequisites
```bash
yarn add --dev jest @types/jest ts-jest playwright identity-obj-proxy
```

## Environment Setup
### Jest Configuration for Monorepo
The New Fuse uses a monorepo structure with Jest configured to support testing across multiple packages.

#### Configuration Files
- **Root Configuration**:
  - `jest.config.js`: Main configuration for the monorepo
  - `jest.resolver.js`: Custom resolver for workspace packages
  - `jest.setup.js`: Global setup for all tests

- **Package-specific Configuration**:
  - `packages/[package-name]/jest.config.js`: Configuration for individual packages
  - `packages/[package-name]/test/setup.ts`: Setup file for individual packages

#### Key Features
- **Project Structure**: Configured to recognize all packages in the monorepo
- **TypeScript Support**: Uses ts-jest for TypeScript compilation
- **Module Resolution**: Custom resolver for workspace packages
- **Test Environment**: Configurable per package (node or jsdom)

### TypeScript Integration

The New Fuse is primarily a TypeScript application, and Jest is configured to work seamlessly with TypeScript:

#### How Jest Works with TypeScript

- **Compilation**: ts-jest compiles TypeScript on-the-fly during testing
- **Type Checking**: Maintains type safety in test files
- **Source Maps**: Preserves source maps for accurate error reporting
- **Configuration**: Uses your project's tsconfig.json for consistent settings

#### Benefits for TypeScript Projects

- **Type Safety**: Tests benefit from the same type checking as application code
- **IDE Support**: Full IntelliSense and autocompletion in test files
- **Refactoring**: Safer refactoring with type-aware tests
- **TypeScript Features**: Test TypeScript-specific features like generics and interfaces

#### Example TypeScript Test

```typescript
// Testing a typed function
import { parseConfig } from '../config';

describe('Config Parser', () => {
  it('parses configuration correctly', () => {
    const input = { setting: 'value' };
    const result = parseConfig<MyConfigType>(input);

    // Type-safe assertions
    expect(result.setting).toBe('value');
    expect(result.computed).toBeDefined();
  });

  it('handles invalid input', () => {
    // @ts-expect-error - Intentionally testing invalid input
    expect(() => parseConfig(null)).toThrow();
  });
});
```

### Playwright Configuration
```typescript
// playwright.config.ts
export default {
  timeout: 30000,
  retries: 1,
  workers: process.env.CI ? 2 : undefined,
  use: {
    trace: 'on-first-retry'
  }
};
```

## Usage Examples

### Running Jest Tests

1. **Run All Tests in Monorepo**:
```bash
yarn test
```

2. **Run Tests for a Specific Package**:
```bash
yarn test:shared  # For shared package
yarn test:ui      # For UI package
```

3. **Run Tests with Coverage**:
```bash
yarn test:coverage
```

4. **Run Tests in Watch Mode**:
```bash
yarn test:watch
```

5. **Run a Specific Test File**:
```bash
npx jest path/to/test.ts --no-watchman
```

6. **VS Code Integration**:
The VS Code Jest extension is configured to run tests automatically and show results in the editor.

### Writing Tests

```typescript
// Example test for UI utilities (packages/shared/src/ui/__tests__/ui.test.ts)
import { getThemeClass, getResponsiveClass } from '../index';

describe('UI Utilities', () => {
  describe('getThemeClass', () => {
    it('returns the correct theme class', () => {
      expect(getThemeClass('dark')).toBe('theme-dark');
    });
  });

  describe('getResponsiveClass', () => {
    it('returns the correct responsive class', () => {
      expect(getResponsiveClass('sm')).toBe('max-w-sm');
    });
  });
});
```

### Execute E2E Tests
```bash
npx playwright test
```

### MCP Testing
```typescript
// test_mcp.ts
describe('MCP Protocol Tests', () => {
  test('Tool discovery', async () => {
    const response = await mcpRequest('get_tools');
    expect(response.tools).toContain('read_file');
  });
});
```

## Advanced Jest Capabilities

### Sandbox Testing Environments

Jest can be configured to create isolated sandbox environments for testing code execution and artifact generation:

#### 1. In-Memory File System

Use `jest-mock-fs` to create a virtual file system for testing file operations without touching the real file system:

```typescript
import mockFs from 'jest-mock-fs';

describe('File Generator', () => {
  beforeEach(() => {
    // Set up a virtual file system
    mockFs({
      '/base/dir': {
        'template.txt': 'Hello, {{name}}!',
        'config.json': JSON.stringify({ version: '1.0.0' })
      }
    });
  });

  afterEach(() => {
    mockFs.restore();
  });

  it('generates files from templates', async () => {
    await generateFile('/base/dir/template.txt', '/output/result.txt', { name: 'World' });

    // Check the generated file in the virtual file system
    const content = fs.readFileSync('/output/result.txt', 'utf8');
    expect(content).toBe('Hello, World!');
  });
});
```

#### 2. Execution Sandboxes

For testing code execution in The New Fuse, you can create sandbox environments:

```typescript
import { createSandbox } from '../sandbox';

describe('Code Execution', () => {
  it('executes JavaScript code safely', async () => {
    const sandbox = createSandbox();
    const result = await sandbox.execute(`
      const x = 10;
      const y = 20;
      return x + y;
    `);

    expect(result).toBe(30);
  });

  it('handles errors in executed code', async () => {
    const sandbox = createSandbox();
    await expect(sandbox.execute('throw new Error("Test error");'))
      .rejects.toThrow('Test error');
  });
});
```

#### 3. API Mocking

For testing API integrations, use Jest's mocking to create predictable responses:

```typescript
import { apiClient } from '../api';

// Mock the entire module
jest.mock('../api', () => ({
  apiClient: {
    fetchData: jest.fn(),
    processResult: jest.fn()
  }
}));

describe('API Integration', () => {
  it('processes API data correctly', async () => {
    // Set up the mock response
    apiClient.fetchData.mockResolvedValue({
      data: { items: [1, 2, 3] },
      metadata: { count: 3 }
    });

    // Test the function that uses the API
    const result = await processApiData('test-endpoint');

    expect(result.processedItems).toEqual([2, 4, 6]);
    expect(apiClient.fetchData).toHaveBeenCalledWith('test-endpoint');
  });
});
```

### Continuous Integration

Jest can be integrated into CI/CD pipelines to ensure code quality:

```yaml
# In your GitHub Actions workflow
test-job:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'yarn'
    - run: yarn install
    - name: Run tests
      run: yarn test
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
```

### Instant Artifact Output Generation

The New Fuse includes a dedicated artifact generation system in the `@the-new-fuse/testing` package. This system provides a structured way to generate and manage test artifacts:

```typescript
import { artifactManager } from '@the-new-fuse/testing';

describe('Artifact Generation', () => {
  it('generates documentation from test results', () => {
    // Run your test
    const result = myFunction();

    // Generate artifact
    const artifactPath = artifactManager.createArtifact({
      name: 'test-result',
      content: result,
      metadata: {
        testName: 'generates documentation from test results',
        version: '1.0.0',
        environment: process.env.NODE_ENV
      }
    });

    console.log(`Artifact generated: ${artifactPath}`);
    expect(result).toBeDefined();
  });

  it('creates a snapshot of complex data', () => {
    const complexData = {
      user: { id: 123, name: 'Test User' },
      permissions: ['read', 'write'],
      settings: { theme: 'dark', notifications: true }
    };

    // Create a snapshot artifact
    artifactManager.createSnapshot('user-data', complexData, {
      tags: ['user', 'permissions', 'settings']
    });

    expect(complexData.user.id).toBe(123);
  });

  it('logs test activity', () => {
    const logEntries = [
      { level: 'info', message: 'Test started', timestamp: new Date().toISOString() },
      { level: 'debug', message: 'Processing data', timestamp: new Date().toISOString() },
      { level: 'info', message: 'Test completed', timestamp: new Date().toISOString() }
    ];

    // Create a log artifact
    artifactManager.createLog('test-activity', logEntries);

    expect(logEntries.length).toBe(3);
  });
});
```

#### Custom Jest Matcher

The artifact system also includes a custom Jest matcher for generating artifacts:

```typescript
import { artifactMatchers } from '@the-new-fuse/testing';

// Extend Jest's expect
expect.extend(artifactMatchers);

describe('Custom Artifact Matcher', () => {
  it('generates an artifact using a matcher', () => {
    const result = { success: true, data: [1, 2, 3] };

    // Generate artifact using the matcher
    expect(result).toGenerateArtifact('test-result', {
      testName: 'generates an artifact using a matcher'
    });
  });
});
```

#### Artifact Types

The artifact system supports several types of artifacts:

1. **Generic Artifacts**: Any data that needs to be saved for later analysis
2. **Snapshots**: Point-in-time captures of application state
3. **Logs**: Sequential records of events or actions
4. **Reports**: Structured summaries of test results

#### CI/CD Integration

Artifacts are automatically collected and uploaded as build artifacts in the CI/CD pipeline:

```yaml
- name: Upload test artifacts
  uses: actions/upload-artifact@v3
  with:
    name: test-artifacts
    path: test-artifacts/
    retention-days: 7
```


## Troubleshooting

### Common Issues

1. **Multiple Jest Configurations**
   - Error: `Multiple configurations found`
   - Solution: Remove duplicate Jest configuration files or specify which one to use with `--config`

2. **Setup Files Not Found**
   - Error: `Module <rootDir>/test/setup.ts in the setupFilesAfterEnv option was not found`
   - Solution: Create the missing setup file or comment out the setupFilesAfterEnv option

3. **Watchman Issues**
   - Symptom: Tests hang or timeout
   - Solution: Use the `--no-watchman` flag when running Jest

4. **Module Resolution Problems**
   - Error: `Cannot find module '@the-new-fuse/...'`
   - Solution: Check the moduleNameMapper configuration in jest.config.js

### Best Practices

1. **Test Organization**
   - Place tests in `__tests__` directories or name them with `.test.ts` or `.spec.ts` suffix
   - Group related tests in describe blocks
   - Use clear, descriptive test names

2. **Mocking**
   - Use Jest's mocking capabilities for external dependencies
   - Create mock files in `__mocks__` directories
   - Use `jest.mock()` for module mocking

3. **Test Coverage**
   - Aim for high test coverage, especially for critical code paths
   - Use `yarn test:coverage` to generate coverage reports

4. **VS Code Integration**
   - Install the Jest extension for VS Code
   - Use the test explorer to run and debug tests
   - Configure settings in `.vscode/settings.json`

## CI/CD Integration

The New Fuse includes comprehensive CI/CD integration for testing. The following GitHub Actions workflows are configured:

### Main Test Workflow

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x]

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Build packages
        run: yarn build

      - name: Run tests
        run: yarn test

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          directory: ./coverage/
          fail_ci_if_error: false

      - name: Upload test artifacts
        uses: actions/upload-artifact@v3
        with:
          name: test-artifacts
          path: test-artifacts/
          retention-days: 7
```

### Performance Testing Workflow

A separate workflow runs performance tests on a schedule and checks for regressions:

```yaml
# .github/workflows/performance.yml
name: Performance Tests

on:
  schedule:
    # Run performance tests daily at midnight
    - cron: '0 0 * * *'
  workflow_dispatch:
    # Allow manual triggering

jobs:
  performance:
    name: Run Performance Tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18.x'
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Build packages
        run: yarn build

      - name: Run performance tests
        run: yarn test:perf

      - name: Upload performance reports
        uses: actions/upload-artifact@v3
        with:
          name: performance-reports
          path: performance-reports/
          retention-days: 30

      - name: Check for performance regressions
        run: node scripts/check-performance-regressions.js
```

### Integration with Pull Requests

Test results are reported directly on pull requests, including:

- Test pass/fail status
- Code coverage changes
- Performance impact
- Generated test artifacts

### Automated Test Reports

Test reports are automatically generated and published:

```yaml
- name: Generate test report
  if: always()
  run: yarn test:report

- name: Publish test report
  if: always()
  uses: actions/github-script@v6
  with:
    script: |
      const fs = require('fs');
      const report = JSON.parse(fs.readFileSync('./test-report.json', 'utf8'));
      const summary = `## Test Results
      - Total: ${report.numTotalTests}
      - Passed: ${report.numPassedTests}
      - Failed: ${report.numFailedTests}
      - Skipped: ${report.numPendingTests}

      Test run completed in ${report.startTime}ms.`;
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: summary
      });
```

## Testing Roadmap for The New Fuse

This section outlines planned enhancements to The New Fuse testing infrastructure. AI coders and developers can use this as a guide for implementing new testing capabilities.

### Short-Term Goals

1. **Implement Sandbox Testing Environments**
   - Create a virtual file system for testing file operations
   - Develop a code execution sandbox for testing user-submitted code
   - Add artifact generation capabilities to tests

2. **Enhance UI Component Testing**
   - Implement snapshot testing for UI components
   - Add visual regression testing
   - Create a component test library

3. **Improve Test Coverage**
   - Achieve 80%+ code coverage across core packages
   - Add tests for edge cases and error handling
   - Implement integration tests between packages

### Medium-Term Goals

1. **Custom Test Environments**
   - Create specialized test environments for different parts of The New Fuse
   - Implement browser-like environment for frontend testing
   - Develop custom environment for testing platform-specific features

2. **Performance Testing**
   - Add execution time assertions for critical operations
   - Implement memory usage monitoring
   - Create performance regression tests

3. **Contract Testing**
   - Implement API contract tests
   - Add service boundary tests
   - Create schema validation tests

### Long-Term Goals

1. **Automated Test Generation**
   - Implement AI-assisted test generation
   - Create property-based testing framework
   - Develop mutation testing capabilities

2. **Continuous Benchmarking**
   - Set up performance benchmarking infrastructure
   - Create visualization for performance trends
   - Implement automatic performance regression detection

3. **End-to-End Testing Expansion**
   - Expand E2E test coverage across all user flows
   - Implement cross-browser testing
   - Add accessibility testing

### Implementation Guidelines

1. **For AI Coders**
   - Start with the short-term goals
   - Follow the existing patterns in the codebase
   - Document all new testing utilities
   - Add examples for each new testing capability

2. **For Developers**
   - Prioritize test coverage for new features
   - Run tests locally before committing
   - Review test implementation as part of code reviews
   - Keep tests maintainable and readable