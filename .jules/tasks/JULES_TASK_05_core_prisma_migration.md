<instruction>You are an expert software engineer. You are working on a WIP
branch. Please run `git status` and `git diff` to understand the changes and the
current state of the code. Analyze the workspace context and complete the
mission brief.</instruction> <workspace_context> This is a NestJS monorepo for
an AI Agent Orchestration Engine called "The New Fuse". The @the-new-fuse/core
package has TypeScript stack overflow issues due to Prisma 7's recursive types.

There are 6 files in packages/core/src that use PrismaClient:

- services/AgentMetadataManager.ts
- communication/MessagingService.ts
- communication/NotificationService.ts
- prisma/prisma.service.ts
- database/DatabaseMonitor.ts
- database/TransactionManager.ts

We have created Drizzle ORM infrastructure in packages/database/src/drizzle/
that should be used instead. </workspace_context> <mission_brief>

## Task: Migrate Core Package Prisma Service to Drizzle

Migrate the prisma.service.ts in packages/core to use the Drizzle infrastructure
from @the-new-fuse/database.

### Steps:

1. First, search for and understand the current prisma.service.ts in
   packages/core:
   - `find packages/core -name "prisma.service.ts" -o -name "*prisma*"`
2. Check what the service exports and how it's used
3. Create a Drizzle-compatible wrapper or update the service to:
   - Import from `@the-new-fuse/database` (the Drizzle exports)
   - Provide the same interface but use Drizzle under the hood
   - OR create a new DrizzleService that can be injected alongside
4. Update imports in files that use the old Prisma service
5. Run `pnpm type-check` in packages/core to verify no TypeScript errors

### Success Criteria:

- packages/core compiles without Prisma-related stack overflow errors
- Database functionality preserved through Drizzle
- Minimal changes to consuming code </mission_brief>
