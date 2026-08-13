<instruction>You are an expert software engineer. You are working on a WIP
branch. Please run `git status` and `git diff` to understand the changes and the
current state of the code. Analyze the workspace context and complete the
mission brief.</instruction> <workspace_context> This is a NestJS monorepo for
an AI Agent Orchestration Engine called "The New Fuse". Security is critical for
API keys, database connections, and user authentication. </workspace_context>
<mission_brief>

## Task: Security Audit - Sensitive Data Handling

Audit the codebase for sensitive data handling issues.

### Steps:

1. Search for hardcoded secrets:
   - `grep -r "apiKey.*=" packages/ --include="*.ts" | grep -v ".d.ts"`
   - `grep -r "password.*=" packages/ --include="*.ts"`
   - `grep -r "secret.*=" packages/ --include="*.ts"`
2. Check for exposed sensitive fields in responses:
   - Look for hashedPassword, apiKey, refreshToken in DTOs
   - Ensure password fields are excluded from responses
3. Verify environment variable usage:
   - `grep -r "process.env" packages/`
   - Ensure secrets come from env vars, not hardcoded
4. Check database schema for sensitive fields:
   - `cat packages/database/src/drizzle/schema/users.ts`
   - Ensure password hash fields not exposed
5. Create findings report with:
   - File, line number, issue description
   - Severity (HIGH/MEDIUM/LOW)
   - Recommended fix
6. Fix any critical issues found

### Success Criteria:

- No hardcoded secrets in codebase
- Sensitive fields properly excluded from API responses
- Environment variables used for all secrets
- Security findings documented </mission_brief>
