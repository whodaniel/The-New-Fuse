<instruction>You are an expert software engineer. You are working on a WIP
branch. Please run `git status` and `git diff` to understand the changes and the
current state of the code. Analyze the workspace context and complete the
mission brief.</instruction> <workspace_context> This is a NestJS monorepo for
an AI Agent Orchestration Engine called "The New Fuse". New files have been
added for Drizzle ORM that may need linting and formatting. </workspace_context>
<mission_brief>

## Task: Lint and Format New Drizzle Files

Run linting and formatting on the new Drizzle ORM files and fix any issues.

### Steps:

1. Check ESLint configuration:
   - `cat packages/database/.eslintrc.js` or similar
   - `cat .eslintrc.js` (root)
2. Run linting on new files:
   - `pnpm lint --filter @the-new-fuse/database`
   - Or: `npx eslint packages/database/src/drizzle/**/*.ts`
3. Fix all linting errors:
   - Unused imports
   - Missing return types
   - Naming conventions
   - Import ordering
4. Run Prettier formatting:
   - `pnpm format --filter @the-new-fuse/database`
5. Check for any remaining warnings and address them
6. Commit formatting changes if any

### Success Criteria:

- `pnpm lint --filter @the-new-fuse/database` passes with 0 errors
- All files properly formatted
- No ESLint warnings in Drizzle files </mission_brief>
