# Handoff + Self-Prompt Review (2026-03-18)

## Scope

Review logging and handoff protocols plus self-improvement/self-prompt loops in
the context of federation channels and master cumulative ID continuity.

## Macro Terminal Snapshot

From `2026-03-18T21:11:28.655Z` (`scripts/protocols/twip-macro-board.cjs`):

1. Total terminals: 23
2. Active terminals: 5
3. Idle terminals: 18
4. Approval bypass terminals: 3
5. Remote MCP terminals: 1

## Handoff Protocol Findings and Fixes

1. Compatibility hardening:
   - `HandoffPacket` now supports `version: 1.0 | 1.1`.
   - `1.1` enforces `cumulativeId` and `gateDecisions`.
   - `HandoffStoreService` now writes `version: 1.1`.
   - Legacy packets without explicit version are parsed as `1.0`.
2. Gate-chain continuity:
   - Publish path now validates both:
     - top-level `gateDecisions`
     - `cumulativeId.federation.gate_decisions`
   - Publish is rejected if gate decisions diverge between these chains.
3. Audit event depth:
   - Lifecycle events now include packet version and ack-side gate context.

## Self-Prompt Loop Findings and Fixes

1. Self-prompts now carry generated MCID-compatible lineage blocks.
2. Self-prompt payload persistence includes cumulative lineage for replay/audit.
3. Direct self-prompt task envelopes include cumulative lineage metadata.

## Agent Self-Edit Protocol Additions

1. Added self-edit schema:
   - `docs/protocols/schemas/tnf-agent-self-edit.schema.json`
2. Added federation gate bridge:
   - `docs/protocols/bridges/agent-self-edit-federation-gates.yml`
3. Added ownership registry:
   - `data/protocols/agent-owned-docs.registry.json`
4. Added deterministic gate evaluator:
   - `scripts/protocols/agent-self-edit-gate.cjs`
5. Added protocol guide:
   - `docs/protocols/agent-self-edit-protocol-v0.1.md`

## Remaining Follow-Up

1. Mirror self-edit allow/deny outcomes into first-class Task Detail filters.
2. Add CI fixtures that validate both allow and deny self-edit examples.
3. Add rate-limit/approval telemetry counters to macro orchestration dashboards.
4. Apply equivalent first-class filtering for cron governance allow/deny events
   (`cron_governance_gate` category).
