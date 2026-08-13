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
14. Added and applied phase-1 self-access RLS policies for 16 user-owned tables
    in `public`.
15. Added and applied phase-2 owner-column RLS policies for 9 additional tables
    in `public`.
16. Added and applied phase-3 agent/registration ownership policies for 8
    agent-registry tables in `public`.
17. Added and applied phase-4 project/workflow scope policies for 4 additional
    tables in `public`.
18. Added and applied phase-5 marketplace/revenue/wallet scope policies for 8
    additional tables in `public`.
19. Added and applied phase-6 remaining-table policy coverage for the final 22
    `public` tables with `RLS enabled + no policy`.
20. Added and applied phase-7 public-function hardening to remove remaining
    mutable `search_path` findings and public `SECURITY DEFINER` RPC exposure.
21. Added and applied phase-8 vector-extension schema hardening to clear
    `extension_in_public` while preserving vector search behavior.

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
- `supabase/migrations/005_user_owned_tables_rls_phase1.sql`
- `supabase/migrations/006_owner_columns_rls_phase2.sql`
- `supabase/migrations/007_agent_registry_rls_phase3.sql`
- `supabase/migrations/008_project_workflow_rls_phase4.sql`
- `supabase/migrations/009_marketplace_wallet_revenue_rls_phase5.sql`
- `supabase/migrations/010_remaining_public_rls_phase6.sql`
- `supabase/migrations/011_public_function_security_hardening_phase7.sql`
- `supabase/migrations/012_vector_extension_schema_hardening_phase8.sql`

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
- Applied migration: `20260508221801 user_owned_tables_rls_phase1_20260508`
- Applied migration: `20260508230954 owner_columns_rls_phase2_20260508`
- Applied migration: `20260508231905 agent_registry_rls_phase3_20260508`
- Applied migration: `20260508233254 project_workflow_rls_phase4_20260508`
- Applied migration:
  `20260509001447 marketplace_wallet_revenue_rls_phase5_20260508`
- Applied migration: `20260509002318 remaining_public_rls_phase6_20260509`
- Applied migration:
  `20260509003106 public_function_security_hardening_phase7_20260509`
- Applied migration:
  `20260509003947 vector_extension_schema_hardening_phase8_20260509`
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
- Confirmed phase-1 self-access policies (4 each: select/insert/update/delete)
  now exist on:
  - `users`
  - `provider_api_keys`
  - `jules_configs`
  - `jules_usage_logs`
  - `login_attempts`
  - `notifications`
  - `auth_events`
  - `auth_sessions`
  - `chat_messages`
  - `resource_favorites`
  - `workflow_topologies`
  - `optimization_jobs`
  - `agents`
  - `chats`
  - `read_receipts`
  - `jules_sessions`
- Verified `RLS enabled with no policy` table count dropped to `51` after
  phase-1 rollout.
- Confirmed phase-2 owner-column policies (4 each: select/insert/update/delete)
  now exist on:
  - `chat_room_participants`
  - `chat_rooms`
  - `code_execution_sessions`
  - `registered_entities`
  - `workflow_templates`
  - `workflows`
  - `feedback`
  - `feedback_comments`
  - `resource_shares`
- Verified `RLS enabled with no policy` table count dropped further to `42`
  after phase-2 rollout.
- Confirmed phase-3 policies (4 each: select/insert/update/delete) now exist on:
  - `agent_registrations`
  - `agent_directory_entries`
  - `agent_metadata`
  - `agent_nfts`
  - `agent_prompt_versions`
  - `agent_capability_registry`
  - `agent_metrics`
  - `agent_onboarding_events`
- Confirmed new private helper functions in `private` schema:
  - `tnf_agent_owned(uuid)` (`SECURITY DEFINER`, pinned `search_path`)
  - `tnf_registration_owned(uuid)` (`SECURITY DEFINER`, pinned `search_path`)
- Verified `RLS enabled with no policy` table count dropped further to `34`
  after phase-3 rollout.
- Confirmed phase-4 policies (4 each: select/insert/update/delete) now exist on:
  - `projects`
  - `resource_allocations`
  - `workflow_executions`
  - `workflow_steps`
- Confirmed new private helper functions in `private` schema:
  - `tnf_project_visible(uuid)` (`SECURITY DEFINER`, pinned `search_path`)
  - `tnf_workflow_owned(uuid)` (`SECURITY DEFINER`, pinned `search_path`)
- Verified `RLS enabled with no policy` table count dropped further to `30`
  after phase-4 rollout.
- Confirmed phase-5 policies (4 each: select/insert/update/delete) now exist on:
  - `fractional_shares`
  - `marketplace_catalog_items`
  - `marketplace_listings`
  - `marketplace_offers`
  - `revenue_streams`
  - `revenue_distributions`
  - `wallets`
  - `transactions`
- Confirmed new private helper functions in `private` schema:
  - `tnf_agent_nft_owned(uuid)` (`SECURITY DEFINER`, pinned `search_path`)
  - `tnf_marketplace_listing_owned(uuid)` (`SECURITY DEFINER`, pinned
    `search_path`)
  - `tnf_revenue_stream_owned(uuid)` (`SECURITY DEFINER`, pinned `search_path`)
  - `tnf_wallet_owned(uuid)` (`SECURITY DEFINER`, pinned `search_path`)
  - `tnf_catalog_created_by_match(text)` (`SECURITY DEFINER`, pinned
    `search_path`)
- Verified `RLS enabled with no policy` table count dropped further to `22`
  after phase-5 rollout.
- Confirmed phase-6 policies (4 each: select/insert/update/delete) now exist on:
  - `agent_memories`
  - `ai_insights`
  - `business_analytics`
  - `business_events`
  - `business_metrics`
  - `code_execution_usage`
  - `error_logs`
  - `feedback_to_tasks`
  - `llm_configs`
  - `messages`
  - `prompt_snippets`
  - `prompt_templates`
  - `prompt_versions`
  - `sse_subscriptions`
  - `sync_conflicts`
  - `sync_states`
  - `system_configurations`
  - `system_settings`
  - `validation_datasets`
  - `vector_embeddings`
  - `webhook_configurations`
  - `webhook_delivery_logs`
- Confirmed new private helper functions in `private` schema:
  - `tnf_feedback_owned(uuid)` (`SECURITY DEFINER`, pinned `search_path`)
  - `tnf_message_visible(uuid, uuid, uuid, uuid)` (`SECURITY DEFINER`, pinned
    `search_path`)
  - `tnf_text_actor_matches(text)` (`SECURITY DEFINER`, pinned `search_path`)
- Verified `RLS enabled with no policy` table count dropped to `0` after phase-6
  rollout.
- Security advisor output no longer reports `rls_enabled_no_policy`; remaining
  warnings are pre-existing (`search_path` mutability in legacy public
  functions, security-definer execute grants in public RPC functions, extension
  placement, and auth posture).
- Confirmed phase-7 function hardening:
  - `public.agent_has_story_session_read_access(uuid)` now `SECURITY INVOKER`
    with pinned `search_path`
  - `public.agent_has_story_session_write_access(uuid)` now `SECURITY INVOKER`
    with pinned `search_path`
  - `public.can_read_story_session(uuid)` now has pinned `search_path`
  - `public.can_write_story_session(uuid)` now has pinned `search_path`
  - `public.current_request_role()` now has pinned `search_path`
  - `public.current_owner_principal_id()` now has pinned `search_path`
  - `public.current_agent_id()` now has pinned `search_path`
  - `public.has_collective_scope()` now has pinned `search_path`
  - `public.match_documents(...)` now has pinned `search_path`
  - `public.update_updated_at()` now has pinned `search_path`
- Security advisor output after phase-7 now shows only:
  - `extension_in_public` (`vector` extension placement)
  - `auth_leaked_password_protection` (Auth setting)
- Confirmed phase-8 extension hardening:
  - `vector` extension moved from schema `public` to schema `extensions`
  - `public.match_documents(...)` updated to use
    `search_path=public, extensions, pg_catalog`
  - live vector-search smoke check passed (`match_documents` returns rows)
- Security advisor output after phase-8 now shows only:
  - `auth_leaked_password_protection` (Auth setting)
- Confirmed live Auth config posture via Management API
  (`GET /v1/projects/{ref}/config/auth`):
  - `password_hibp_enabled=false`
  - `password_min_length=6` (pre-remediation)
- Attempted direct remediation via Management API
  (`PATCH /v1/projects/{ref}/config/auth` with
  `{"password_hibp_enabled":true}`):
  - API response: `HTTP 402`
  - Message: leaked-password protection is available on Pro plans and above
- Applied compensating control via Management API:
  - set `password_min_length=8` successfully
  - confirmed live config now `password_min_length=8` and
    `password_hibp_enabled=false`
- Verified security advisors after compensating control:
  - `GET /v1/projects/{ref}/advisors/security` returns 1 lint total:
    `auth_leaked_password_protection`

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
5. Complete remaining auth posture remediation: enable leaked-password
   protection in Supabase Auth settings and verify sign-up/password-reset
   behavior against TNF client flows.
6. If project remains on Free plan, treat leaked-password protection as a
   documented plan-gated risk acceptance and maintain compensating controls
   (minimum password length, optional required-character policy, MFA, and
   rate-limit/captcha posture).
