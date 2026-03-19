# TWIP Orchestration Extension v0.1

Status: Draft-Implementable  
Audience: TNF protocol owners and orchestration maintainers

## Why

TWIP already gives canonical terminal identity and graph projection. This
extension connects those features directly into assignment and handoff logic so
the orchestrator can reason about active work, contention, and risk.

## Extension Surface

## 1) `ORCH.WORKSTREAM.SIGNAL`

Sanitized macro signal derived from TWIP inventory snapshots.

Schema: `docs/protocols/schemas/twip-workstream-signal.schema.json`

Purpose:

1. Advertise current active/idle terminal distribution.
2. Expose high-level executable mix (`codex`, `node`, etc.).
3. Emit safety counters (approval bypass, remote MCP clients).

## 2) `TWIP_TERMINAL_CONTEXT` for Handoffs

Portable context block attached to orchestration handoffs.

Schema: `docs/protocols/schemas/twip-terminal-context.schema.json`

Purpose:

1. Bind handoffs to concrete terminal identity (`twid`).
2. Preserve tenant/session constraints.
3. Carry risk hints for policy-aware delegation.

## 3) Bridge Contract

Bridge definition: `docs/protocols/bridges/twip-to-orchestrator-loop.yml`

Flow:

1. Relay scan -> TWIP inventory snapshot.
2. Macro board -> workstream signal.
3. Inter-agent workflow templates -> terminal-aware subtasks.
4. Orchestrator assignment -> handoff packet with TWIP context.

## 4) Agent-Owned Doc Self-Edit Contract

Schema: `docs/protocols/schemas/tnf-agent-self-edit.schema.json`  
Bridge: `docs/protocols/bridges/agent-self-edit-federation-gates.yml`  
Registry: `data/protocols/agent-owned-docs.registry.json`

Purpose:

1. Allow safe self-edit updates to agent-owned docs (`SOUL.md`, memory docs).
2. Enforce owner/path scope before writes.
3. Reuse MCID lineage and federation gate chain for every write decision.

## 5) Cron Governance Contract

Schema: `docs/protocols/schemas/tnf-cron-governance.schema.json`  
Bridge: `docs/protocols/bridges/tnf-cron-federation-gates.yml`  
Registry: `data/protocols/cron-jobs.registry.json`  
Gate evaluator: `scripts/protocols/cron-governance-gate.cjs`

Purpose:

1. Enforce that framework-level cron jobs are editable only by Super Admin (or
   explicit delegated approval).
2. Allow users and their tenant agents to manage tenant-owned cron jobs with
   owner/scope checks.
3. Attach scheduler lineage (`schedule_id`, `schedule_run_id`) to MCID for
   audit-grade handoff/log continuity.
4. Standardize terminal context reminder loops through dedicated categories:
   `system_terminal_awareness` and `tenant_terminal_awareness`.

## Reference Packet Fragments

Workstream signal fragment:

```json
{
  "spec": "twip/0.1",
  "type": "ORCH.WORKSTREAM.SIGNAL",
  "generated_at": "2026-03-18T18:59:20.341Z",
  "scope": { "tenant_id": "tnf-local" },
  "summary": {
    "total_terminals": 24,
    "active_terminals": 6,
    "idle_terminals": 18,
    "active_ratio": 0.25
  }
}
```

Handoff context fragment:

```json
{
  "twip_ref": {
    "twid": "5b5de55b-1837-58f8-a9ed-a61a3347475a",
    "correlation_id": "11111111-1111-4111-8111-111111111111"
  },
  "scope": { "tenant_id": "tnf-local", "session_key": "tty:ttys015" },
  "terminal": { "tty": "/dev/ttys015", "work_executables": ["node", "npm"] },
  "risk": { "approval_bypass": false, "remote_mcp": true }
}
```

## Required Policy Gates

1. Reject assignment if `tenant_id` mismatches packet scope.
2. Require explicit `twid` for terminal-bound tasks.
3. Require explicit agent target list (no broadcast by default).
4. If `approval_bypass=true`, only allow orchestrator-approved task classes.

## Federation Channels + Network-Wide Gates

Bridge definition:
`docs/protocols/bridges/twip-federation-orchestration-gates.yml`

Required gate chain per federated hop:

1. `TENANT_SCOPE_GATE`
2. `TRACE_CONTINUITY_GATE`
3. `TERMINAL_BINDING_GATE`
4. `HIGH_RISK_RUNTIME_GATE`
5. `CHANNEL_MEMBERSHIP_GATE`

If any gate fails, packet must be quarantined and escalated instead of silently
falling through to execution.

Cron-specific federation bridge:
`docs/protocols/bridges/tnf-cron-federation-gates.yml`

## Master Cumulative ID Protocol (MCID)

Schema: `docs/protocols/schemas/tnf-master-cumulative-id.schema.json`

Purpose:

1. Keep one cumulative lineage object across TWIP, relay envelopes, handoff
   packets, and workflow events.
2. Normalize ID field drift (`traceId`, `correlation_id`, `packetId`,
   `workflowId`, `sessionKey`, `channelId`, `twid`) into one transport-safe
   contract.
3. Attach gate decisions to the same lineage chain for auditable federation.

## Current State (2026-03-18)

1. Strong:
   - Canonical terminal identity (`twid`) and scope enforcement.
   - TWIP envelope trace block (`correlation_id`, `causation_id`).
   - Terminal macro-board for active/risk telemetry.
   - Agent self-edit protocol with ownership/path gate controls.
2. Partial:
   - Legacy `HandoffPacket` v1.0 data may exist without full MCID lineage
     fields.
   - Gate outcomes are logged in lifecycle events but still need dedicated UI
     views in the task/audit surface.
3. Integration priority:
   - enforce MCID at assignment publish + handoff ack boundaries.
   - mirror gate decisions into execution audit trail views.
   - enforce cron mutation RBAC/category gates before scheduler writes.

Detailed assessment: `docs/protocols/twip-federation-state-2026-03-18.md`

## Capability Registration

Profile: `config/ai-agents/twip-orchestration-bridge.json`

This provides a catalog entry that agents can discover semantically and bind to
without hardcoding TWIP internals.

## Implementation Checklist

1. Generate macro board every 5 minutes (or faster in active incidents).
2. Validate signal and context packets against new schemas.
3. Enforce policy gates in assignment/handoff path.
4. Emit audit trail records for every signal-consumed assignment decision.
5. Keep default behavior read-only and tenant-scoped.
6. Route all cron mutations through cron governance schema + gate checks before
   scheduler writes.
