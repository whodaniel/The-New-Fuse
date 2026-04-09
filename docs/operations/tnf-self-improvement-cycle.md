# TNF Self-Improvement Cycle

## Purpose

Operate TNF as a continuously verified full-stack system, not a one-time
deployment. The loop ensures navigation, semantic route integrity, auth
pathways, and architecture visibility stay synchronized over time.

## What We Learned

- Link existence checks are insufficient. Semantic route fingerprint checks are
  required to detect pages incorrectly rendering shared landing content.
- Auth failures can be routing compatibility failures. `/api/auth/*` and
  `/api/v1/*` compatibility handling must be explicitly validated.
- CI has to produce evidence artifacts for every run. Logs and JSON/Markdown
  reports make drift visible and auditable.
- Reliability requires mixed checks. Build status, route correctness, auth
  endpoint behavior, and architecture mapping must run as one routine.

## Construct and Verify the Stack

1. Build frontend in production mode.
2. Run depth-5 link crawl.
3. Run semantic route audit.
4. Run auth path audit.
5. Generate consolidated scorecard.
6. Generate architecture map (`Mermaid`).
7. Publish artifacts to CI for review and trend tracking.

## Outputs

- `apps/frontend/docs/audits/live-link-crawl.json`
- `apps/frontend/docs/audits/all-routes-semantic-audit.json`
- `apps/frontend/docs/audits/auth-path-audit.json`
- `apps/frontend/docs/audits/self-improvement-scorecard.json`
- `docs/architecture/tnf-master-framework.mmd`

## Specialist Agent Audit Coverage

- `frontend-debugger-agent`: runtime route and page-state regressions.
- `codebase-pathway-tracer`: route-to-handler-to-data path tracing.
- `graph-writer`: architecture/pathway graph output.
- `agent-relationship-grapher`: inter-agent topology and drift.
- `tnf-task-production-pipeline`: execution lifecycle reliability.
- `tnf-execution-audit-trail`: execution log integrity and timeline
  observability.

## CI/CD Enhancements Implemented

- Added auth-path audit enforcement.
- Added self-improvement scorecard generation.
- Added automated architecture map generation from repository structure.
- Extended artifact upload set for long-term evidence retention.

## Refinement Protocol for Subsequent Runs

1. Compare latest scorecard with previous run artifacts.
2. Identify which audit class regressed.
3. Patch only affected surfaces first.
4. Re-run local audits before push.
5. Update skill/reference docs when recurring new failure pattern appears.
6. Commit with explicit evidence references.

## Master Clock Sync

Master clock cron governance is now protocolized with:

1. `docs/protocols/schemas/tnf-cron-governance.schema.json`
2. `docs/protocols/bridges/tnf-cron-federation-gates.yml`
3. `data/protocols/cron-jobs.registry.json`
4. `scripts/protocols/cron-governance-gate.cjs`

## Self-Prompt and Self-Edit Safety

1. Self-prompts now carry cumulative lineage metadata for downstream
   correlation.
2. Agent-owned doc edits must use:
   - `docs/protocols/schemas/tnf-agent-self-edit.schema.json`
   - `docs/protocols/bridges/agent-self-edit-federation-gates.yml`
3. Ownership/path gate checks run via:
   - `node scripts/protocols/agent-self-edit-gate.cjs --request <request.json>`
4. Cron ownership/scope gate checks run via:
   - `node scripts/protocols/cron-governance-gate.cjs --request <request.json>`
