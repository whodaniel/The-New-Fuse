# TNF Federated Director-Orchestration Runbook

Date: 2026-03-18  
Status: Active (v0.1)

## 1. Purpose

Define exactly how TNF runs federated orchestration across local terminals,
channels, and cloud execution while preserving policy gates and cumulative
lineage.

## 2. Role Boundaries

1. Local Director (`tnf-agent` / `tnf-cli-agent`)
   - Polls terminal inventory and macro-board telemetry.
   - Publishes terminal-aware workstream signals.
   - Flags high-risk runtime traits early (`approval_bypass`, `remote_mcp`).
2. Orchestrator (cloud planner)
   - Converts goals into assignment packets.
   - Attaches MCID lineage + gate decisions.
   - Requires gate-complete packet before dispatch.
3. Broker / Workflow execution engine
   - Routes approved packets to channels and agents.
   - Mirrors execution events/logs to unified timeline.
   - Quarantines packets on gate break or lineage break.
4. Master Clock
   - Governs scheduled loops and recurring orchestration checks.
   - Enforces category/scope ownership and approval rules.

## 3. Canonical Flow (Terminal to Federated Execution)

1. Director runs TWIP scan + macro board:
   - `node scripts/protocols/twip-macro-board.cjs --tenant tnf-local --limit 1000 --include-commands`
2. Director emits sanitized signal using:
   - `docs/protocols/schemas/twip-workstream-signal.schema.json`
   - `docs/protocols/schemas/twip-terminal-context.schema.json`
3. Orchestrator builds assignment packet with:
   - `cumulative_id` (`tnf/mcid/0.1`)
   - `twid` (when terminal-bound)
   - `target agentIds`
   - `gate_decisions[]`
4. Gate chain executes:
   - tenant scope, trace continuity, terminal binding, channel membership
   - high-risk runtime approval when required
5. Broker accepts only allow-state packet and executes.
6. Execution and gate outcomes mirror to timeline/audit trail.

## 4. Required Contracts

1. MCID:
   - `docs/protocols/schemas/tnf-master-cumulative-id.schema.json`
2. Federation handoff/gate bridge:
   - `docs/protocols/bridges/twip-federation-orchestration-gates.yml`
3. Cron governance:
   - `docs/protocols/schemas/tnf-cron-governance.schema.json`
   - `docs/protocols/bridges/tnf-cron-federation-gates.yml`
4. Agent self-edit governance:
   - `docs/protocols/schemas/tnf-agent-self-edit.schema.json`
   - `docs/protocols/bridges/agent-self-edit-federation-gates.yml`

## 5. Cron Scope and Category Governance

1. System/framework schedules:
   - editable only by `SUPER_ADMIN` or explicit delegated approval
2. Tenant schedules:
   - editable by tenant users/agents with ownership match
3. Categories:
   - system: `system_framework`, `orchestration_gate`, `federation_sync`,
     `self_improvement_core`, `observability`, `system_terminal_awareness`
   - tenant: `tenant_automation`, `tenant_agent_loop`, `tenant_experiment`,
     `tenant_terminal_awareness`
4. Registry source of truth:
   - `data/protocols/cron-jobs.registry.json`

## 6. Self-Improvement and Self-Edit Controls

1. Agents can edit only owned paths in:
   - `data/protocols/agent-owned-docs.registry.json`
2. `approval_required_paths` are hard stops without manual approval.
3. Every edit request must pass schema + gate chain before write execution.

## 7. Verifications and Commands

1. Validate protocol schemas:
   - `node scripts/validate-protocol-schemas.cjs`
2. Verify terminal visualizer wiring:
   - `node scripts/protocols/verify-terminal-visualizer-readiness.cjs --json`
3. Evaluate cron mutation packet:
   - `node scripts/protocols/cron-governance-gate.cjs --request <request.json> --json`
4. Evaluate agent self-edit packet:
   - `node scripts/protocols/agent-self-edit-gate.cjs --request <request.json> --json`
5. Enable external federation gate checks on API handoff publish:
   - `TNF_GATE_POLICY_MODE=warn|enforce`
   - `TNF_GATE_POLICY_ENDPOINT=<sharedstate worker base URL>`
   - `TNF_GATE_POLICY_TOKEN=<optional auth token>`
6. Enable broker dispatch gate checks:
   - `BROKER_FEDERATION_GATE_MODE=warn|enforce`
   - `BROKER_GATE_POLICY_ENDPOINT=<sharedstate worker base URL>`
   - `BROKER_GATE_POLICY_TOKEN=<optional auth token>`
7. Railway one-command rollout for API + relay services:
   - `pnpm railway:federation:gate-mode -- warn`
   - `pnpm railway:federation:gate-mode -- enforce`
8. Railway phased canary rollout:
   - relay only:
     `APPLY_API=0 APPLY_RELAY=1 pnpm railway:federation:gate-mode -- enforce`
   - api only:
     `APPLY_API=1 APPLY_RELAY=0 pnpm railway:federation:gate-mode -- enforce`
9. Synthetic fail-closed federation gate probe:
   - `pnpm validate:federation-gate:synthetic`
10. Broker gate telemetry counters:

- Redis hash key: `tnf:broker:federation-gate:metrics`
- Override env key: `BROKER_GATE_METRICS_HASH`

11. Operator federation gate snapshot API:

- `GET /api/admin/metrics/federation-gates?hours=24&limit=200`
- includes `apiHandoff` timeline summaries and broker Redis counters

## 8. Incident Handling

1. Gate denial spike:
   - inspect deny reasons, ownership mismatches, and missing gate entries
   - inspect broker metrics hash (`hgetall tnf:broker:federation-gate:metrics`)
   - route packets to remediation queue with original `correlation_id`
2. Trace continuity break:
   - quarantine packet
   - require orchestrator re-emit with corrected lineage links
3. High-risk runtime with missing approval:
   - block execution
   - force explicit orchestrator approval decision before retry
