<instruction>You are an expert software engineer. You are working on a WIP
branch. Please run `git status` and `git diff` to understand the changes and the
current state of the code. Analyze the workspace context and complete the
mission brief.</instruction> <workspace_context> This is a NestJS monorepo for
an AI Agent Orchestration Engine called "The New Fuse". The codebase has
multiple packages and some may have TypeScript configuration issues or type
errors. </workspace_context> <mission_brief>

## Task: TypeScript Strict Mode Audit for Database Package

Audit and fix TypeScript issues in the database package to ensure strict type
safety.

### Steps:

1. Run `pnpm type-check --filter @the-new-fuse/database` to identify errors
2. For each error, apply appropriate fixes:
   - Add proper type annotations where inference fails
   - Fix any `any` types with proper typing
   - Handle null/undefined checks properly
   - Ensure all exported types are correctly typed
3. Check `packages/database/tsconfig.json` for strict mode settings
4. If not already enabled, consider enabling:
   - `"strict": true`
   - `"noImplicitAny": true`
   - `"strictNullChecks": true`
5. Fix any new errors that arise from stricter settings
6. Run final type-check to confirm all issues resolved

### Success Criteria:

- `pnpm type-check --filter @the-new-fuse/database` passes with 0 errors
- No `any` types in Drizzle schema or repository files
- All exports have proper TypeScript types </mission_brief>
