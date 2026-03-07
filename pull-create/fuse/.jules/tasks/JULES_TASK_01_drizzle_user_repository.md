<instruction>You are an expert software engineer. You are working on a WIP
branch. Please run `git status` and `git diff` to understand the changes and the
current state of the code. Analyze the workspace context and complete the
mission brief.</instruction> <workspace_context> This is a NestJS monorepo for
an AI Agent Orchestration Engine called "The New Fuse". We are migrating from
Drizzle 7 to Drizzle ORM. The foundation has been laid in
packages/database/src/drizzle/.

Key files to reference:

- packages/database/src/drizzle/repositories/agent.repository.ts (example
  pattern)
- packages/database/src/drizzle/schema/users.ts (user schema)
- packages/database/src/drizzle/types.ts (type exports)
- packages/database/src/repositories/user.repository.ts (existing Drizzle
  repository) </workspace_context> <mission_brief>

## Task: Create Drizzle User Repository

Create a new Drizzle-based UserRepository following the established pattern from
agent.repository.ts.

### Steps:

1. Create `packages/database/src/drizzle/repositories/user.repository.ts`
2. Implement the following methods:
   - `create(data: NewUser): Promise<User>`
   - `findById(id: string): Promise<User | null>`
   - `findByEmail(email: string): Promise<User | null>`
   - `findByUsername(username: string): Promise<User | null>`
   - `update(id: string, data: Partial<NewUser>): Promise<User | null>`
   - `updateLastLogin(id: string): Promise<void>`
   - `softDelete(id: string): Promise<boolean>`
   - `findAll(options?: { limit?: number; offset?: number }): Promise<User[]>`
   - `verifyEmail(id: string): Promise<boolean>`
3. Export from `packages/database/src/drizzle/repositories/index.ts`
4. Follow the same patterns: use `returning()` for updates/deletes, proper null
   handling

### Success Criteria:

- TypeScript compiles without errors
- All methods follow the established Drizzle patterns
- Exported from the repositories index </mission_brief>
