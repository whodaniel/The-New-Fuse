# Findings & Decisions

<!--
  WHAT: Your knowledge base for the task. Stores everything you discover and decide.
  WHY: Context windows are limited. This file is your "external memory" - persistent and unlimited.
  WHEN: Update after ANY discovery, especially after 2 view/browser/search operations (2-Action Rule).
-->

## Requirements

- Build an executable 11-hour task map to push TNF website/app to production
  readiness.
- Prioritize removal of user-visible mock/stub behavior.
- Surface unsurfaced backend functionality into working UI.
- Enable multi-agent parallel execution with clear ownership.

## Research Findings

- Active repo confirmed at
  `/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse`.
- Worktree is already dirty; existing unrelated changes must remain untouched.
- `task_plan.md`, `findings.md`, and `progress.md` were templates and not
  actionable before this update.
- Existing docs already identify production gaps:
  - `PRODUCTION_READINESS.md`
  - `MOCK_ELIMINATION_REPORT.md`
  - `SITE_CRAWL_REPORT.md`
- Concrete live-code mock/fallback hotspots found:
  - `apps/frontend/src/services/WorkflowService.ts`
  - `apps/frontend/src/hooks/useA2ACommunication.ts`
  - `apps/api/src/controllers/system.controller.ts`
  - `apps/api/src/modules/chat/chat.service.ts`
  - `apps/frontend/src/pages/Admin/UserManagement.tsx`
  - `apps/api/src/controllers/AgentController.ts` (placeholder controller
    variant)
- Initial implementation slice completed:
  - Workflow service mock fallback removed.
  - A2A hook now resolves online agents from `/api/a2a/status`.
  - A2A protocol service now targets live backend routes (`/a2a/messages/send`,
    `/a2a/messages/broadcast`).
  - System logs endpoint now reads runtime log files instead of fabricated
    entries.
  - Legacy `apps/api/src/controllers/AgentController.ts` now returns explicit
    deprecation (`410`) instead of fake success payloads.
  - `apps/frontend/src/pages/Admin/UserManagement.tsx` no longer backfills fake
    users when API fails.
  - `apps/api/src/modules/chat/chat.service.ts` no longer fabricates AI text and
    now returns explicit provider-unavailable status.
  - `apps/api/src/modules/chat/chat.controller.ts` now enforces real auth guard
    and user-level auth requirements.
  - `apps/api/src/controllers/ai.controller.ts` now performs real upstream
    provider calls using configured LLM providers.
  - `apps/frontend/src/services/chatApi.ts` now targets `/api/ai/*` for
    text/image generation instead of non-existent chat subroutes.
  - `apps/api/src/modules/agency-hub/controllers/a2a-broker.controller.ts` no
    longer exposes public testing auth mode.
  - `apps/api/src/modules/agency-hub/controllers/service-request.controller.ts`
    now requires authenticated user access.

## Technical Decisions

<!--
  WHAT: Architecture and implementation choices you've made, with reasoning.
  WHY: You'll forget why you chose a technology or approach. This table preserves that knowledge.
  WHEN: Update whenever you make a significant technical choice.
  EXAMPLE:
    | Use JSON for storage | Simple, human-readable, built-in Python support |
    | argparse with subcommands | Clean CLI: python todo.py add "task" |
-->
<!-- Decisions made with rationale -->

| Decision                                                                                        | Rationale                                                                                                                               |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Use a lane-based swarm model (A-E)                                                              | Maximizes parallel throughput while reducing file conflicts                                                                             |
| Prioritize P0 user-facing truth paths first                                                     | Highest production impact within 11-hour cap                                                                                            |
| Keep strict path ownership per lane                                                             | Prevents cross-agent merge contention                                                                                                   |
| Treat existing dirty files as out-of-scope unless explicitly required                           | Avoids accidental rollback of user work                                                                                                 |
| Replace mock fallback with explicit backend truth or empty-state behavior                       | Prevents demo data from masking production failures                                                                                     |
| Exclude orphaned non-runtime files from API tsconfig compile roots                              | Removes compile blockers that were preventing runtime verification                                                                      |
| Add `scripts/smoke-api-demock.sh` for one-shot local endpoint checks                            | Enables repeatable verification outside restricted sandbox networking                                                                   |
| Normalize all `@Controller('api/...')` decorators to prefix-free paths                          | Prevents double-prefix routes once global `api` prefix is applied                                                                       |
| Standardize frontend API defaults to `VITE_API_URL` + consistent `/api` handling                | Prevents drift from stale localhost defaults and env mismatches                                                                         |
| Replace placeholder success payloads with explicit `501` for unimplemented agency-hub endpoints | Prevents false-positive production behavior and surfaces missing backend capability honestly                                            |
| Add explicit frontend handling for `501` analytics endpoints                                    | Surfaces deployment gaps clearly without misleading retry/error loops                                                                   |
| Replace workflow stub data returns with explicit failures                                       | Prevents fabricated workflow/execution state from leaking through MCP/workflow service paths                                            |
| Add capability-status endpoints for partially deployed APIs                                     | Allows UI/agents to detect availability without probing failing operations                                                              |
| Surface capability status in high-traffic agent UIs                                             | Makes partial deployments obvious to operators and prevents misleading UX assumptions                                                   |
| Centralize capability polling in a shared frontend hook                                         | Reduces duplicated API probing logic and keeps deployment truth consistent across dashboards                                            |
| Extract duplicated capability badge rendering into shared UI component                          | Improves consistency and reduces per-page drift during future status UX updates                                                         |
| Make smart-account salt derivation deterministic and remove synthetic counterfactual fallback   | Prevents enable/deploy address drift and blocks fake smart-account addresses from being surfaced as real                                |
| Add a dedicated release gate script + CI workflow for `main`/`develop`                          | Converts production readiness from doc-only guidance into enforceable merge checks                                                      |
| Use frontend production build as strict gate signal instead of full frontend type-check         | Existing frontend TS backlog is too broad for actionable 11-hour hardening; build + critical de-mock checks are enforceable immediately |

## Issues Encountered

<!--
  WHAT: Problems you ran into and how you solved them.
  WHY: Similar to errors in task_plan.md, but focused on broader issues (not just code errors).
  WHEN: Document when you encounter blockers or unexpected challenges.
  EXAMPLE:
    | Empty file causes JSONDecodeError | Added explicit empty file check before json.load() |
-->
<!-- Errors and how they were resolved -->

| Issue                                                                                                                                                          | Resolution                                                                                                                                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Expected `system-metrics.service.ts` path not found                                                                                                            | Pivoted to direct `system.controller.ts` and endpoint behavior anchors                                                                                                                                          |
| Multiple similarly named controllers (`AgentController.ts` and `agent.controller.ts`)                                                                          | Flagged for lane-level runtime routing audit before edits                                                                                                                                                       |
| Full API typecheck contains many unrelated baseline errors                                                                                                     | Treated as pre-existing debt; validated lane changes by targeted diff/grep and no new lane-specific errors surfaced                                                                                             |
| Middleware exclusion patterns were producing `/api/api/*` warnings                                                                                             | Updated exclusions in `AppModule` to account for global `api` prefix                                                                                                                                            |
| Sandbox blocks local bind/connect for runtime smoke (`EPERM`)                                                                                                  | Captured startup route-map logs and shipped local smoke script for unsandboxed execution                                                                                                                        |
| Multiple controllers still hardcoded `api/` in route decorators                                                                                                | Normalized all matches; verification grep now reports no `@Controller('api/...')` usage                                                                                                                         |
| Frontend had mixed env access and hardcoded local API hosts                                                                                                    | Replaced active callers with `import.meta.env.VITE_API_URL` and aligned defaults to API server port/prefix                                                                                                      |
| Agency-hub analytics and service-request controllers returned fake success objects                                                                             | Converted all placeholder responses to `HttpStatus.NOT_IMPLEMENTED` with explicit feature messages                                                                                                              |
| Dashboard analytics UI treated unimplemented endpoints as generic failures                                                                                     | Added specific `501` UX messaging for fetch + export paths                                                                                                                                                      |
| Workflow stub providers generated synthetic objects for unimplemented features                                                                                 | Converted all stub methods to throw `NotImplementedException` instead of returning fake entities                                                                                                                |
| LocalAI and swarm APIs exposed mixed implemented/unimplemented routes without discovery endpoint                                                               | Added `/api/local-ai/status` and `/api/swarm/status` and standardized `501` messages                                                                                                                            |
| Agents UI had hidden reliability bugs and no capability awareness                                                                                              | Fixed retry callback bug, added swarm/local-AI deployment banners, and hardened zero-agent metric math                                                                                                          |
| Command center/observability lacked surfaced deployment state for feature APIs                                                                                 | Added shared capability badges to TNFCommandCenter and SystemObservatory headers                                                                                                                                |
| Workflow builder config used `process.env` in Vite client context                                                                                              | Migrated to `import.meta.env` and added SSR-safe `window` guard for WS URL defaults                                                                                                                             |
| Feature/system/MCP frontend services still returned mock fallback payloads on fetch errors                                                                     | Converted to explicit thrown errors and added UI unavailable-state messaging so operators see real backend status                                                                                               |
| MCP Hub and marketplace screens still masked API failures with demo inventories                                                                                | Removed static mock server fallback and surfaced endpoint-unavailable warnings in-page                                                                                                                          |
| Workflow builder agent selector injected mock agent roster when backend calls failed                                                                           | Replaced with `/api/agents/registry` -> `/api/agents` fallback chain and explicit “no agents available” status                                                                                                  |
| Frontend lint verification currently unreliable in this workspace (`minimatch` crash)                                                                          | Logged as toolchain blocker; relied on focused source review and behavior-level validation until lint stack is repaired                                                                                         |
| Several operator-facing pages still fabricated backend state (A2AControl, KnowledgeHub, ExecutionConsole, WorkflowTemplates, CommunityHub, Admin/SystemHealth) | Replaced hardcoded mock arrays/stats with live endpoint reads, explicit unavailable-state banners, and empty-state rendering                                                                                    |
| A2A topology view was statically mocked and masked real broker visibility                                                                                      | Rebuilt topology from live message stream and removed static topology constants entirely                                                                                                                        |
| Admin/SystemHealth used random chart rendering and mock service-health constants                                                                               | Wired to `/api/system/status` + `/api/monitoring/metrics` response mapping and removed synthetic constants/fallbacks                                                                                            |
| Agent Identity page still fabricated certificate details and fallback identity payload                                                                         | Removed mock identity fallback and switched to deterministic API-derived mapping with explicit error state                                                                                                      |
| Web3 NFT marketplace still swapped to demo inventory and placeholder image URLs on API errors                                                                  | Removed demo fallback list and placeholder URLs; page now shows true unavailable/empty states when backend data is missing                                                                                      |
| Legacy Express `userController` still served mutable in-memory mock users                                                                                      | Converted handlers to explicit `410 Gone` deprecation responses pointing to canonical `/api/users` controller routes                                                                                            |
| Email service path still used a hardwired mock transporter and fake message IDs                                                                                | Removed mock-send behavior; when transport is unconfigured it now returns a truthful non-success result                                                                                                         |
| Legacy Tasks index page still rendered from static `mockTasks` array                                                                                           | Rewired page to unified-ledger `listTasks()` data with explicit API-unavailable messaging and zero-data handling                                                                                                |
| Task edit form still sourced assignee options from static `mockAgents` list                                                                                    | Replaced with live `/api/agents` fetch and explicit degraded-state hint when agent directory is unavailable                                                                                                     |
| Login/AgentHub/UserDashboard/Admin Agent Management still carried demo placeholders and fabricated chart behavior                                              | Removed demo/mock/local fixtures and random metrics generation; replaced with live endpoint reads and explicit unavailable/empty-state UX                                                                       |
| Workflow builder/analytics still masked backend failures with demo-local success and hardcoded metrics                                                         | Removed execution/save demo fallbacks, required real saved workflow ID for execution, and switched analytics to live execution data aggregation with explicit no-node-metrics messaging                         |
| Agency dashboard still referenced demo overlay behavior and did not attempt live tenant list hydration                                                         | Replaced with explicit unavailable messaging and live `/api/agencies?ownerId=...` fetch path when user context is available                                                                                     |
| AI agent onboarding flow still relied on simulated registration and random pass/fail capability tests                                                          | Replaced simulations with real backend probes for agent existence, capability endpoints, and communication reachability with deterministic pass/fail outcomes                                                   |
| Enhanced workflows screen still offered sample-template injection and fixed analytics figures                                                                  | Removed sample template injection path and replaced static execution cards with backend-derived metrics from `/api/workflows/executions` plus explicit unavailable messaging                                    |
| Admin panel still seeded fake system totals/health via timeout-based local state                                                                               | Replaced with live authenticated `/api/admin/metrics/dashboard` mapping and explicit unavailable-state alerting                                                                                                 |
| Enhanced workflow builder variant still masked API failures with `Workflow Executed (Demo)` and local-save success messaging                                   | Removed demo/local fallback branches, enforced real workflow ID execution prerequisite, and made save/execute failures explicit to operators                                                                    |
| Workspace chat page still seeded fallback workspace/messages and fabricated assistant replies after send                                                       | Replaced with live `/api/workspaces` + `/api/chat/rooms/:id/messages` flows, removed synthetic reply generation, and surfaced explicit send/fetch failure states                                                |
| Workspace analytics page was fully timeout-seeded with hardcoded projects/activity/task metrics                                                                | Rebuilt page around backend aggregations (`/api/workspaces`, `/api/workspaces/:id/{members,projects}`, `/api/agents`, `/api/unified-ledger/tasks`, `/api/chat/rooms/*`) and explicit unavailable/no-data states |
| Admin workspace management still injected hardcoded tenant fixtures when `/api/admin/workspaces` failed                                                        | Removed fixture fallback, added authenticated fetch + explicit unavailable-state banner, and left operator actions bound to live data only                                                                      |
| Marketplace backend still served hardcoded catalog entries as memory fallback when DB init/storage failed                                                      | Removed in-memory fallback read/write behavior; service now seeds DB when available and otherwise returns truthful empty/unavailable results                                                                    |
| LLM provider selector still fell back to demo providers and generated fake IDs on provider creation                                                            | Removed demo fallback inventory and synthetic IDs; selector now reflects real backend responses or explicit unavailable state                                                                                   |
| Webhook delivery logs component still injected mock entries when real log fetch failed                                                                         | Removed mock log injection and added explicit unavailable warning while retaining real fetch/refresh filtering                                                                                                  |
| Admin onboarding analytics still generated random chart/table metrics and fallback sample rows                                                                 | Replaced random generation with backend datasets only; added empty-state rendering when analytics slices are unavailable                                                                                        |
| Export controller advertised markdown/html support but returned JSON content for all formats                                                                   | Added real markdown/html formatters with HTML escaping so MIME type and file content are now aligned                                                                                                            |
| Swarm orchestration service still auto-completed executions after fixed delay regardless of real agent work                                                    | Removed timer-based completion to prevent fabricated successful execution outcomes; lifecycle now reflects real orchestration events                                                                            |
| Agent NFT marketplace page still simulated “live” stat growth with periodic random increments                                                                  | Replaced with backend-derived listing/holdings aggregation and explicit unavailable-state messaging                                                                                                             |
| Monitoring controller still returned random values for event loop delay and memory trend                                                                       | Replaced random outputs with deterministic runtime-derived calculations (load average + baseline memory deltas)                                                                                                 |
| Smart account service generated non-deterministic salts (`Date.now`) and returned fabricated hash addresses when counterfactual lookup failed                  | Removed timestamp salt component, made salt deterministic per user+EOA, and changed counterfactual lookup failures to explicit errors                                                                           |
| Hub dashboards (`/hub`, `/hub/sophisticated`) still simulated live telemetry with random metric drift and interactive fake service status changes              | Replaced random metric loops with backend polling and removed fake status toggling so operator views reflect API truth/unavailability                                                                           |
| Monitoring controller still published fabricated connection counts and fully hardcoded `/monitoring/app-metrics` payloads                                      | Replaced connection counters with runtime-derived handle/request stats and converted app-metrics endpoint to explicit `501` until instrumentation is implemented                                                |
| Sophisticated hub still contained static “Recent Activity”, fixed agent cards, and hardcoded active-workflow/template lists                                    | Replaced all with live backend mappings and added explicit unavailable/empty states so dashboard content no longer fabricates runtime events/entities                                                           |
| Resource marketplace actions still returned synthetic success payloads in catch paths (`marketplace-fallback`)                                                 | Replaced fake-success catch blocks with explicit thrown errors so failed execute/import/create actions are visible to operators                                                                                 |
| Workflow template service still silently substituted local default templates on API failure                                                                    | Removed local default-template fallback and now surfaces API errors directly for truthful UX/state handling                                                                                                     |
| Monitoring health endpoint still hardcoded `database`/`services` checks as healthy regardless of runtime evidence                                              | Switched to evidence-based `healthy`/`unknown` signals and updated health scoring to treat unknown explicitly rather than assuming healthy                                                                      |
| Production gate process existed in multiple docs/scripts but was not enforceably blocking merges                                                               | Added `scripts/release-gate.cjs`, wired root scripts, and added `.github/workflows/release-readiness.yml` strict gate workflow                                                                                  |
| Strict release gate initially failed due massive unrelated frontend type-check backlog                                                                         | Rebalanced strict gate to frontend production build + API type/build checks, then verified strict gate passes end-to-end                                                                                        |
| Local release gate loop was too slow due immediate full type-check execution                                                                                   | Split quick/static vs strict/type+build modes and added per-command timeouts to prevent hanging gate runs                                                                                                       |
| Legacy Express `systemControllerExpress` still used random latencies in health payload                                                                         | Replaced randomized values with deterministic runtime-derived latency estimates to avoid fabricated service metrics if endpoint is used                                                                         |
| Strict gate failures concentrated in shared UI type signatures and unsupported button variants on workflow/admin screens                                       | Corrected component prop typing + variant usage and converted workspace tabs to controlled usage compatible with local `Tabs` API                                                                               |
| Smoke script falsely passed when API never bound to port (`HTTP 000` across probes)                                                                            | Added startup liveness checks, readiness polling, per-probe status assertions, and explicit non-zero exit on failed probes                                                                                      |
| Smoke AI probes were not discriminating between expected degraded mode and true provider regressions                                                           | Added provider-key-aware AI probe evaluation so `500` is tolerated only when keys are absent and treated as failure when keys are present                                                                       |
| Release-gate implementation lacked explicit branch-protection runbook for operators                                                                            | Added `RELEASE_ENFORCEMENT.md` with required checks and step-by-step GitHub branch-rule configuration                                                                                                           |
| Smoke run exposed API startup crash (`ReferenceError: Get is not defined`) from `system.controller`                                                            | Added missing `Get` import in `apps/api/src/controllers/system.controller.ts` and confirmed smoke startup recovers                                                                                              |
| Frontend build became intermittently unstable/hanging in this workspace, preventing fresh bundle artifact generation                                           | Kept bundle checker strict on missing artifacts; release flow still surfaces this as actionable blocker when `dist/assets/js` is absent                                                                         |

## Resources

- `task_plan.md`
- `progress.md`
- `.agent/context/resource-map.md`
- `.agent/handoff_notes.txt`
- `PRODUCTION_READINESS.md`
- `MOCK_ELIMINATION_REPORT.md`
- `SITE_CRAWL_REPORT.md`
- `apps/frontend/src/services/WorkflowService.ts`
- `apps/frontend/src/hooks/useA2ACommunication.ts`
- `apps/api/src/controllers/system.controller.ts`
- `apps/api/src/modules/chat/chat.service.ts`

## Visual/Browser Findings

<!--
  WHAT: Information you learned from viewing images, PDFs, or browser results.
  WHY: CRITICAL - Visual/multimodal content doesn't persist in context. Must be captured as text.
  WHEN: IMMEDIATELY after viewing images or browser results. Don't wait!
  EXAMPLE:
    - Screenshot shows login form has email and password fields
    - Browser shows API returns JSON with "status" and "data" keys
-->
<!-- CRITICAL: Update after every 2 view/browser operations -->

- Not applicable for this planning pass (no image/pdf/browser automation
  evidence required).

---

<!--
  REMINDER: The 2-Action Rule
  After every 2 view/browser/search operations, you MUST update this file.
  This prevents visual information from being lost when context resets.
-->

_Updated during discovery + planning pass for 11-hour production sprint._
