# TNF Cron Federation Gates

Status: Active  
Source bridge: `docs/protocols/bridges/tnf-cron-federation-gates.yml`

## Objective

Apply one deterministic gate chain for all cron/schedule mutations so framework
jobs stay protected while tenant users and tenant agents can safely operate
their own schedules.

## Required Artifacts

1. Request schema:
   - `docs/protocols/schemas/tnf-cron-governance.schema.json`
2. Registry:
   - `data/protocols/cron-jobs.registry.json`
3. Gate evaluator:
   - `scripts/protocols/cron-governance-gate.cjs`

## Validation Commands

```bash
node scripts/validate-protocol-schemas.cjs
node scripts/protocols/cron-governance-gate.cjs --request <request.json> --json
```

## Operational Safety Model

1. `system_framework` scope:
   - editable only by `SUPER_ADMIN` or explicit super-admin delegation with
     `APPROVAL_GATE=allow`.
2. `tenant` scope:
   - editable by tenant user/agent owner with matching ownership identifiers.
3. All mutations:
   - require MCID continuity (`tenant_id`, `schedule_id`, `correlation_id`) and
     complete gate chain.

## Logging and Handoff Integration

1. Every allow/deny decision should be mirrored to execution timeline with
   category `cron_governance_gate`.
2. Handoff packets that request schedule changes should include:
   - `cumulative_id.lineage.schedule_id`
   - `cumulative_id.lineage.schedule_run_id` (optional for create)
   - final gate decision set.
