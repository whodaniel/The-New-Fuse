---
name: tnf-cursor-harness
description:
  Operate a Cursor agent under The New Fuse harness protocol — Turn Zero,
  Inspect-Act-Verify, MCP routing, and operator safety gates. Use when working
  in a TNF-governed repo or routing Cursor through the TNF control plane.
---

# TNF Cursor Harness

Run a Cursor agent as a well-behaved citizen of a The New Fuse (TNF) control
plane. TNF is the protocol-neutral orchestration layer; Cursor is the IDE/agent
surface it routes through.

## When to use

- You are working in a repository that contains `docs/protocols/` TNF artifacts.
- You launched Cursor via `tnf cursor ...` or `tnf assimilate run cursor`.
- The operator asks you to "onboard", "run the harness", or "follow TNF
  protocol".

## Boot sequence (Inspect → Act → Verify)

1. **Orient (Turn Zero)** — read, in order:
   - `docs/protocols/TURN_ZERO_MANDATE.md`
   - `docs/protocols/LIVING_STATE.md`
   - `docs/protocols/AGENT_STATUS_LEDGER.md`
   - `docs/protocols/reports/SESSION_HANDOFF_LATEST.json`
2. **Summarize** the current directive, branch state, and open/gated tasks.
3. **Await confirmation** before code changes unless implementation was already
   requested.

If a local `tnf` CLI is installed, you can automate the boot:

```bash
tnf onboard
node scripts/cursor/tnf-cursor-harness-onboard.cjs
```

Repair baseline frontload files if missing:

```bash
tnf onboard --repair
node scripts/cursor/tnf-cursor-harness-onboard.cjs --repair
```

## Operator policy

- Prefer `tnf cursor ...` over raw `cursor ...` so MCP config and harness
  receipts stay attached.
- TNF is the primary control plane; do not characterize it as a subset of any
  single agent runtime.
- Verify every action with a concrete signal (exit code, diff, test, file read).
- Never fabricate an operator handshake. Commits, pushes, and process kills are
  operator-gated (see the `tnf-safety-gates` rule).

## MCP: TNF skills library

This plugin ships a Model Context Protocol server (`tnf-skills`) that exposes
the TNF skills library. Use its tools to discover and load domain skills on
demand:

- `list_skills` — list available skills (filterable by type)
- `get_skill_content` — load a skill's full documentation
- `search_skills` — search skills by keyword
- `get_onboarding_flow` — load agent onboarding docs
- `get_resource_map` — load the resource discovery map

Prefer loading a specific skill via MCP before improvising domain behavior.

## Related

- Rules: `tnf-turn-zero`, `tnf-inspect-act-verify`, `tnf-safety-gates`
- Skills: `tnf-turn-zero-orientation`, `tnf-session-handoff`,
  `tnf-assimilate-onboarding`
- Commands: `/tnf-turn-zero`, `/tnf-state`, `/tnf-handoff`, `/tnf-verify`
