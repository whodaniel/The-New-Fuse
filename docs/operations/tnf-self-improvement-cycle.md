# TNF Self-Improvement Cycle

## Purpose

Run a continuous reliability loop that catches broken links, route regressions,
and auth-path failures before users do.

## What We Learned

- Link checks alone are insufficient; semantic route validation is required to
  catch alias pages and wrong-content routing.
- Auth regressions can hide behind compatibility paths (`/api/auth/*`,
  `/api/v1/*`) and must be audited separately.
- Compatibility bridges in frontend nginx are critical while mixed path
  conventions (`/api/*` and `/v1/*`) coexist.
- CI artifacts are required for accountability and diff-based triage over time.

## Current Loop

1. Build frontend in production mode.
2. Crawl live links to depth 5.
3. Audit semantic route correctness across route catalog.
4. Audit auth compatibility and canonical endpoints.
5. Publish machine-readable and markdown artifacts.

## CI/CD Integration

- Workflow: `.github/workflows/live-link-monitor.yml`
- Cadence: hourly scheduled run + manual trigger.
- Artifacts:
  - `apps/frontend/docs/audits/live-link-crawl.json`
  - `apps/frontend/docs/audits/all-routes-semantic-audit.json`
  - `apps/frontend/docs/audits/auth-path-audit.json`

## Architecture Visualization

- Mermaid source: `docs/architecture/tnf-master-framework.mmd`
- Renderable markdown: `docs/architecture/tnf-master-framework.md`

## Specialist Agent Coverage

- Frontend runtime and route behavior: `frontend-debugger-agent`
- Pathway tracing and dependency mapping: `codebase-pathway-tracer`
- Graph generation and diagram outputs: `graph-writer`
- Agent-system topology and drift: `agent-relationship-grapher`
- Production task execution reliability: `tnf-task-production-pipeline`
- Execution visibility and logs: `tnf-execution-audit-trail`

## Next Iteration (Master Clock Sync)

1. Trigger the same audit script from TNF master clock cron jobs.
2. Persist scorecards daily to a dedicated audit history dataset.
3. Auto-open remediation tickets when auth or semantic route checks fail twice
   consecutively.
