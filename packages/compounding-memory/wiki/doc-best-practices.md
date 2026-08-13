# Verified Doc: Best Practices

**Category:** verified-documentation **Agent:** AGENT-DOC-ASSIMILATOR
**Timestamp:** 1774048323.4063182

## Content

# Testing Best Practices

Guidelines and best practices for writing effective tests in The New Fuse
monorepo.

## Table of Contents

1. [General Principles](#general-principles)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [E2E Testing](#e2e-testing)
5. [Test Organization](#test-organization)
6. [Mocking Strategies](#mocking-strategies)
7. [Performance](#performance)
8. [Common Patterns](#common-patterns)
9. [Anti-Patterns](#anti-patterns)

## General Principles

### 1. Write Testable Code

**Good Example:**

```typescript
// ✅ Dependency injection makes testing easy
class UserService {
  constructor(private userRepository: UserRepository) {}

  async getUser(id: string) {
    return this.userRepository.findById(id);
  }
}

// Easy to test with mock repository
const mockRepo = createMockRepository();
const service = new UserService(mockRepo);
```

**Bad Example:**

```typescript
// ❌ Hard-coded dependency makes testing difficult
class UserService {
  async getUser(id: string) {
    const repo = new UserRepository(); // Hard to mock
    return repo.findById(id);
  }
}
```

### 2. Follow the AAA Pattern

**Arrange** - Set up test data and conditions **Act** - Execute the code being
tested **Assert** - Verify the results

```typescript
it('should create a new user', async () => {
  // Arrange
  const userData = { email: 'test@example.com', name: 'Test User' };
  const mockRepo = createMockRepository();
  mockRepo.save.mockResolvedValue({ id: '1', ...userData });
  const service = new UserService(mockRepo);

  // Act
  const result = await service.createUser(userData);

  // Assert
  expect(result).toEqual({ id: '1', ...userData });
  expect(mockRepo.save).toHaveBeenCalledWith(userData);
});
```

### 3. One Assertion Per Test (When Possible)

```typescript
// ✅ Good: Focused test
it('should return user with correct email', async () => {
  const user = await service.getUser('1');
  expect(user.email).toBe('test@example.com');
});

it('should return user with correct name', async () => {
  const user = await service.getUser('1');
  expect(user.name).toBe('Test User');
});

// ⚠️ Acceptable: Related assertions
it('should return complete user object', async () => {
  const user = await service.getUser('1');
  expect(user).toMatchObject({
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
  });
});
```

### 4. Use Descriptive Test Names

```typescript
// ✅ Good: Clear and descriptive
it('should throw error when email is invalid', () => {});
it('should send welcome email after user registration', () => {});
it('should return 404 when user is not found', () => {});

// ❌ Bad: Vague or unclear
it('should work', () => {});
it('test user', () => {});
it('handles error', () => {});
```

### 5. Keep Tests Independent

```typescript
// ✅ Good: Each test sets up its own state
describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService(createMockRepository());
  });

  it('should create user', async () => {
    const user = await service.create({ email: 'test@example.com' });
    expect(user).toBeDefined();
  });

  it('should delete user', async () => {
    const result = await service.delete('1');
    expect(result).toBe(true);
  });
});

// ❌ Bad: Tests depend on each other
describe('UserService', () => {
  let userId: string;

  it('should create user', async () => {
    const user = await service.create({ email: 'test@example.com' });
    userId = user.id; // ❌ Storing state for next test
  });

  it('should delete user', async () => {
    await service.delete(userId); // ❌ Depends on previous test
  });
});
```

## Unit Testing

### React Components

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserProfile } from '../UserProfile';

describe('UserProfile', () => {
  it('should render user information', () => {
    const user = { name: 'John Doe', email: 'john@example.com' };
    render(<UserProfile user={user} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', async () => {
    const user = { name: 'John Doe', email: 'john@example.com' };
    const handleEdit = vi.fn();
    const userSetup = userEvent.setup();

    render(<UserProfile user={user} onEdit={handleEdit} />);

    await userSetup.click(screen.getByRole('button', { name: /edit/i }));

    expect(handleEdit).toHaveBeenCalledTimes(1);
    expect(handleEdit).toHaveBeenCalledWith(user);
  });

  it('should display loading state', () => {
    render(<UserProfile user={null} isLoading={true} />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
```

### NestJS Services

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user.service';
import { createMockRepository } from '@the-new-fuse/testing';

describe('UserService', () => {
  let service: UserService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: 'UserRepository',
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  describe('createUser', () => {
    it('should create and return a user', async () => {
      const userData = { email: 'test@example.com', name: 'Test' };
      const expectedUser = { id: '1', ...userData };

      mockRepo.save.mockResolvedValue(expectedUser);

      const result = await service.createUser(userData);

      expect(result).toEqual(expectedUser);
      expect(mockRepo.save).toHaveBeenCalledWith(userData);
    });

    it('should throw error for duplicate email', async () => {
      const userData = { email: 'existing@example.com', name: 'Test' };

      mockRepo.save.mockRejectedValue(new Error('Duplicate email'));

      await expect(service.createUser(userData)).rejects.toThrow(
        'Duplicate email'
      );
    });
  });
});
```

## Integration Testing

### API Endpoints

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Users API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get auth token for authenticated tests
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /users', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer()).get('/users').expect(401);
    });

    it('should return users with auth token', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('POST /users', () => {
    it('should create a new user', () => {
      const userData = { email: 'new@example.com', name: 'New User' };

      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(userData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toMatchObject(userData);
          expect(res.body).toHaveProperty('id');
        });
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'test@example.com' }) // Missing name
        .expect(400);
    });
  });
});
```

### Database Operations

```typescript
describe('UserRepository', () => {
  let repository: UserRepository;
  let connection: Connection;

  beforeAll(async () => {
    // Set up test database connection
    connection = await createTestConnection();
    repository = connection.getRepository(User);
  });

  afterAll(async () => {
    await connection.close();
  });

  beforeEach(async () => {
    // Clear database before each test
    await repository.clear();
  });

  it('should save and retrieve user', async () => {
    const user = repository.create({
      email: 'test@example.com',
      name: 'Test User',
    });

    await repository.save(user);

    const found = await repository.findOne({ where: { email: user.email } });

    expect(found).toBeDefined();
    expect(found.email).toBe(user.email);
  });

  it('should enforce unique email constraint', async () => {
    await repository.save({
      email: 'test@example.com',
      name: 'User 1',
    });

    await expect(
      repository.save({
        email: 'test@example.com',
        name: 'User 2',
      })
    ).rejects.toThrow();
  });
});
```

## E2E Testing

### Page Objects Pattern

```typescript
// e2e/pages/LoginPage.ts
import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('/dashboard');
  }

  async getErrorMessage() {
    return this.page.textContent('[data-testid="error-message"]');
  }
}

// e2e/login.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test.describe('Login', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should login with valid credentials', async () => {
    await loginPage.login('user@example.com', 'password');
    // Should be redirected to dashboard
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await loginPage.login('user@example.com', 'wrong-password');

    const error = await loginPage.getErrorMessage();
    expect(error).toContain('Invalid credentials');
  });
});
```

### Testing Workflows

```typescript
test.describe('Workflow Creation', () => {
  test('should create complete workflow', async ({ page }) => {
    // Navigate to workflows
    await page.goto('/workflows');

    // Create new workflow
    await page.click('[data-testid="create-workflow"]');
    await page.fill('input[name="name"]', 'Test Workflow');

    // Add nodes
    await page.click('[data-testid="add-node"]');
    await page.click('[data-testid="node-type-ai-agent"]');

    // Connect nodes
    await page.dragAndDrop(
      '[data-node-id="1"] [data-handle="output"]',
      '[data-node-id="2"] [data-handle="input"]'
    );

    // Save workflow
    await page.click('[data-testid="save-workflow"]');

    // Verify success
    await expect(page.getByText('Workflow saved')).toBeVisible();
  });
});
```

## Test Organization

### File Structure

```
packages/core/
├── src/
│   ├── services/
│   │   ├── user.service.ts
│   │   └── __tests__/
│   │       ├── user.service.test.ts      # Unit tests
│   │       └── user.service.integration.test.ts  # Integration tests
│   └── utils/
│       ├── validators.ts
│       └── __tests__/
│           └── validators.test.ts
└── test/
    └── fixtures/
        └── users.ts
```

### Test Suites

```typescript
describe('UserService', () => {
  describe('User Creation', () => {
    it('should create user with valid data', () => {});
    it('should validate email format', () => {});
    it('should hash password', () => {});
  });

  describe('User Retrieval', () => {
    it('should find user by id', () => {});
    it('should find user by email', () => {});
    it('should return null for non-existent user', () => {});
  });

  describe('User Update', () => {
    it('should update user fields', () => {});
    it('should not update email to existing email', () => {});
  });
});
```

## Mocking Strategies

### Mock Functions

```typescript
import { vi } from 'vitest';

// Simple mock
const mockFn = vi.fn();

// Mock with return value
const mockFn = vi.fn().mockReturnValue('result');

// Mock with resolved value (async)
const mockFn = vi.fn().mockResolvedValue({ data: 'result' });

// Mock with implementation
const mockFn = vi.fn((x) => x * 2);

// Mock different return values
const mockFn = vi
  .fn()
  .mockReturnValueOnce('first')
  .mockReturnValueOnce('second')
  .mockReturnValue('default');
```

### Mock Modules

```typescript
// Mock entire module
vi.mock('../api/client', () => ({
  fetchUser: vi.fn().mockResolvedValue({ id: '1', name: 'Test' }),
  createUser: vi.fn().mockResolvedValue({ id: '2', name: 'New' }),
}));

// Partial mock
vi.mock('../config', async () => {
  const actual = await vi.importActual('../config');
  return {
    ...actual,
    API_URL: 'http://test-api.com',
  };
});
```

### Mock External Services

```typescript
class MockEmailService {
  sendEmail = vi.fn().mockResolvedValue(true);
  sendBulkEmails = vi.fn().mockResolvedValue({ sent: 10, failed: 0 });
}

const module = await Test.createTestingModule({
  providers: [
    UserService,
    {
      provide: EmailService,
      useClass: MockEmailService,
    },
  ],
}).compile();
```

## Performance

### Optimize Test Speed

```typescript
// ✅ Good: Share expensive setup
describe('UserService', () => {
  let service: UserService;

  beforeAll(async () => {
    // Expensive setup once
    service = await createTestService();
  });

  afterAll(async () => {
    await cleanupService(service);
  });

  // Tests run faster
  it('test 1', () => {});
  it('test 2', () => {});
});

// ❌ Bad: Recreate for each test
describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    service = await createTestService(); // Slow
  });

  it('test 1', () => {});
  it('test 2', () => {});
});
```

### Parallel Test Execution

```typescript
// Run tests in parallel (default in Vitest)
describe.concurrent('Parallel tests', () => {
  it('test 1', async () => {});
  it('test 2', async () => {});
  it('test 3', async () => {});
});

// Force sequential
describe.sequential('Sequential tests', () => {
  it('test 1', async () => {});
  it('test 2', async () => {});
});
```

## Common Patterns

### Testing Async Code

```typescript
// ✅ Good: Use async/await
it('should fetch user', async () => {
  const user = await service.getUser('1');
  expect(user).toBeDefined();
});

// ✅ Good: Return promise
it('should fetch user', () => {
  return service.getUser('1').then((user) => {
    expect(user).toBeDefined();
  });
});

// ❌ Bad: No async handling
it('should fetch user', () => {
  service.getUser('1'); // Test completes before promise resolves
  expect(user).toBeDefined();
});
```

### Testing Error Handling

```typescript
it('should throw error for invalid input', async () => {
  await expect(service.createUser({ email: 'invalid' })).rejects.toThrow(
    'Invalid email'
  );
});

it('should handle network errors', async () => {
  mockApi.fetchUser.mockRejectedValue(new Error('Network error'));

  await expect(service.getUser('1')).rejects.toThrow('Network error');
});
```

### Testing State Changes

```typescript
it('should update component state', async () => {
  const { rerender } = render(<Counter initialValue={0} />);

  const button = screen.getByRole('button');
  await userEvent.click(button);

  expect(screen.getByText('1')).toBeInTheDocument();
});
```

## Anti-Patterns

### ❌ Testing Implementation Details

```typescript
// ❌ Bad: Testing internal state
it('should set loading to true', () => {
  const component = render(<UserList />);
  expect(component.state.isLoading).toBe(true);
});

// ✅ Good: Testing behavior
it('should show loading indicator', () => {
  render(<UserList />);
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
});
```

### ❌ Snapshot Testing Everything

```typescript
// ❌ Bad: Large component snapshots
it('should render correctly', () => {
  const { container } = render(<ComplexDashboard />);
  expect(container).toMatchSnapshot(); // Fragile
});

// ✅ Good: Specific assertions
it('should display user name', () => {
  render(<ComplexDashboard user={{ name: 'John' }} />);
  expect(screen.getByText('John')).toBeInTheDocument();
});
```

### ❌ Over-Mocking

```typescript
// ❌ Bad: Mocking everything
vi.mock('./userService');
vi.mock('./emailService');
vi.mock('./loggerService');
vi.mock('./cacheService');
// ... test becomes meaningless

// ✅ Good: Mock only external dependencies
vi.mock('./emailService'); // External service
// Test with real implementations of internal services
```

### ❌ Shared Test State

```typescript
// ❌ Bad: Shared mutable state
const sharedUser = { id: '1', name: 'Test' };

it('test 1', () => {
  sharedUser.name = 'Changed'; // Affects other tests
});

it('test 2', () => {
  expect(sharedUser.name).toBe('Test'); // Fails!
});

// ✅ Good: Create fresh state
function createTestUser() {
  return { id: '1', name: 'Test' };
}

it('test 1', () => {
  const user = createTestUser();
  user.name = 'Changed';
});

it('test 2', () => {
  const user = createTestUser();
  expect(user.name).toBe('Test'); // Passes
});
```

---

**Last Updated**: 2025-11-18

## Backlinks

- [[documentation-index]]
- [[sovereign-state]]
