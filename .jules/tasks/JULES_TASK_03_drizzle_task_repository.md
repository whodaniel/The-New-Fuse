<instruction>You are an expert software engineer. You are working on a WIP
branch. Please run `git status` and `git diff` to understand the changes and the
current state of the code. Analyze the workspace context and complete the
mission brief.</instruction> <workspace_context> This is a NestJS monorepo for
an AI Agent Orchestration Engine called "The New Fuse". We are migrating from
Prisma 7 to Drizzle ORM. The foundation has been laid in
packages/database/src/drizzle/.

Key files to reference:

- packages/database/src/drizzle/repositories/agent.repository.ts (example
  pattern)
- packages/database/src/drizzle/schema/tasks.ts (task/pipeline schema)
- packages/database/src/drizzle/types.ts (type exports)
- packages/database/src/repositories/task.repository.ts (existing Prisma
  repository) </workspace_context> <mission_brief>

## Task: Create Drizzle Task & Pipeline Repositories

Create Drizzle-based TaskRepository and PipelineRepository.

### Steps:

1. Create `packages/database/src/drizzle/repositories/task.repository.ts`
2. Implement TaskRepository methods:
   - `create(data: NewTask): Promise<Task>`
   - `findById(id: string): Promise<Task | null>`
   - `findByUserId(userId: string): Promise<Task[]>`
   - `findByAssignedAgent(agentId: string): Promise<Task[]>`
   - `findByStatus(status: string): Promise<Task[]>`
   - `findByPriority(priority: string): Promise<Task[]>`
   - `update(id: string, data: Partial<NewTask>): Promise<Task | null>`
   - `updateStatus(id: string, status: string): Promise<boolean>`
   - `softDelete(id: string): Promise<boolean>`
   - `createExecution(data: NewTaskExecution): Promise<TaskExecution>`
   - `findExecutionsByTaskId(taskId: string): Promise<TaskExecution[]>`
3. Create `packages/database/src/drizzle/repositories/pipeline.repository.ts`
4. Implement PipelineRepository with CRUD + task association methods
5. Export both from `packages/database/src/drizzle/repositories/index.ts`

### Success Criteria:

- Both repositories compile without errors
- Proper task-pipeline relationships handled
- All methods follow established patterns </mission_brief>
