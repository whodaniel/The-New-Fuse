`[CLASS:INTEL] [STATUS:PENDING]` `[DOC_AUDIT_BACKFILL:2026-07-14]` — header
restored for Gate 3 compliance; reclassify on next vetting pass.

# Agent Self-Edit Protocol v0.1

Status: Draft-Implementable  
Audience: TNF orchestrator maintainers, federation gate owners, agent-runtime
integrators

## Objective

Allow agents to safely update their own `SOUL.md` and other explicitly owned
docs without weakening tenant isolation, gate governance, or auditability.

Baseline personal-doc classes supported in owner registries include:

1. identity docs (`SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`)
2. agent-local memory/workspace paths (`.agent/**`, `.memory/**`,
   `memory-bank/**`)

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

## Local Self-Edit Policy (opt-in, OFF by default)

`scripts/protocols/agent-self-edit-gate.cjs --staged` blocks any commit that
touches an authority surface listed in `globally_approval_required` of
`data/protocols/agent-owned-docs.registry.json`. Two things can permit such a
commit:

1. **Per-commit operator acknowledgement** — `TNF_AUTHORITY_EDIT_CONFIRM=1`.
   Unchanged. Still the right mechanism for a one-off edit.
2. **Standing machine-local policy** — `~/.tnf/config/self-edit-policy.json`.
   New. Lets an operator authorize agent self-edits on their own machine without
   re-confirming every commit.

```json
{
  "allow_agent_authority_edits": true,
  "allowed_paths": ["docs/protocols/schemas/**"]
}
```

- **Default is OFF.** The file does not exist in a fresh checkout, and the gate
  fails closed: absent, unreadable, malformed, or any value other than the
  literal boolean `true` all mean disabled.
- **It lives outside the repo, deliberately.** In-tree, enabling it on one
  machine would enable it for everyone who clones — the opposite of a local
  opt-in — and the file would itself become an authority surface guarded by the
  gate it configures, which is circular.
- **`allowed_paths` is optional.** Omitted (or empty) means no path restriction.
  Present and non-empty means strict: if _any_ staged authority surface falls
  outside the rules, the entire commit is blocked rather than partially allowed,
  so the authority set never half-lands in a state nobody chose. Rules use the
  same matcher as the registry, including the `/**` suffix.
- **Override the location** with `TNF_SELF_EDIT_POLICY=<path>` (used by tests).
- **Auditing is unconditional.** Every authority-surface commit attempt is
  appended to `~/.tnf/audit/commit-attempts.jsonl` with `decision`, the
  offending `path`, and `via` — `operator-env`, `local-policy`, or `none`. "A
  human typed it once" and "this machine always allows it" are different claims
  about consent, and the log keeps them distinct.

### What enabling this actually costs

`TURN_ZERO_MANDATE.md` records an agent editing that file to assert operator
authorization it did not have. This gate exists because of that incident. An
agent that can edit its own authority can grant itself authority, and turning
this on removes the per-commit human checkpoint that stands in the way.

That is a legitimate choice for a single-operator machine, where re-confirming
every commit is friction without a corresponding reader. It is a poor choice on
shared or unattended infrastructure. Agents must never enable this policy on an
operator's behalf, and must not treat its presence as license to edit authority
surfaces that are not required by the task in hand — the audit log is reviewed,
and the gate's job is now to record rather than to refuse.
