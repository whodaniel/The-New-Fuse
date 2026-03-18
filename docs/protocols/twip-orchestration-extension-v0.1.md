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
