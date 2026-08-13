# @the-new-fuse/shared

Shared utilities, components, and hooks for The New Fuse.

## Overview

This package contains shared code that is used across multiple packages in The New Fuse monorepo.

## Testing

The shared package uses Jest for testing. The configuration is in `jest.config.js`.

### Running Tests

```bash
# From the package directory
npx jest

# Run a specific test file
npx jest src/ui/__tests__/ui.test.ts

# Run tests with coverage
npx jest --coverage

# Run tests in watch mode
npx jest --watch
```

### Test Structure

- Tests are located in `__tests__` directories or named with `.test.ts` or `.spec.ts` suffix
- Test setup is in `test/setup.ts`
- Mock files are in `test/__mocks__`

### Writing Tests

```typescript
// Example test
import { someFunction } from '../index';

describe('Some Feature', () => {
  it('should do something', () => {
    expect(someFunction()).toBe(expectedResult);
  });
});
```

## Available Scripts

- `build`: Build the package
- `clean`: Clean build artifacts
- `dev`: Run in development mode
- `test`: Run tests
- `lint`: Run linter
