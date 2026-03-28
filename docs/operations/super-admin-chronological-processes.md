# Super Admin Chronological Processes Control Plane

Status: Active  
Audience: Super Admin operators

## Purpose

Expose all canonical cron-governed processes and procedural schedule controls in
one Super Admin surface so schedule state is always readable and controllable.

## UI Surface

- Route: `SuperAdminControlPanel`
- Section: `Chronological Control Plane`
- Features:
  - canonical metadata (scope/category/ownership/lock state)
  - procedural controls (enabled, cadence, timezone)
  - filtering and sorting controls (query/status/scope/sort keys)
  - run-now execution for registered commands
  - computed `next scheduled at` timestamps derived from cadence + timezone
  - per-process recent execution history (status/duration/exit code)
  - full execution history modal per process (up to 200 latest runs)
  - runtime status (healthy/error/running/paused/manual), last run, and error
    preview

## API Contract

Base: `/api/admin/metrics`

1. `GET /chronological-processes`
   - returns process list + summary counters.
2. `PUT /chronological-processes/:processId`
   - updates `enabled`, `cadence`, `timezone`, `notes`.
3. `POST /chronological-processes/:processId/run`
   - executes the process command immediately when registered.
4. `GET /chronological-processes/:processId/history?limit=200`
   - returns full run history envelope `{ process, total, runs[] }`.

## Governance Guarantees

1. `system_framework` and locked processes are mutable/executable only by
   `SUPER_ADMIN`.
2. Cadence updates are validated to cron-like syntax.
3. State writes are persisted in:
   - `data/protocols/cron-jobs.control-plane-state.json`
   - includes overrides, runtime snapshot, and per-process run history.
4. Canonical registry source remains:
   - `data/protocols/cron-jobs.registry.json`

## Notes

1. This interface is designed to coexist with visual orchestration graphs.
2. Visualizers remain diagnostic; this control plane is the operational source
   for schedule mutation and run-now operations.

## Master Clock Sync Verification

Run the cron-sync contract audit to verify cadence/SLA mapping, trigger payload
contracts, idempotency lock behavior, and escalation thresholds:

```bash
pnpm run validate:master-clock-sync
```

Latest artifacts are written to:

- `reports/protocols/master-clock-sync/master-clock-sync-latest.json`
- `reports/protocols/master-clock-sync/master-clock-sync-latest.md`

## Don't Die Supervisor

Run deterministic stale-process remediation with before/after audit evidence:

```bash
node scripts/protocols/dont-die-supervisor.cjs --json
```

Latest artifacts are written to:

- `reports/protocols/dont-die-supervisor/dont-die-latest.json`
- `reports/protocols/dont-die-supervisor/dont-die-latest.md`

## StaffOps Schedule Sync

Install recurring StaffOps schedules (staff coordination, staffing architecture,
staff review) into local cron with deterministic process runner commands:

```bash
node scripts/protocols/staffops-schedule-sync.cjs install --json
```

Install growth-blocker audit into the same deterministic runner path:

```bash
node scripts/protocols/staffops-schedule-sync.cjs install --process-id tnf-growth-blocker-audit --json
```

Check installed StaffOps schedule lines:

```bash
node scripts/protocols/staffops-schedule-sync.cjs status --json
```

Uninstall StaffOps managed schedule lines:

```bash
node scripts/protocols/staffops-schedule-sync.cjs uninstall --json
```

Run role cycles manually:

```bash
node .skills/tnf-staffing-director-agent/scripts/run_staffing_director_cycle.cjs --json
node .skills/tnf-staff-review-agent/scripts/run_staff_review_cycle.cjs --json
```
