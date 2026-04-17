# Progress Log

## Session: 2026-03-12

### Phase 1: Requirements & Discovery

- **Status:** in_progress
- Actions taken:
  - Ran TNF onboarding and loaded mandatory context files.
  - Reviewed prior handoff notes and archived previous planning files.
  - Re-initialized planning files for workflow builder audit task.
  - Captured initial Cloudflare capability notes for potential workflow
    execution improvements.
  - Updated scope to include legacy + enhanced builders and production QA.
  - Captured must-fix MCP Tool requirement (server list + marketplace option +
    reset).
- Files created/modified:
  - `docs/ARCHIVE-task_plan-tnf-11-hour-sprint.md`
  - `docs/ARCHIVE-findings-tnf-11-hour-sprint.md`
  - `docs/ARCHIVE-progress-tnf-11-hour-sprint.md`
  - `task_plan.md`
  - `findings.md`
  - `progress.md`

## Test Results

| Test | Input | Expected | Actual | Status |
| ---- | ----- | -------- | ------ | ------ |
| N/A  | N/A   | N/A      | N/A    | N/A    |

## Error Log

| Timestamp  | Error | Attempt | Resolution |
| ---------- | ----- | ------- | ---------- |
| 2026-03-12 | None  | 1       | N/A        |

### Phase 1: Requirements & Discovery (continued)

- Actions taken:
  - Located workflow builder routes; confirmed `/workflows/builder` renders
    `ModernWorkflowBuilder`.
  - Identified Modern builder modules (header, sidebar/node library, canvas,
    execution log, node types).
  - Logged Save/Execute endpoint targets for backend mapping.
  - Mapped legacy and enhanced builder routes for inclusion in audit scope.
  - Attempted production QA via Playwright; `/workflows/builder` redirects to
    `/auth/login` (auth required).
  - `npx` is broken in this environment; used `pnpm dlx @playwright/cli` as a
    workaround.
  - Began MCP Tool fix: added official-registry source selection + reset in MCP
    Tool nodes and modern builder.
  - Added backend `api/mcp` controller to expose TNF curated MCP servers and
    official registry listings.
  - Added API gateway passthrough for MCP marketplace server listings.
  - Wired MCP server source selection to `/api/mcp/servers?source=registry`
    (Official MCP Registry) or `source=tnf` (curated list).
- Files updated:
  - `findings.md`

## 2026-01-12

- Added MCP Tool node support for registry configuration schema inputs +
  Official Registry badge in both ReactFlow node and ModernWorkflowBuilder.
- Adjusted ModernWorkflowBuilder node onChange to accept non-string config
  payloads.

## 2026-03-17 Poker Room QA

- Ran Playwright-based poker room walkthrough (local dev server on :5173) to
  exercise lobby, cash games, tournaments, community, provably fair, control
  center, and bot tournament flows.
- Captured QA screenshots in `output/playwright/qa-*.png` (not committed).
- Observed backend errors during cash table join (`Table Unavailable`) and bot
  tournament bootstrap (`Poker engine rejected the tournament hand`).
- Login form simplified to remove saved callsign/profile UI; advanced profile
  management remains in Settings.

## 2026-03-17 Casin8 CORS Fix

- Added TNF identity headers (x-tnf-identity, x-player-id, x-username,
  x-tnf-role, x-agent-api-key) to Access-Control-Allow-Headers in
  `apps/casin8-games/server.js`.
- Intended to unblock browser membership-gated calls for holdem v2 tables and v1
  table init when using custom identity headers.

## 2026-04-17 Workflow & Observability Sprint

### Phases 1-4: Completed

- **Status:** completed
- Actions taken:
  - **Dynamic Workflow Execution**: Updated `WorkflowController` to accept raw
    `definition` payloads for unsaved workflows.
  - **Execution Engine**: Created `WorkflowExecutionService` for node traversal.
  - **Frontend Wiring**: Updated `ModernWorkflowBuilder` and `WorkflowService`
    to support the new dynamic execution format.
  - **A2A Agent Profiles**: Updated `useA2ACommunication` to fetch real agent
    profiles and merge with online status.
  - **Real Observability**: Replaced hardcoded "online" health signals in
    `SystemController` with real DB and FS probes.
  - **Legacy Cleanup**: Removed obsolete placeholder mock controllers.
- Files modified:
  - `apps/api/src/controllers/workflow.controller.ts`
  - `apps/frontend/src/components/workflow/ModernWorkflowBuilder.tsx`
  - `apps/frontend/src/services/WorkflowService.ts`
  - `apps/api/src/app.module.ts`
  - `apps/frontend/src/hooks/useA2ACommunication.ts`
  - `apps/api/src/controllers/system.controller.ts`
  - `findings.md`
- Files created:
  - `apps/api/src/services/workflow/WorkflowExecutionService.ts`
- Files removed:
  - `apps/api/src/controllers/chatControllerExpress.ts`
  - `apps/api/src/controllers/featureControllerExpress.ts`
  - `apps/api/src/controllers/mcpControllerExpress.ts`
  - `apps/api/src/controllers/systemControllerExpress.ts`
  - `apps/api/src/controllers/userController.ts`
  - `apps/api/src/controllers/LocalAIController.ts`

## 2026-04-17 Landing Page Restoration

### Status: completed

- **Actions taken**:
  - Identified that `public/index.html` had been downgraded to a basic React
    loader, losing the impressive static design.
  - Restored the high-performance static HTML landing page from
    `StaticLanding.html` backups.
  - Redesigned the copy to be outcome-driven, focusing on "Ship
    Superintelligence" and "Automate Everything".
  - Emphasized benefits for both Human users (time savings, ROI) and AI Agents
    (unified mesh, memory).
  - Optimized CTAs for free onboarding to drive paid membership conversion.
- **Files modified**:
  - `apps/frontend/public/index.html`
  - `findings.md`
