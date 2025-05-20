# The New Fuse E2E Testing Framework

## Overview

This document describes the end-to-end testing framework for The New Fuse platform. The framework is built using Playwright and provides comprehensive testing capabilities including functional testing, performance testing, and visual regression testing.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm 7 or higher
- Running instance of The New Fuse platform (local or staging)

### Installation

```bash
npm install
npx playwright install --with-deps
```

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e tests/workflow/workflow-editor.test.ts

# Run tests in UI mode
npm run test:e2e:ui

# Run performance tests
npm run test:e2e:perf
```

## Framework Structure

```
packages/testing/
├── src/
│   ├── e2e/
│   │   ├── config/          # Configuration files
│   │   ├── fixtures/        # Test fixtures and utilities
│   │   ├── pages/          # Page object models
│   │   ├── tests/          # Test suites
│   │   └── utils/          # Helper utilities
│   └── package.json
├── playwright.config.ts     # Playwright configuration
└── tsconfig.json           # TypeScript configuration
```

## Key Components

### Page Object Models

Page objects encapsulate the structure and behavior of web pages:

- `BasePage`: Common functionality for all pages
- `LoginPage`: Authentication functionality
- `DashboardPage`: Dashboard interactions
- `WorkflowEditorPage`: Workflow editing capabilities
- `SettingsPage`: User settings management

### Test Utilities

- `NavigationUtils`: Page navigation helpers
- `TestHelpers`: Test data management
- `TestReporter`: Test reporting and artifacts
- `VisualTesting`: Visual regression testing

### Test Fixtures

Custom fixtures provide:
- Authenticated page states
- Test data management
- Visual regression testing
- Performance monitoring

## Writing Tests

### Basic Test Structure

```typescript
import { test } from '../../fixtures/custom-test';

test.describe('Feature Name', () => {
  test('should perform specific action', async ({ 
    dashboardPage,
    testHelpers 
  }) => {
    // Test implementation
  });
});
```

### Visual Regression Testing

```typescript
test('component appearance', async ({ visualTesting }) => {
  await visualTesting.compareElement('[selector]', 'component-name');
  await visualTesting.compareResponsive('component-name');
});
```

### Performance Testing

```typescript
test('performance metrics', async ({ testReporter }) => {
  const metrics = await testReporter.capturePerformanceMetrics();
  // Assert on metrics
});
```

## CI/CD Integration

The framework integrates with GitHub Actions and provides:

- Automated test execution on PR
- Performance regression detection
- Visual regression comparison
- Test artifacts storage
- Performance reports in PR comments

## Best Practices

1. **Test Independence**
   - Each test should be independent and self-contained
   - Use `testHelpers` to manage test data
   - Clean up after tests using fixtures

2. **Selectors**
   - Use `data-testid` attributes for test selectors
   - Maintain a centralized list of selectors in page objects
   - Avoid brittle selectors like CSS classes

3. **Performance Testing**
   - Define clear performance budgets
   - Test critical user paths
   - Monitor trends over time

4. **Visual Testing**
   - Maintain baseline images in version control
   - Test responsive layouts
   - Include interaction states

5. **Maintenance**
   - Keep page objects updated
   - Review and update performance thresholds
   - Regularly update visual baselines

## Troubleshooting

### Common Issues

1. **Test Flakiness**
   - Use proper wait strategies
   - Avoid hard-coded timeouts
   - Handle async operations properly

2. **Visual Test Failures**
   - Check for dynamic content
   - Review viewport sizes
   - Verify environment consistency

3. **Performance Variability**
   - Run tests multiple times
   - Use consistent test data
   - Monitor system resources

## Contributing

1. Follow the existing patterns and conventions
2. Add proper documentation for new features
3. Include both positive and negative test cases
4. Update visual baselines when needed
5. Review performance implications

## Resources

- [Playwright Documentation](https://playwright.dev)
- [The New Fuse API Documentation](./API_SPECIFICATION.md)
- [Performance Testing Guide](./PERFORMANCE_TESTING.md)
- [Visual Testing Guide](./VISUAL_TESTING.md)