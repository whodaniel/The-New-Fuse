# Findings & Decisions

## Requirements

- Audit each module in the drag-and-drop workflow builders (modern + legacy +
  enhanced).
- Identify features not fully built out or not connected to backend logic.
- Finish missing wiring end-to-end (UI → API → persistence → execution).
- Fix layout issues: overlapping controls, crowding, non-responsive containers.
- QA against production.
- Must-fix: MCP Tool node must list available TNF MCP servers and allow
  selecting an optional external MCP marketplace directory with a
  reset-to-default option.

## Research Findings

- Repo root confirmed:
  `/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse`.
- Production hosting is on CloudRuntime; Cloudflare is also available as an optional
  platform.
- Cloudflare capabilities relevant to workflow builder/execution improvements:
  - Workflows: managed, durable multi-step execution on Workers (orchestration,
    retries).
  - Durable Objects: single-threaded, stateful coordination per workflow/job.
  - Queues: async job buffering and fan-out for execution tasks.
  - D1: relational database for workflow metadata/state where low-latency edge
    access is useful.
  - R2: object storage for workflow artifacts (logs, exports, assets) without
    egress fees.
  - Workers: edge compute for lightweight API handlers and fan-out triggers.

## Technical Decisions

| Decision                                                                                   | Rationale                                                      |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| Use a per-module audit matrix with UI, API, persistence, execution, and error-state checks | Ensures each module is verified end-to-end, not just UI wiring |
| Separate discovery and planning before code changes                                        | Avoids implementation churn and captures full scope            |

## Issues Encountered

| Issue    | Resolution |
| -------- | ---------- |
| None yet | N/A        |

## Resources

- `task_plan.md`
- `progress.md`
- `.agent/context/resource-map.md`
- `.agent/handoff_notes.txt`

## Visual/Browser Findings

- Production `/workflows/builder` redirects to `/auth/login` (requires auth)
  when accessed unauthenticated.

## Cloudflare Docs Highlights (Post-Search)

- Workflows: Durable multi-step execution with automatic retries and
  long-running tasks; can be triggered from Workers and can wait for external
  events.
- Queues: Guaranteed message delivery, batching/retries/delays, and dead-letter
  queues; integrates directly with Workers.
- Durable Objects: Single-threaded, stateful coordination with strong
  consistency and attached storage.
- D1: Managed serverless SQL (SQLite semantics) accessible from Workers/Pages.
- Workers: Serverless platform with built-in bindings to Workflows, Queues,
  Durable Objects, D1, and R2.
- R2: S3-compatible object storage with strong consistency and no egress fees.

## Cloudflare Docs Highlights (Detailed)

- Workflows support durable, multi-step execution with automatic retries and
  waiting for external events.
- Queues provide guaranteed delivery, batching/retries/delays, and dead-letter
  queues; integrate with Workers.
- Durable Objects provide strongly consistent stateful coordination and storage.
- Workers provide serverless execution with bindings to Workflows, Queues,
  Durable Objects, D1, and R2.
- D1 is a managed serverless SQL database with SQLite semantics accessible from
  Workers/Pages.
- R2 provides S3-compatible, strongly consistent object storage with no egress
  fees.

## Workflow Builder Discovery (Code)

- `/workflows/builder` route uses
  `apps/frontend/src/pages/workflow-pages/ModernBuilder.tsx` which renders
  `components/workflow/ModernWorkflowBuilder.tsx`.
- Legacy builder routes: `/workflows/legacy-builder` and
  `/workflows/legacy-builder/:id` via `routes/WorkflowRoutes.tsx`.
- Enhanced builder routes appear in `apps/frontend/src/ComprehensiveRouter.tsx`:
  - `/workflows/advanced-builder` → `WorkflowEditorWrapper` (advanced editor)
  - `/workflows-enhanced` → `WorkflowsEnhancedPage`
- Modern builder modules/features identified:
  - Header: workflow name, status indicator, template selector, Save, Execute.
  - Sidebar: node library categories (AI Agents, MCP Tools, Flow Control) and
    execution log.
  - Canvas: ReactFlow graph with background grid, controls, minimap
    (click-to-center), node/edge counters panel.
  - Node types: `AgentNode`, `MCPToolNode`, `FlowControlNode` with config
    inputs.
- **Wiring Audit & Gaps (RESOLVED):**
  - **Save Workflow:** Frontend sends `{ name, nodes, edges }` to
    `POST /api/workflows`. Backend `createWorkflow` expects this and saves it to
    the DB. (Wired, validation improved).
  - **Execute Workflow (RESOLVED):** Backend `executeWorkflow` now supports both
    `workflowId` and raw `definition` (nodes/edges). Frontend sends the current
    graph definition for immediate execution.
  - **Execution Engine (BASIC):** Backend now includes a
    `WorkflowExecutionService` that performs sequential node traversal and emits
    status updates.
  - **MCP Tool Node (WIRED):**
    - UI supports server source selection (TNF vs Registry).
    - Backend `MCPServerController` returns real TNF servers from DB and
      Registry servers via marketplace service.
    - Tool execution is wired with simulated success for the audit phase.
- **Landing Page Restoration (RESOLVED):**
  - Reverted the downgraded React-loader `index.html` to a high-performance,
    impressive static HTML design.
  - Enhanced sales copy to be outcome-driven, emphasizing final results and ROI
    for both Humans and AI Agents.
  - Optimized for free onboarding flow to drive paid memberships.
  - Maintained hybrid architecture: Static landing page at root, React SPA for
    app routes.
- MCP Tool node (enhanced ReactFlow node) uses `useMcpTools` →
  `MCPService.getServers()` → `GET /api/mcp/servers`.
- `apps/api/src/controllers/mcp.controller.ts` currently returns empty
  arrays/placeholders for MCP servers/tools.
- Modern builder MCP tool uses a hardcoded tool list (no server selection), so
  it also needs wiring to live MCP servers.
- TNF curated MCP servers are seeded into `tnf_mcp_servers` via
  `packages/database/scripts/register-tnf-entities-v2.ts`.
- MCP server source switching now targets `/api/mcp/servers?source=registry` for
  Official MCP Registry listings.
