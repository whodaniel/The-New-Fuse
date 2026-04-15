<instruction>You are an expert software engineer. You are working on a WIP
branch. Please run `git status` and `git diff` to understand the changes and the
current state of the code. Analyze the workspace context and complete the
mission brief.</instruction> <workspace_context> This is a NestJS monorepo for
an AI Agent Orchestration Engine called "The New Fuse". Multiple packages have
dependencies that may have security vulnerabilities or be outdated.
</workspace_context> <mission_brief>

## Task: Dependency Security Audit

Run security audit on dependencies and address vulnerabilities.

### Steps:

1. Run npm/pnpm audit:
   - `pnpm audit` at repository root
   - Note all HIGH and CRITICAL vulnerabilities
2. Check for outdated dependencies:
   - `pnpm outdated`
   - Focus on major security packages (@nestjs/\*, drizzle, pg, etc.)
3. For each HIGH/CRITICAL vulnerability:
   - Identify the affected package
   - Check if update is available that fixes it
   - Test if update is compatible
4. Update safe dependencies:
   - `pnpm update <package>` for minor/patch updates
   - Test compilation after updates
5. Document any vulnerabilities that cannot be fixed:
   - Reason (breaking change, no fix available)
   - Mitigation in place
6. Commit dependency updates

### Success Criteria:

- No CRITICAL vulnerabilities remaining
- HIGH vulnerabilities addressed or documented
- `pnpm audit` shows improved security status
- All packages still compile after updates </mission_brief>
