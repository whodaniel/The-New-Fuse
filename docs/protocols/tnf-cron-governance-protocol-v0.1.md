# TNF Cron Governance Protocol v0.1

Status: Draft-Implementable  
Audience: TNF super-admin operators, orchestrator maintainers, tenant runtime
integrators

## Objective

Define one reusable control plane for cron/schedule mutation so:

1. framework-level schedules are editable only by Super Admin (or explicit
   delegated instruction), and
2. users and their agents can safely create and modify tenant-owned schedules.

## Contract Surface

Schema:

- `docs/protocols/schemas/tnf-cron-governance.schema.json`

Registry:

- `data/protocols/cron-jobs.registry.json`

Gate evaluator:

- `scripts/protocols/cron-governance-gate.cjs`

Bridge:

- `docs/protocols/bridges/tnf-cron-federation-gates.yml`

Super Admin control plane:

- `GET /api/admin/metrics/chronological-processes`
- `PUT /api/admin/metrics/chronological-processes/:processId`
- `POST /api/admin/metrics/chronological-processes/:processId/run`
- `GET /api/admin/metrics/chronological-processes/:processId/history`
- `docs/operations/super-admin-chronological-processes.md`
- exposes computed `next scheduled at` projections and recent execution history
  per process plus full run history retrieval for operator review.

## Scope and Category Model

Scopes:

1. `system_framework`
2. `tenant`

Categories:

1. `system_framework`
2. `orchestration_gate`
3. `federation_sync`
4. `self_improvement_core`
5. `observability`
6. `system_terminal_awareness`
7. `tenant_automation`
8. `tenant_agent_loop`
9. `tenant_experiment`
10. `tenant_terminal_awareness`

Rules:

1. category scope must match target scope.
2. high-risk categories require `APPROVAL_GATE=allow`.
3. locked schedules in registry require Super Admin authority.
4. `*_terminal_awareness` categories are the standard bucket for recurring
   context-reminder loops (for example, TWIP macro scans before autonomous
   execution waves).

## RBAC Rules

1. `system_framework` mutations:
   - allowed only for `SUPER_ADMIN` or equivalent `system:access`.
   - delegated agent write allowed only when:
     - `delegation.delegated_by_super_admin=true`, and
     - `APPROVAL_GATE=allow`.
2. `tenant` mutations:
   - actor must have tenant mutation role (`USER`, `ADMIN`, `SUPER_ADMIN`).
   - when owner fields are present, actor ids must match owner ids unless Super
     Admin override.

## Required Gate Chain

1. `TENANT_SCOPE_GATE`
2. `TRACE_CONTINUITY_GATE`
3. `CHANNEL_MEMBERSHIP_GATE`
4. `CRON_SCOPE_GATE`
5. `CRON_CATEGORY_GATE`
6. `CRON_OWNERSHIP_GATE`
7. Optional `WRITE_RATE_LIMIT_GATE`
8. Conditional `APPROVAL_GATE`

## MCID Continuity

Cron changes must preserve:

1. `cumulative_id.scope.tenant_id == tenant_id`
2. `cumulative_id.lineage.schedule_id == target.schedule_id`
3. `cumulative_id.scope.cron_namespace` set for scheduler domain partitioning
   when available
4. optional `schedule_run_id` for per-run mutation lineage

## Logging and Handoff Requirements

1. Every allow/deny decision is mirrored into execution logs with category
   `cron_governance_gate`.
2. Handoff packets requesting cron changes should carry:
   - `lineage.schedule_id`
   - `lineage.schedule_run_id` (if run-specific)
3. deny/quarantine outcomes route to orchestrator remediation queue.

## Validation

```bash
node scripts/validate-protocol-schemas.cjs
node scripts/protocols/cron-governance-gate.cjs --request ./request.cron-governance.json --json
```

## Why This Is Reusable and Wrappable

1. Reusable:
   - single schema and gate evaluator across all runtimes.
2. Transferable:
   - payload carries MCID and gate decisions for any transport.
3. Translatable:
   - actor/owner mappings can be adapted from local identity models.
4. Wrappable:
   - works under MCP tools, REST endpoints, or event bus envelopes without
     semantic changes.
