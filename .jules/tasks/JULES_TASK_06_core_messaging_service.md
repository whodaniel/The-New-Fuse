<instruction>You are an expert software engineer. You are working on a WIP
branch. Please run `git status` and `git diff` to understand the changes and the
current state of the code. Analyze the workspace context and complete the
mission brief.</instruction> <workspace_context> This is a NestJS monorepo for
an AI Agent Orchestration Engine called "The New Fuse". The @the-new-fuse/core
package has TypeScript issues due to Prisma 7.

The communication/MessagingService.ts uses PrismaClient for storing messages. We
need to migrate it to use Drizzle ORM from @the-new-fuse/database.
</workspace_context> <mission_brief>

## Task: Migrate MessagingService from Prisma to Drizzle

Convert the MessagingService in packages/core to use Drizzle ORM.

### Steps:

1. Locate and analyze `packages/core/src/communication/MessagingService.ts`
2. Identify all Prisma usages (likely prisma.message.create, findMany, etc.)
3. Replace with Drizzle equivalents:
   - Import `{ db, messages, eq, desc }` from `@the-new-fuse/database`
   - Replace `prisma.message.create()` with
     `db.insert(messages).values().returning()`
   - Replace `prisma.message.findMany()` with
     `db.select().from(messages).where()`
   - Replace `prisma.message.update()` with
     `db.update(messages).set().where().returning()`
4. Update the service's constructor to not require PrismaClient
5. Test compilation with `pnpm type-check --filter @the-new-fuse/core`

### Success Criteria:

- MessagingService compiles without errors
- No PrismaClient imports remain in the file
- Message CRUD operations use Drizzle </mission_brief>
