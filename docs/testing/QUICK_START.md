# Testing Quick Start Guide

Get started with testing in The New Fuse monorepo in 5 minutes.

## Prerequisites

```bash
# 1. Install dependencies
pnpm install

# 2. Install Playwright browsers (for E2E tests)
pnpm exec playwright install --with-deps chromium
```

## Writing Your First Test

### React Component Test

Create a test file next to your component:

```typescript
// src/components/__tests__/MyComponent.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('should render successfully', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### NestJS Service Test

```typescript
// src/services/__tests__/my-service.spec.ts
import { Test } from '@nestjs/testing';
import { MyService } from '../my-service';

describe('MyService', () => {
  let service: MyService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [MyService],
    }).compile();

    service = module.get<MyService>(MyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

### E2E Test

```typescript
// e2e/my-feature.spec.ts
import { test, expect } from '@playwright/test';

test('should navigate to page', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/The New Fuse/);
});
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run specific test types
pnpm test:unit          # Unit tests
pnpm test:integration   # Integration tests
pnpm test:e2e          # E2E tests

# Run tests in watch mode
pnpm test:unit -- --watch

# Run with coverage
pnpm test:coverage
```

## Using Test Utilities

Import shared utilities from the testing package:

```typescript
import {
  createUserFixture,
  createMockRepository,
  waitFor,
  randomEmail,
} from '@the-new-fuse/testing';

// Create test data
const user = createUserFixture({ name: 'Test User' });

// Create mocks
const mockRepo = createMockRepository();

// Wait for conditions
await waitFor(() => element.isVisible());

// Generate random data
const email = randomEmail();
```

## Common Patterns

### Test a Component with User Interaction

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('should handle button click', async () => {
  const user = userEvent.setup();
  render(<MyButton onClick={handleClick} />);

  await user.click(screen.getByRole('button'));
  expect(handleClick).toHaveBeenCalled();
});
```

### Test API Endpoint

```typescript
import * as request from 'supertest';

it('should return user data', () => {
  return request(app.getHttpServer())
    .get('/users/1')
    .expect(200)
    .expect((res) => {
      expect(res.body.name).toBe('John Doe');
    });
});
```

### Test Async Operations

```typescript
it('should load data', async () => {
  const data = await service.fetchData();
  expect(data).toBeDefined();
});
```

### Mock Dependencies

```typescript
import { vi } from 'vitest';

const mockService = {
  fetchData: vi.fn().mockResolvedValue({ data: 'test' }),
};
```

## Tips

1. **Use descriptive test names**:
   `it('should show error when email is invalid')`
2. **Keep tests focused**: One test, one assertion (when possible)
3. **Use beforeEach for setup**: Ensure clean state for each test
4. **Mock external dependencies**: Don't hit real APIs or databases in unit
   tests
5. **Use test utilities**: Leverage shared helpers and fixtures

## Next Steps

1. Read the [Full Testing Guide](./README.md)
2. Review [Best Practices](./BEST_PRACTICES.md)
3. Check example tests in `packages/testing/src/__tests__/`
4. Start writing tests for your features!

## Need Help?

- Check the [Testing Guide](./README.md) for detailed examples
- Look at existing tests for patterns
- Review test utilities in `packages/testing/src/utils/`

---

Happy Testing! 🧪
