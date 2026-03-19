# Cron Governance Review (2026-03-18)

## Trigger

Review requested after macro terminal scan to harden scheduler governance,
handoff continuity, and self-improvement loop safety.

## Macro Snapshot Used

From `scripts/protocols/twip-macro-board.cjs` at `2026-03-18T21:38:10.624Z`:

1. Total terminals: 23
2. Active terminals: 5
3. Idle terminals: 18
4. Approval bypass terminals: 3
5. Remote MCP terminals: 1

## Findings

1. Scheduling ownership boundary existed conceptually but lacked a single
   protocol-level gate contract.
2. System/framework cron mutation controls were not yet standardized in a
   schema-first way.
3. Tenant-owned mutation safety needed explicit owner checks and category scope
   matching.
4. MCID had no scheduler-specific lineage fields (`schedule_id`,
   `schedule_run_id`) for deterministic handoff/log tracing.

## Implemented in this pass

1. Added cron governance schema:
   - `docs/protocols/schemas/tnf-cron-governance.schema.json`
2. Added cron jobs registry:
   - `data/protocols/cron-jobs.registry.json`
3. Added federation gate bridge:
   - `docs/protocols/bridges/tnf-cron-federation-gates.yml`
4. Added deterministic gate evaluator:
   - `scripts/protocols/cron-governance-gate.cjs`
5. Added protocol guide:
   - `docs/protocols/tnf-cron-governance-protocol-v0.1.md`
6. Extended MCID with scheduler lineage fields:
   - `scope.cron_namespace`
   - `lineage.schedule_id`
   - `lineage.schedule_run_id`

## Operational Result

1. Framework-level cron changes are now explicitly constrained to Super Admin
   authority or explicit delegated approval.
2. Tenant users/agents can safely manage tenant schedules with owner and scope
   checks.
3. Handoff/logging chains can attach schedule lineage for cross-surface trace
   continuity.
