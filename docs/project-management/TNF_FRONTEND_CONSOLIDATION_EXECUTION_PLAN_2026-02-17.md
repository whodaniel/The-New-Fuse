# TNF Frontend Consolidation Execution Plan (No-Feature-Loss)

Date: 2026-02-17 Owner: TNF Core Frontend Status: Active

## Mission

Consolidate TNF frontend information architecture, routing, and component
surfaces without losing any existing feature capability, while preparing
controlled OpenClaw/PicoClaw capability absorption and rebranding.

## Non-Negotiable Constraints

- Preserve all current capabilities during migration.
- No silent removals. Every deprecation must have redirect/replacement mapping.
- Keep TNF + OpenClaw + PicoClaw operational during transition.
- Enforce role/tenant correctness for every page and action.
- Track canonical ownership for route, page, API client, and components.

## Phase Structure

### Phase 1: Verification Baseline (Now)

Goal: Establish hard evidence of route/page/sidebar state before consolidation.

Deliverables:

- Automated audit of:
  - Router paths
  - Sidebar/menu paths
  - All-pages index paths
  - Orphaned/mismatched paths
- Page classification matrix:
  - `working`, `partial`, `broken`, `duplicate`, `orphaned`
- Role exposure matrix for sidebar-visible routes.

Acceptance:

- Machine-readable audit artifact committed.
- Human-readable summary committed.
- No architecture decisions made without baseline evidence.

### Phase 2: Navigation and Route Canonicalization

Goal: Single source of truth for nav + route ownership.

Deliverables:

- Canonical route schema file (`path`, `title`, `surface`, `auth`, `role`,
  `featureFlag`, `status`).
- Premium sidebar + any header nav generated from canonical schema.
- Redirect map for legacy paths.
- Remove dead links only after replacement/redirect exists.

Acceptance:

- Zero sidebar paths missing router target.
- Zero router paths flagged orphaned for primary product surfaces.
- Role-aware menu visibility enforced before route click.

### Phase 3: Settings and Admin Surface Consolidation

Goal: Remove duplicate settings/admin UX while preserving capability breadth.

Deliverables:

- Canonical settings shell at `/settings/*`.
- User vs Admin separation with explicit guards.
- Single API-key/grants experience (no duplicate panels).
- Shared settings primitives.

Acceptance:

- No duplicate settings implementations in active route tree.
- Sensitive actions show consistent state and audit metadata.

### Phase 4: Data Contract Hardening

Goal: Replace mock/fallback ambiguity with explicit backend contract behavior.

Deliverables:

- Domain API clients per surface (settings, grants, provider keys, billing,
  etc.).
- Runtime validation for responses.
- Explicit disconnected/degraded state in UI instead of fake data.

Acceptance:

- Sidebar-critical pages do not silently fall back to mock data.
- Error/loading/empty/success states standardized.

### Phase 5: OpenClaw/PicoClaw Assimilation and Rebrand

Goal: Absorb capabilities into TNF while preserving compatibility.

Deliverables:

- Capability parity matrix: OpenClaw/PicoClaw -> TNF route + command + API
  mapping.
- Alias compatibility layer for legacy commands and endpoints.
- Rebrand migration map (`openclaw:*` -> `tnf:*`) with staged rollout.

Acceptance:

- Parity checklist passed before deprecating old command pathways.
- Existing integrations continue working through compatibility aliases.

### Phase 6: Stabilization and Deletion Window

Goal: Remove deprecated artifacts only after proving replacement stability.

Deliverables:

- 2-week stabilization report (error rates, regressions, support incidents).
- Removal PRs for deprecated routes/components with proof of replacement
  adoption.

Acceptance:

- No critical regressions from removal PRs.
- CI route/audit gates prevent drift from reappearing.

## PR Sequence (Initial)

1. `PR-AUDIT-BASELINE`: add route/sidebar audit tooling + baseline artifacts.
2. `PR-NAV-SCHEMA`: introduce canonical nav schema, generate sidebar.
3. `PR-ROUTE-GUARDS`: enforce route-level auth/role policy coverage.
4. `PR-SETTINGS-CANON`: unify settings shell and remove duplicates.
5. `PR-DATA-CONTRACT`: remove silent mock fallbacks from core pages.
6. `PR-ASSIMILATION-COMPAT`: command/route aliasing for OpenClaw/PicoClaw.

## Initial Risks and Controls

- Risk: hidden dependency on legacy route paths.
  - Control: redirect map + runtime telemetry on legacy route hits.
- Risk: capability loss during consolidation.
  - Control: capability parity matrix + no-delete policy until replacement
    verified.
- Risk: role leakage or overrestriction.
  - Control: route guard matrix + integration tests by role.

## Immediate Work Started

- Baseline audit tooling and artifacts.
- First safe UX hardening fixes that do not remove features.
