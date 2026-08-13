# The New Fuse — Harness

**Governance + continuity for Cursor agents.**

`tnf-harness` turns a Cursor agent into a disciplined operator: it orients from
shared state before acting, verifies its work against a proven pathway, hands
off context cleanly, and refuses to take irreversible actions without your
explicit confirmation.

## What's inside

### Rules

- **`tnf-turn-zero`** — orient from Living State, Ledger, and the latest handoff
  before touching code.
- **`tnf-inspect-act-verify`** — the core discipline: gather ground truth, make
  the smallest change, verify against a proven pathway.
- **`tnf-safety-gates`** — commits, pushes, deletes, and process kills are
  operator-gated; no fabricated approvals.

### Skills

- **`tnf-cursor-harness`** — operate under the TNF control plane end to end.
- **`tnf-turn-zero-orientation`** — produce a Turn Zero briefing.
- **`tnf-session-handoff`** — write a durable handoff (Turn End).
- **`tnf-assimilate-onboarding`** — route Cursor through TNF with MCP +
  receipts.

### Commands

- **`/tnf-turn-zero`** — orient and await confirmation.
- **`/tnf-state`** — summarize living state + next actions.
- **`/tnf-handoff`** — write the session handoff.
- **`/tnf-verify`** — run the Verify step with real evidence.

### Subagent

- **`tnf-verifier`** — a skeptical, read-only validator that confirms claimed
  work actually passes.

### Hooks

- **`beforeShellExecution`** — gates `git commit/push/reset`, `rm -rf`, process
  kills, and autonomous loops behind an operator confirmation (`ask`).
- **`stop`** — a Turn End nudge toward writing a handoff (observe-only).

### MCP server

- **`tnf-skills`** — exposes the TNF skills library (`list_skills`,
  `get_skill_content`, `search_skills`, `get_onboarding_flow`,
  `get_resource_map`). Requires the `tnf-skills-mcp` binary from a local TNF
  install.

## Requirements

Rules, skills, commands, subagent, and hooks work with no backend. The
`tnf-skills` MCP server needs the `tnf-skills-mcp` binary (ships with
[The New Fuse](https://thenewfuse.com)). The hook scripts require `bash`; `jq`
is used when available and gracefully falls back when not.

## License

MIT © The New Fuse.
