<instruction>You are an expert software engineer. You are working on a WIP
branch. Please run `git status` and `git diff` to understand the changes and the
current state of the code. Analyze the workspace context and complete the
mission brief.</instruction> <workspace_context> This is a NestJS monorepo for
an AI Agent Orchestration Engine called "The New Fuse". Major changes are
happening including migration from Drizzle to Drizzle ORM. Documentation needs
updating. </workspace_context> <mission_brief>

## Task: Update Package READMEs for Database Changes

Update documentation to reflect the Drizzle to Drizzle migration.

### Steps:

1. Check existing documentation:
   - `cat packages/database/README.md`
   - `cat README.md` (root)
2. Update `packages/database/README.md`:
   - Add section on Drizzle ORM usage
   - Document new exports (DrizzleModule, DrizzleClient, etc.)
   - Explain coexistence with Drizzle during migration
   - Add code examples for common operations
3. Check for other packages that use database:
   - `grep -r "@the-new-fuse/database" packages/*/package.json`
4. Add migration notes to root README if appropriate
5. Create/update CHANGELOG.md with recent changes
6. Ensure all documentation uses correct import paths

### Success Criteria:

- packages/database/README.md fully updated
- Code examples are accurate and copy-pasteable
- Migration status clearly documented
- No references to deprecated APIs </mission_brief>
