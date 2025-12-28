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
- packages/database/src/drizzle/schema/workflows.ts (workflow schema)
- packages/database/src/drizzle/types.ts (type exports)
- packages/database/src/repositories/workflow.repository.ts (existing Prisma
  repository) </workspace_context> <mission_brief>

## Task: Create Drizzle Workflow Repository

Create a new Drizzle-based WorkflowRepository following the established pattern.

### Steps:

1. Create `packages/database/src/drizzle/repositories/workflow.repository.ts`
2. Implement the following methods:
   - `create(data: NewWorkflow): Promise<Workflow>`
   - `findById(id: string): Promise<Workflow | null>`
   - `findByIdWithSteps(id: string): Promise<Workflow & { steps: WorkflowStep[] } | null>`
   - `findByCreatorId(creatorId: string): Promise<Workflow[]>`
   - `findActive(): Promise<Workflow[]>`
   - `update(id: string, data: Partial<NewWorkflow>): Promise<Workflow | null>`
   - `updateStatus(id: string, status: string): Promise<boolean>`
   - `softDelete(id: string): Promise<boolean>`
   - `incrementExecutionCount(id: string): Promise<void>`
   - `createStep(data: NewWorkflowStep): Promise<WorkflowStep>`
   - `findStepsByWorkflowId(workflowId: string): Promise<WorkflowStep[]>`
3. Export from `packages/database/src/drizzle/repositories/index.ts`

### Success Criteria:

- TypeScript compiles without errors
- Proper join queries for workflow with steps
- All methods follow established patterns </mission_brief>
