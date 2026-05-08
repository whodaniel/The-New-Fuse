# TNF Task + Unified Ledger Tenant/Workspace Scope Hardening (2026-05-08)

## Context

This handoff records the tenant/workspace hardening pass for task management and
unified-ledger APIs, with backward-compatible owner scoping preserved.

## Objectives Completed

1. Added tenant/workspace scope fields to task domain schema.
2. Added tenant/workspace-aware query filtering in task
   repository/service/controller.
3. Added tenant/workspace scope propagation and checks across unified-ledger
   records, timeline events, goals, and plans.
4. Added strict workspace membership/ownership validation on scoped
   unified-ledger write routes.
5. Added canonical workspace scope resolution from authenticated user context.
6. Added workspace derivation from target entities for write mutations that omit
   `workspaceId`.
7. Added DB migration for new task-domain columns and indexes.
8. Verified affected API/unit behavior with targeted test suites.
9. Added authenticated `tenantId` mismatch denial on scoped write payloads.
10. Added Supabase RLS policy migration for task-domain tenant/workspace
    isolation.
11. Applied Supabase RLS scope migration on live project and verified policy
    creation.
12. Remediated mutable `search_path` warnings for new private helper functions.
13. Added and applied missing RLS policies for `workspaces` and
    `workspace_bookmarks`.

## Code Changes

### Task API and Service Scope

- Updated task DTOs to accept optional `workspaceId` in list/create flows.
- Added authenticated tenant scope extraction in task controller.
- Stamped timeline execution-log events with `userId`, `tenantId`, `workspaceId`
  when available.
- Added optional scope support in task service methods (`getTaskById`,
  `getTaskByIdForUser`, `listTasks`).

Files:

- `apps/api/src/modules/task/dto/task.dto.ts`
- `apps/api/src/modules/task/task.controller.ts`
- `apps/api/src/modules/task/task.service.ts`

### Unified Ledger Scope Enforcement

- Added optional `tenantId` and `workspaceId` to ledger domain types:
  - records
  - timeline events
  - goals
  - plans
- Added scope helpers in unified-ledger service:
  - scope normalization
  - scope match checks
- Applied scope filtering/validation to:
  - records list/get/update/vote/link/feedback/grid
  - timeline list/get/update/delete/create dedupe
  - goals/plans list/get/link/milestones/connections
- Added scope propagation in controller endpoints with authenticated tenant and
  optional workspace.
- Added canonical workspace scope behavior:
  - resolves workspace from auth context (`workspaceId`, `activeWorkspaceId`,
    `currentWorkspaceId`, `context.workspaceId`, `scope.workspaceId`)
  - rejects non-privileged request payload/query `workspaceId` that conflicts
    with authenticated workspace scope
- Added canonical tenant scope behavior:
  - rejects non-privileged write payload `tenantId` that conflicts with
    authenticated tenant scope
- Added workspace access validation for scoped writes:
  - require existing workspace
  - allow owner/admin/system users
  - otherwise require explicit workspace membership
  - reject unauthorized writes with `403` and unknown workspaces with `404`
- Added workspace derivation for mutation endpoints when `workspaceId` is
  omitted:
  - derive workspace from target record/goal/plan/timeline event
  - enforce workspace write access on the derived workspace before mutating

Files:

- `apps/api/src/modules/unified-ledger/unified-ledger.types.ts`
- `apps/api/src/modules/unified-ledger/unified-ledger.service.ts`
- `apps/api/src/modules/unified-ledger/unified-ledger.controller.ts`
- `apps/api/src/modules/unified-ledger/unified-ledger.controller.spec.ts`
- `supabase/migrations/002_task_pipeline_execution_rls_scope_guards.sql`
- `supabase/migrations/003_workspace_and_bookmark_rls_scope_guards.sql`
- `supabase/migrations/004_fix_tnf_private_function_search_path.sql`

### Database Schema + Migration

Local repository schema migration (app DB / Drizzle):

- Added columns:
  - `pipelines.tenant_id`, `pipelines.workspace_id`
  - `tasks.tenant_id`, `tasks.workspace_id`
  - `task_executions.user_id`, `task_executions.tenant_id`,
    `task_executions.workspace_id`
- Added FK constraints and indexes for new scope columns.
- Registered migration in drizzle journal.

Files:

- `packages/database/src/drizzle/schema/tasks.ts`
- `packages/database/src/drizzle/repositories/task.repository.ts`
- `packages/database/drizzle/0011_add_task_tenant_workspace_scope.sql`
- `packages/database/drizzle/meta/_journal.json`

Connected Supabase project migration state:

- Project URL: `https://wslydgtgindrywldatbv.supabase.co`
- Applied migration:
  `20260508214944 task_pipeline_execution_rls_scope_guards_v2_20260508`
- Applied migration:
  `20260508215035 fix_tnf_private_function_search_path_20260508`
- Applied migration:
  `20260508215616 workspace_and_bookmark_rls_scope_guards_20260508`
- Note: connected Supabase currently does **not** yet have `tenant_id` /
  `workspace_id` columns on `pipelines`, `tasks`, `task_executions`, nor
  `workspace_members`.
- The applied RLS SQL was intentionally compatibility-safe and enforced
  `user_id` ownership with task-linked fallback for `task_executions`.

## Verification

### Passing suites

Executed:

- `pnpm --filter @the-new-fuse/api-server exec jest src/modules/unified-ledger/unified-ledger.controller.spec.ts --runInBand`
- `pnpm --filter @the-new-fuse/api-server exec jest src/modules/task/task.controller.spec.ts src/modules/unified-ledger/unified-ledger.controller.spec.ts src/modules/unified-ledger/unified-ledger.service.spec.ts --runInBand`

Result:

- 3 suites passed
- 31 tests passed

### Supabase RLS audit

Executed:

- `node scripts/security/supabase-rls-audit.cjs`

Result:

- scanned files: 19
- public tables: 21
- missingRls: 7 (new: 0)
- missingPolicy: 0 (new: 0)

### Supabase live policy verification

Executed via Supabase MCP (`execute_sql`, `list_migrations`, `get_advisors`):

- Confirmed policies exist on:
  - `public.pipelines` (`pipelines_tenant_workspace_guard`)
  - `public.tasks` (`tasks_tenant_workspace_guard`)
  - `public.task_executions` (`task_executions_tenant_workspace_guard`)
- Confirmed RLS enabled on all three tables.
- Confirmed grants present for `authenticated` and `service_role`.
- Confirmed helper functions now pin `search_path`:
  - `private.tnf_current_tenant_id` → `search_path=auth, pg_catalog`
  - `private.tnf_tenant_visible` → `search_path=private, auth, pg_catalog`
  - `private.tnf_workspace_member_or_owner` →
    `search_path=public, auth, pg_catalog`
- Confirmed workspace-level policies now exist:
  - `public.workspaces`: select/insert/update/delete guards
  - `public.workspace_bookmarks`: select/insert/update/delete guards
- Confirmed both `workspaces` and `workspace_bookmarks` are now
  `RLS enabled + has_policy=true`.
- Security/performance advisors still report substantial pre-existing backlog
  across many unrelated tables/functions; no new blocker unique to this patch
  remained after `search_path` remediation.

### Type-check

Executed:

- `pnpm --filter @the-new-fuse/api-server type-check`

Result:

- Pass

### Known pre-existing failures (not introduced by this patch)

1. `apps/api` test file `src/modules/task/task.service.spec.ts` fails on legacy
   fallback helper expectations unrelated to this scope pass.
2. `packages/database` full build currently fails in `feedback.repository.ts`
   due existing unrelated type errors.

## Security Impact

- API writes now enforce authenticated owner scoping and propagate
  tenant/workspace context.
- Timeline and ledger fetch/update/delete paths now include tenant/workspace
  scope gates where scope context is provided.
- Data partitioning support exists in task schema and query layers for
  multitenant rollout.

## Follow-up Recommendations

1. Backfill existing task rows with tenant/workspace values before switching to
   strict non-legacy scope matching.
2. Add full HTTP-level integration coverage for cross-tenant denial paths in an
   environment that allows local socket binding (`supertest` currently blocked
   in this sandbox).
3. Extend canonical workspace mismatch checks to any other controllers still
   accepting free-form `workspaceId` without auth-context reconciliation.
4. Roll out equivalent Supabase migration to staging/production environments not
   yet patched, then re-run advisors and smoke tests.
5. Continue deterministic policy rollout for remaining high-priority
   `rls_enabled_no_policy` tables (owner-content and user-content tables) to
   reduce the existing security backlog.
