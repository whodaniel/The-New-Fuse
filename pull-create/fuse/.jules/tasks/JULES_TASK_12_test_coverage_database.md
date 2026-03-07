<instruction>You are an expert software engineer. You are working on a WIP
branch. Please run `git status` and `git diff` to understand the changes and the
current state of the code. Analyze the workspace context and complete the
mission brief.</instruction> <workspace_context> This is a NestJS monorepo for
an AI Agent Orchestration Engine called "The New Fuse". We have new Drizzle ORM
repositories in packages/database/src/drizzle/repositories/ that need unit
tests. </workspace_context> <mission_brief>

## Task: Add Unit Tests for Drizzle Repositories

Create unit tests for the new Drizzle ORM repositories.

### Steps:

1. Check existing test setup:
   - `ls packages/database/__tests__/` or `packages/database/src/**/*.spec.ts`
   - Check for Jest or Vitest configuration
2. Create test file(s) for repositories:
   - `packages/database/src/drizzle/repositories/__tests__/agent.repository.spec.ts`
3. Write tests for DrizzleAgentRepository:
   - Test create() returns new agent
   - Test findById() returns agent or null
   - Test findByUserId() returns array
   - Test update() modifies and returns agent
   - Test softDelete() sets deletedAt
   - Test search() with query string
4. Mock the database connection appropriately:
   - Use Jest mocks or test containers
   - Ensure tests are isolated
5. Run tests: `pnpm test --filter @the-new-fuse/database`

### Success Criteria:

- At least 5 tests for AgentRepository
- Tests pass in isolation (mocked DB)
- Coverage for main CRUD operations
- Clear test descriptions </mission_brief>
