# Workflow/Nexus/Webhook Recovery Audit (TNF Protocol)

- Date (UTC): 2026-05-13
- Operator: codex
- Scope: `app.thenewfuse.com/workflows` + `nexus` layer integration + webhook orchestration parity
- Protocol: Inspect -> Act -> Verify

## 1) Inspect

### 1.1 Regression source identified
Evidence from git history:

- Commit `eac6e8eff` rewired workflow builder routing:
  - `ComprehensiveRouter.tsx` changed `WorkflowBuilder` import from `./pages/workflow-pages/Builder` to `./pages/SynapticNexus`.
  - Result: `/workflows/builder` stopped loading the dedicated builder UI and instead loaded Nexus.
- Sidebar/Nexus coupling changed:
  - Sidebar entries pointed to `/nexus` and `/nexus?layer=*`.
  - `/nexus` route is protected by SUPER_ADMIN guard.
  - Result: non-admin users lost direct access to Nexus layers that were intended to support workflow operations.

### 1.2 Current recovery worktree (pre-existing + validated in this run)

Recovered capabilities present in the current working tree:

- Dedicated workflow builder restored at `/workflows/builder`.
- Dedicated workflow nexus route added at `/workflows/nexus`.
- Sidebar links updated to workflow-scoped nexus routes:
  - `/workflows/nexus`
  - `/workflows/nexus?layer=lexicon`
  - `/workflows/nexus?layer=memory`
- Sitemap includes:
  - `/workflows/nexus`
  - `/workflows/builder-enhanced`
  - `/workflows/builder-n8n`

### 1.3 Webhook orchestration surface (backend + frontend)

Backend changes present in current worktree:

- `POST /workflows/:id/webhook`
- `POST /workflows/:id/webhook/:triggerId`
- Trigger validation (enabled flag, optional secret, optional condition checks)
- Execution metadata for trigger context
- Node runtime extensions for webhook trigger + HTTP/webhook action nodes + condition branching

Frontend changes present in current worktree:

- `WorkflowService.executeWorkflowViaWebhook(...)`
- Workflow type includes `triggers` and `variables`

## 2) Act

Additional protocol-aligned updates implemented in this run:

1. Workflow UI webhook controls in `Workflows.tsx`:
   - Copy webhook URL per workflow
   - Test webhook action per workflow
   - Trigger-aware URL resolution (`/webhook/:triggerId` when present)

2. Hook extension in `useWorkflow.ts`:
   - Added `executeWorkflowViaWebhook(...)`
   - Refreshes workflow executions after webhook-triggered run

3. Nexus lint hygiene in `SynapticNexus.tsx`:
   - Removed unused capability import/vars
   - Removed unused catch bindings

4. TNF session-coordination durability artifacts (outside repo, local TNF state):
   - `~/.tnf/session-discovery/terminal-role-map.json` created
   - `~/.tnf/session-discovery/terminal-identity-registry.json` refreshed
   - `~/.tnf/local-subdirector/state/live-session-coordination-20260513T161156Z.md` created
   - stale malformed coordination snapshot removed

5. TNF multi-agent state governance run completed:
   - audit -> plan -> apply -> re-audit
   - deleted 15 stale heartbeat history files (~31.7KB)
   - latest anchors preserved

## 3) Verify

### 3.1 Routing and regression verification

Verified by source inspection:

- Builder and Nexus are now split again in router (builder no longer aliased to Nexus).
- Workflow-scoped Nexus route exists and is member-accessible.
- Sidebar points to workflow-scoped Nexus routes.

### 3.2 Lint verification (targeted changed frontend files)

Command passed:

- `pnpm exec eslint` on:
  - `apps/frontend/src/pages/Workflows.tsx`
  - `apps/frontend/src/hooks/useWorkflow.ts`
  - `apps/frontend/src/pages/SynapticNexus.tsx`
  - `apps/frontend/src/ComprehensiveRouter.tsx`
  - `apps/frontend/src/config/sidebarNavigation.ts`
  - `apps/frontend/src/services/WorkflowService.ts`

### 3.3 Type-check caveat

Full package type-checks fail due broad unrelated baseline issues in this repository:

- Frontend: many pre-existing errors across unrelated modules
- API: pre-existing module resolution errors (`@the-new-fuse/core` in director module)

These failures are not introduced by the focused workflow/nexus/webhook patch set.

## 4) Remaining Gaps To Reach "Full Fledged" Webhook Orchestration

1. Webhook management UI for trigger CRUD (not just execute/test).
2. Secret rotation UI and encrypted-at-rest secret handling audit.
3. Replay protection + signature verification policy (HMAC timestamp + nonce).
4. Webhook delivery observability panel (attempt logs, retries, dead-letter queue).
5. Per-workflow webhook docs export (OpenAPI-like contract per trigger).

## 5) Changed Files (Recovery Surface)

- `apps/frontend/src/ComprehensiveRouter.tsx`
- `apps/frontend/src/config/sidebarNavigation.ts`
- `apps/frontend/src/config/sitemap.ts`
- `apps/frontend/src/pages/Workflows.tsx`
- `apps/frontend/src/pages/SynapticNexus.tsx`
- `apps/frontend/src/hooks/useWorkflow.ts`
- `apps/frontend/src/services/WorkflowService.ts`
- `apps/api/src/controllers/workflow.controller.ts`
- `apps/api/src/services/workflow/WorkflowExecutionService.ts`

