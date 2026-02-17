# TNF Sidebar Critical Inventory and Consolidation Queue

Date: 2026-02-17 Scope: Canonical sidebar routes
(`src/config/sidebarNavigation.ts`) + redirect targets + real router component
mappings.

## Verified Baseline

Audit sources:

- `apps/frontend/docs/audits/navigation-route-audit.md`
- `apps/frontend/docs/audits/route-guard-audit.md`
- `apps/frontend/docs/audits/sidebar-page-health-audit.md`

Current status:

- Sidebar route coverage: 21/21 mapped to router (0 missing)
- Guard coverage: 0 unguarded review routes, 0 admin guard risks
- Sidebar page health:
  - working: 11
  - partial-medium-risk: 5
  - partial-high-risk: 5
  - broken: 0

## Critical Findings (Ordered)

1. Analytics surface is high-risk and currently powering `/usage` alias.

- Route(s): `/usage` -> `/analytics`
- File: `apps/frontend/src/pages/dashboard/Analytics.tsx`
- Risk signals: mock data, fallback/demo text, randomized behavior, raw fetch.

2. Session/chat operations are high-risk for production control visibility.

- Route(s): `/sessions` -> `/multi-agent-chat`
- File: `apps/frontend/src/components/MultiAgentChat.tsx`
- Risk signals: mock data and fallback simulation patterns.

3. Instance/node observability is high-risk and duplicated by aliases.

- Route(s): `/instances`, `/nodes`, `/observatory` -> `/observatory`
- File: `apps/frontend/src/pages/SystemObservatory.tsx`
- Risk signals: mock data and raw fetch usage.

4. Settings and command-center still carry medium-risk fallback behavior.

- Route(s): `/config`, `/settings` -> `/settings`; `/channels`,
  `/command-center` -> `/command-center`
- Files:
  - `apps/frontend/src/pages/Settings.tsx`
  - `apps/frontend/src/pages/TNFCommandCenter.tsx`

5. Admin surface is guarded correctly but quality-risk medium.

- Route: `/admin`
- File: `apps/frontend/src/pages/Admin/ComprehensiveAdminDashboard.tsx`
- Risk signals: timeout simulation/randomized behavior patterns.

## Menu Consolidation Direction (No Feature Loss)

Primary operational sidebar (always visible):

- Chat
- Control: Overview, Channels, Instances, Sessions, Usage, Cron Jobs
- Agent: Agents, Skills, Nodes
- Settings: Config, Debug, Logs
- Resources: Docs

Advanced (progressively disclosed, auto-expands on active route):

- Command Center, Workflows, Resources, Tasks, Observatory, Admin, Settings

Why this split:

- Keeps OpenClaw-like day-to-day operational clarity.
- Preserves TNF breadth without overwhelming first-view menu density.
- Keeps enterprise/admin power paths present but intentionally disclosed.

## Execution Queue (PR-sized)

### PR-IA-01: Sidebar role/scope clarity and tenancy badges

- Add scope badge (Personal/Workspace/Admin) in page headers for all sidebar
  destinations.
- Ensure alias pages clearly indicate canonical destination in-page when reached
  via redirect.

### PR-DATA-01: Remove mock/random fallback from `/analytics` and `/multi-agent-chat`

- Replace simulated data paths with explicit backend state model:
  - loading
  - empty
  - error (typed)
  - live
- Keep feature parity by preserving UI controls and panels.

### PR-DATA-02: Observatory hardening

- Remove mock pathways from `SystemObservatory`.
- Ensure `/instances` and `/nodes` alias contexts preselect relevant observatory
  tabs/filters.

### PR-SETTINGS-01: Settings shell consolidation

- Keep `/settings/*` canonical.
- Move duplicate API key/grant render blocks out of `Settings.tsx` and retain
  canonical `/settings/api`.

### PR-MENU-01: Alias UX improvements

- Add lightweight breadcrumb/canonical route chip for redirected menu entries.
- Instrument redirect hit telemetry to identify remaining legacy user behavior.

### PR-QA-01: Sidebar-critical integration tests

- Flow tests for:
  - `/usage` (analytics live path)
  - `/sessions` (session timeline/data path)
  - `/instances` and `/nodes` alias behavior in observatory
  - `/config` and `/settings/api` save/load behavior

## Acceptance Gate Before Next IA Freeze

Do not freeze menu IA until:

- High-risk sidebar pages reduced from 5 -> 0 on the audit.
- Medium-risk sidebar pages reduced from 5 -> <=2 with documented exceptions.
- Alias routes verified with deterministic UX behavior and telemetry.
- All sidebar pages show explicit scope/tenancy context.
