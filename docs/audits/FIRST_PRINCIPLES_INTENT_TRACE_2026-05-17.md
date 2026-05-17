# TNF First-Principles Intent Trace (2026-05-17)

## Purpose

Re-root remediation decisions in historical intent before pruning routes or
APIs.

This document is a **decision gate**:

- No route/API removal proceeds unless the surface is classified as
  intentionally deprecated.
- Every mismatch must be classified as one of:
  - `implementation_bug`
  - `incomplete_rollout`
  - `deprecation_candidate` (requires proof)

## Historical Intent Sources Reviewed

1. `docs/TNF_MASTER_MANIFESTO.md`
2. `docs/TNF_AGENTIC_INFRASTRUCTURE_VISION.md`
3. `docs/TNF_AGENT_THREE_PILLARS.md`
4. `docs/TNF_UNIFIED_AI_SYSTEM.md`
5. `docs/roadmaps/PRODUCT_EXPERIENCE_ARCHITECTURE_2026-03-03.md`
6. `docs/analysis/user-journey-map.md`
7. `docs/SAAS_FRONTEND_OVERHAUL_PLAN.md`
8. `docs/TNF_MASTER_PLAN_V1.md`

## Canonical First-Principles Constraints

1. **Workflow-first product model**: navigation should be organized by operator
   workflows, not page sprawl.
2. **Single-source routing discipline**: router/catalog/navigation must stay
   aligned.
3. **Accessibility parity**: non-technical users must be able to complete core
   journeys without CLI-only gaps.
4. **Preserve existing work**: refactors must not silently sever
   legacy-but-intended capabilities.
5. **Three-pillar coherence**: orchestrator + heartbeat + broker capabilities
   must remain operable through product surfaces.

## Canonical Operator Journeys (Intent Contract)

1. `Detect -> Triage -> Execute`
2. `Design -> Simulate -> Deploy -> Monitor`
3. `Task Intake -> Assignment -> Completion -> Review`
4. `Incident -> Root Cause -> Mitigation -> Verification`
5. `Onboard -> Configure -> Govern -> Audit`

## Current Runtime Evidence Baseline

Sources:

- `output/playwright/journey-integrity-audit.json`
- `output/playwright/journey-integrity-audit.md`
- `apps/frontend/docs/audits/navigation-route-audit.md`
- `apps/frontend/docs/audits/auth-path-audit.md`

Snapshot (2026-05-17):

- Route drift: `catalog-not-in-router=30`, `router-not-in-catalog=51`,
  `sidebar-not-in-router=3`
- Route sweep: `174` non-dynamic catalog routes checked, `172` HTTP 200, `2`
  non-200
- API contract probes: `9` checked, `7` failed with 404

## Journey Integrity Classification Matrix

| Surface                                         | Evidence                                                       | Journey Impact                     | Classification       | Rationale                                                                                  |
| ----------------------------------------------- | -------------------------------------------------------------- | ---------------------------------- | -------------------- | ------------------------------------------------------------------------------------------ |
| `POST /api/auth/login` (compat path)            | 404 on app domain; `/api/v1/auth/login` exists (401 challenge) | Onboard/Configure                  | `incomplete_rollout` | v1 auth exists, compat route missing at public edge/proxy layer                            |
| `GET /api/agents`                               | 404 in audit and live console logs                             | Detect/Triage/Execute, Task Intake | `incomplete_rollout` | Historical docs and routes require agent management; endpoint absence breaks core contract |
| `GET /api/agents/bank/templates`                | 404 in audit and live console logs                             | Design/Simulate/Deploy             | `incomplete_rollout` | Agent bank is explicit capability; missing in deployed surface                             |
| `GET /workspaces` and `/workspaces/current`     | 404 on API probes                                              | Collaborate and Govern journeys    | `incomplete_rollout` | Workspace surfaces are canonical in route model and journey docs                           |
| `GET /resources/templates`                      | 404 on API probes                                              | Automate and Ecosystem flows       | `incomplete_rollout` | Templates/resources are intended discovery and execution inputs                            |
| `GET /marketplace/catalog`                      | 404 on API probes                                              | Ecosystem and Automate flows       | `incomplete_rollout` | Marketplace is canonical domain in product architecture                                    |
| `/workflows/builder` runtime crash (React #185) | Previously reproduced and patched in `WorkflowCanvas`          | Design/Simulate/Deploy             | `implementation_bug` | Stateful render loop bug, fixed in codebase                                                |
| Router/catalog/sidebar drift (30/51/3)          | audit artifacts                                                | All journeys                       | `implementation_bug` | Violates explicit non-negotiable IA parity rule                                            |

## Route Drift Triage (No-Prune Default)

### Keep-and-Fix (Core/Canonical/High Confidence)

- `/admin/dashboard` (alias of governance root)
- `/admin/onboarding`
- `/workspace/chat`
- `/workspace/layout`
- `/tasks-page` (likely alias)
- `/chat-page` and `/chats` (chat journey continuity)
- `/agents/unified-creator` (agent lifecycle surface)

### Require Intent-Owner Review Before Any Removal

- Marketing/community variants: `/ambassador`, `/careers`, `/faq`,
  `/testimonials`
- Discovery/catalog variants: `/tools`, `/skills`, `/models`, `/datasets`,
  `/files`, `/comparisons`, `/integrations`
- Internal-looking variants: `/system`, `/terminal`, `/automations`, `/channels`

Default classification for this bucket: `deprecation_candidate` **only after**
evidence collection proves zero journey dependency.

## Governance Rule for Next Refactor Pass

For every route/API mismatch:

1. Map to one of six domains (`operate`, `automate`, `collaborate`, `observe`,
   `govern`, `ecosystem`).
2. Map to one canonical operator journey.
3. Assign lifecycle (`production`, `beta`, `internal`, `deprecated`).
4. Attach owner and replacement surface if deprecated.
5. Verify replacement path in staging and run smoke tests.
6. Only then remove legacy path.

## Immediate Next Execution Targets

1. Stabilize API contract layer for core journeys (`agents`, `workspaces`,
   `resources/templates`, `marketplace/catalog`).
2. Unify frontend API base resolution (`/api` vs `/api/v1` vs raw
   `VITE_API_URL`) into one resolver.
3. Add CI gate to fail when router/catalog/sidebar parity regresses.
4. Add compatibility redirects/aliases for known intended legacy routes before
   pruning.

## Status

- Context reroot in progress and anchored to historical source docs.
- Pruning is blocked pending per-surface intent classification and ownership
  sign-off.

## Execution Update (This Pass)

1. Added unified API base normalization in frontend config:
   - `apps/frontend/src/config/api-base.ts`
   - `apps/frontend/src/config/ports.ts`
   - `apps/frontend/src/config/api.ts`
2. Migrated marketplace/resource services to canonical API base resolution:
   - `apps/frontend/src/services/marketplace.service.ts`
   - `apps/frontend/src/services/resources.service.ts`
3. Added strict journey gate mode for CI:
   - `scripts/journey-integrity-audit.cjs --strict`
   - `package.json` script: `audit:journeys:strict`
4. Strict gate currently fails (expected) with real blockers:
   - `catalog-not-in-router=30`
   - `router-not-in-catalog=51`
   - `sidebar-not-in-router=3`
   - `non-200-routes=2`
   - `api-contract-failures=7`

## Execution Update (Gateway Contract Patch)

1. Expanded API gateway coverage for missing journey endpoints:
   - Added `ResourcesGatewayModule` and `ResourcesGatewayController`
   - Added `GET /api/v1/agents/bank/templates` passthrough
   - Added marketplace catalog/experience routes in gateway
2. Normalized journey audit API probes to canonical `/api/...` paths on API
   domain.
3. Re-ran strict journey gate after patch:
   - Still failing in production (expected until deployment catches up), with
     same blocker counts.
4. Conclusion:
   - Code-level contract gaps are reduced in repo.
   - Remaining failures are now primarily deployment/runtime drift, not just
     missing frontend wiring.

## Execution Update (Workflow Builder Stability Patch)

1. Added a focused smoke test for `/workflows/builder` mount path:
   - `apps/frontend/src/pages/workflow-pages/__tests__/Builder.smoke.test.tsx`
2. Hardened `WorkflowCanvas` against ReactFlow update churn:
   - Split validation errors into memoized map
   - Clone nodes only when node-level error payload changes
   - Gate `fitView` to run only when there are nodes
3. Reduced first-load complexity on builder route:
   - Defaulted AI side panel to closed in
     `apps/frontend/src/pages/workflow-pages/Builder.tsx`
4. Validation:
   - ESLint pass on changed builder/canvas/test files
   - Smoke test pass for builder mount path
5. Journey strict-gate signal quality improvement:
   - Normalized route parity comparisons in
     `scripts/journey-integrity-audit.cjs` to compare route keys without
     query/hash suffixes.
   - Re-ran strict gate: `sidebar-not-in-router` reduced from `3` to `0`
     (eliminated query-string false positives), while true blockers remain.

## Execution Update (Route Catalog vs Router Parity Reduction)

1. Added explicit route aliases in `ComprehensiveRouter` for catalog-intended
   legacy paths (no-prune strategy), including:
   - `/landing-page`, `/simple-landing`, `/chat-page`, `/chats`, `/channels`,
     `/automations`, `/tasks-page`
   - `/files`, `/datasets`, `/integrations`, `/tools`, `/skills`, `/models`,
     `/terminal`, `/system`
   - `/workspace/chat`, `/workspace/layout`
   - `/admin/dashboard`, `/admin/experimental-features`, `/admin/onboarding`
   - `/agents/unified-creator`, `/ambassador`, `/careers`, `/testimonials`,
     `/comparisons`, `/faq`, `/components-nav`
2. Added missing router paths to `routeCatalog.ts` under router-coverage
   additions (including dynamic paths like `/goals/:id`, `/plans/:id`,
   `/fairtable/:viewType`).
3. Updated parity comparator rules in `journey-integrity-audit.cjs` to exclude
   non-navigation paths from parity checks:
   - catch-all `*`
   - `/api/*` contract endpoints (already covered by API contract probe block)
4. Strict gate rerun result after this pass:
   - `catalog-not-in-router: 30 -> 0`
   - `router-not-in-catalog: 51 -> 0`
   - `sidebar-not-in-router: 0` (unchanged)
   - Remaining strict blockers are now purely runtime/API:
     - `non-200-routes=2`
     - `api-contract-failures=7`

## Execution Update (API Contract Hardening - 404-Aware Fallback + Compat)

1. Fixed API gateway build-time drift in marketplace controller:
   - Corrected `proxyWithFallback(...)` call signatures for MCP research routes
     so `apps/api-gateway` compiles cleanly again.
2. Hardened gateway fallback semantics to handle runtime 404 passthrough:
   - Updated `AgentGatewayController`, `ResourcesGatewayController`,
     `MarketplaceGatewayController`, and `WorkspaceGatewayController` so a 404
     from the primary upstream now attempts the configured fallback service
     instead of prematurely returning.
3. Added explicit compatibility for unversioned journey-critical endpoints:
   - Auth login: `POST /api/auth/login` now explicitly supported via
     `@Version(['1', VERSION_NEUTRAL])`.
   - Agents list + template bank, workspace list + current, resource templates,
     marketplace catalog now also expose neutral-version compatibility.
4. Hardened frontend ingress for legacy admin UI aliases:
   - Updated `apps/frontend/nginx.conf` to serve SPA routes (not backend proxy)
     for `/api/admin/database`, `/api/admin/features`, and
     `/api/admin/features/:id/evaluate`.
5. Verification:
   - `pnpm --dir apps/api-gateway build` passes.
   - Strict journey gate against production still reports `non-200-routes=2` and
     `api-contract-failures=7` until this code is deployed to live runtime
     surfaces.
