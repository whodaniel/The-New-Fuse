# Running Phase 4 Integration Tests

This guide explains how to run the comprehensive integration test suite for all
Drizzle repositories.

## Prerequisites

1. **PostgreSQL Test Database**: Running on port 5433
2. **Node.js**: Version 20 or higher
3. **pnpm**: Package manager installed globally
4. **Dependencies**: All packages installed

## Environment Setup

### 1. Configure Test Database

Create or update `.env.test` file in the database package:

```bash
TEST_DATABASE_URL=postgresql://newfuse:secretpass123@localhost:5433/the_new_fuse_test
```

### 2. Start PostgreSQL (if using Docker)

```bash
# From project root
pnpm run docker:start

# Verify PostgreSQL is running
docker ps | grep postgres
```

### 3. Run Database Migrations

```bash
# From packages/database directory
cd packages/database

# Apply migrations to test database
pnpm drizzle:migrate
```

## Running Tests

### Run All Tests

```bash
# From packages/database directory
pnpm test
```

Expected output:

- **268 tests** across 5 repository test suites
- All tests should pass
- Test execution time: ~30-60 seconds (depending on hardware)

### Run Tests in Watch Mode

```bash
pnpm test:watch
```

Useful for development - automatically re-runs tests when files change.

### Run Tests with Coverage

```bash
pnpm test:coverage
```

Generates coverage report showing:

- **Target**: 95% code coverage
- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

Coverage report will be in `coverage/` directory.

### Run Tests with Verbose Output

```bash
pnpm test:verbose
```

Shows detailed output for each test case.

### Run Specific Test Suite

```bash
# User repository tests only
pnpm test user.repository.test.ts

# Agent repository tests only
pnpm test agent.repository.test.ts

# Chat repository tests only
pnpm test chat.repository.test.ts

# Task repository tests only
pnpm test task.repository.test.ts

# Workflow repository tests only
pnpm test workflow.repository.test.ts
```

## Test Suite Breakdown

### Total: 268 Integration Tests for 118 Repository Methods

1. **UserRepository** (15 methods)
   - 31 tests
   - User CRUD operations
   - Session management
   - Soft delete functionality

2. **AgentRepository** (23 methods)
   - 53 tests
   - Agent CRUD operations
   - Search and discovery
   - Registration management
   - Metadata handling

3. **ChatRepository** (24 methods + 7 new methods = 31 total)
   - 52 tests (may need updates for 7 new methods)
   - Chat operations
   - Message operations
   - Chat room operations
   - Ephemeral messages
   - **NEW**: Participant management (5 methods)
   - **NEW**: Read receipts (1 method)
   - **NEW**: Joined rooms (1 method)

4. **TaskRepository** (24 methods)
   - 55 tests
   - Task operations
   - Pipeline operations
   - Execution tracking

5. **WorkflowRepository** (32 methods)
   - 77 tests
   - Workflow operations
   - Workflow steps
   - Workflow executions
   - Workflow templates

## Expected Test Results

### All Tests Passing

```
PASS  __tests__/repositories/user.repository.test.ts
PASS  __tests__/repositories/agent.repository.test.ts
PASS  __tests__/repositories/chat.repository.test.ts
PASS  __tests__/repositories/task.repository.test.ts
PASS  __tests__/repositories/workflow.repository.test.ts

Test Suites: 5 passed, 5 total
Tests:       268 passed, 268 total
Snapshots:   0 total
Time:        XX.XXXs
```

### Coverage Report

```
--------------------------|---------|----------|---------|---------|
File                      | % Stmts | % Branch | % Funcs | % Lines |
--------------------------|---------|----------|---------|---------|
All files                 |   95+   |   90+    |  100    |   95+   |
 repositories/            |         |          |         |         |
  user.repository.ts      |   95+   |   90+    |  100    |   95+   |
  agent.repository.ts     |   95+   |   90+    |  100    |   95+   |
  chat.repository.ts      |   95+   |   90+    |  100    |   95+   |
  task.repository.ts      |   95+   |   90+    |  100    |   95+   |
  workflow.repository.ts  |   95+   |   90+    |  100    |   95+   |
--------------------------|---------|----------|---------|---------|
```

## Troubleshooting

### Database Connection Errors

**Error**: `Error: connect ECONNREFUSED ::1:5433`

**Solution**:

```bash
# Start PostgreSQL
pnpm run docker:start

# Check it's running
docker ps | grep postgres

# Verify connection
psql postgresql://newfuse:secretpass123@localhost:5433/the_new_fuse_test
```

### Migration Errors

**Error**: `Table does not exist`

**Solution**:

```bash
# Reset and re-run migrations
cd packages/database
pnpm drizzle:push --force
pnpm drizzle:migrate
```

### Test Failures

**Error**: Test timeout or failures

**Solution**:

```bash
# Clear test database
pnpm drizzle:push --force

# Re-run migrations
pnpm drizzle:migrate

# Run tests with verbose output
pnpm test:verbose
```

### Memory Issues

**Error**: `JavaScript heap out of memory`

**Solution**:

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" pnpm test
```

## Known Issues

### ChatRepository - New Methods Not Tested

The ChatRepository was modified after tests were written to add 7 new methods:

1. `findParticipantsByRoomId(roomId: string)`
2. `addParticipant(data: NewChatRoomParticipant)`
3. `findParticipant(roomId: string, userId: string)`
4. `updateParticipant(roomId: string, userId: string, data: Partial<NewChatRoomParticipant>)`
5. `removeParticipant(roomId: string, userId: string)`
6. `upsertReadReceipt(data: NewReadReceipt)`
7. `findJoinedRooms(userId: string)`

**Impact**: Test coverage for ChatRepository will be lower than expected (~75%
instead of 95%)

**Action Required**: Add tests for these 7 methods (estimated 14+ additional
tests needed)

## Next Steps

After running tests successfully:

1. **Verify Coverage**: Check that all repositories meet 95% coverage target
2. **Add Missing Tests**: Write tests for the 7 new ChatRepository methods
3. **Performance Benchmarks** (optional): Create benchmark tests for performance
   validation
4. **CI/CD Integration**: Ensure tests run in GitHub Actions pipeline
5. **Documentation**: Update migration progress report with test results

## CI/CD Integration

Tests should run automatically on:

- Every push to `main` or `develop`
- Every pull request affecting `packages/database/**`

GitHub Actions workflow: `.github/workflows/database-tests.yml`

## Additional Resources

- [Main Test README](./README.md)
- [Phase 4 Test Plan](../../../docs/database/PHASE_4_TEST_PLAN.md)
- [Migration Progress Report](../../../docs/database/MIGRATION_PROGRESS_REPORT.md)
- [Drizzle Migration Guide](../../../docs/database/DRIZZLE_MIGRATION_GUIDE.md)
