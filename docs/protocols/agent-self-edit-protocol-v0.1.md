# Agent Self-Edit Protocol v0.1

Status: Draft-Implementable  
Audience: TNF orchestrator maintainers, federation gate owners, agent-runtime
integrators

## Objective

Allow agents to safely update their own `SOUL.md` and other explicitly owned
docs without weakening tenant isolation, gate governance, or auditability.

## Core Contract

Schema:

- `docs/protocols/schemas/tnf-agent-self-edit.schema.json`

Ownership registry:

- `data/protocols/agent-owned-docs.registry.json`

Gate evaluator:

- `scripts/protocols/agent-self-edit-gate.cjs`

Bridge:

- `docs/protocols/bridges/agent-self-edit-federation-gates.yml`

## Required Gate Chain

1. `TENANT_SCOPE_GATE`
2. `TRACE_CONTINUITY_GATE`
3. `CHANNEL_MEMBERSHIP_GATE`
4. `OWNERSHIP_GATE`
5. `PATH_SCOPE_GATE`
6. `CONTENT_POLICY_GATE`
7. Optional: `WRITE_RATE_LIMIT_GATE`
8. Optional: `APPROVAL_GATE`

Any missing/deny/quarantine gate must stop writes and produce a deny decision.

## Reusable, Transferable, Translatable, Wrappable Design

1. Reusable:
   - One schema governs all self-edit actions independent of runtime.
   - One ownership registry controls path authorization by owner agent id.
2. Transferable:
   - `cumulative_id` is mandatory for all requests.
   - Same payload works across relay, task pipeline, and API timeline systems.
3. Translatable:
   - Adapter systems map local identifiers into:
     - `tenant_id`
     - `agent.agent_id`
     - `target.owner_agent_id`
     - `cumulative_id.lineage.*`
4. Wrappable:
   - Protocol can be wrapped in MCP tools, HTTP endpoints, or event envelopes.
   - Wrapper must preserve canonical fields; wrapper metadata stays additive.

## Safety Defaults

1. Writes are denied unless `target.path` is in owner allowlist.
2. Paths requiring explicit approval are denied until approval is present.
3. `agent.agent_id` must equal `target.owner_agent_id` for self-edit mode.
4. Relative path traversal (`../`) and absolute paths are rejected.
5. All decisions must be logged with cumulative lineage.

## Example Validation

```bash
node scripts/protocols/agent-self-edit-gate.cjs --request ./request.self-edit.json --json
```

## Orchestration Integration

1. Self-prompt loops may propose edits but cannot apply without gate allow.
2. Handoff packets can transport edit requests, but ownership/path gates still
   apply.
3. Timeline records should include:
   - request id
   - owner agent id
   - normalized path
   - gate result
   - cumulative correlation id
