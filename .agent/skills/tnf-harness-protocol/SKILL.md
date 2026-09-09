---
name: tnf-harness-protocol
category: tnf-platform
department: tech
description:
  Onboard and operate Cursor CLI agents under TNF harness protocol (Turn Zero
  V2, inspect-act-verify, MCP routing). Use when launching Cursor CLI from TNF,
  running tnf cursor, or assimilating Cursor into the TNF control plane.
---

# TNF Cursor Harness Protocol

Use this skill when Cursor CLI is routed through TNF (`tnf cursor`,
`tnf assimilate run cursor`, or `pnpm run tnf:start:cursor`).

**Naming law:** “Turn Zero” means **Turn Zero V2**.

## Boot Sequence (Inspect → Act → Verify)

From the TNF repository root:

```bash
tnf onboard
node scripts/cursor/tnf-cursor-harness-onboard.cjs
```

If baseline frontload files are missing:

```bash
tnf onboard --repair
node scripts/cursor/tnf-cursor-harness-onboard.cjs --repair
```

## Authority

1. `docs/protocols/TURN_ZERO_MANDATE.md` (Turn Zero V2)
2. `docs/protocols/LIVING_STATE.md`
3. `docs/protocols/AGENT_STATUS_LEDGER.md`
4. `docs/protocols/reports/SESSION_HANDOFF_LATEST.json`

## Cursor Operator Policy

- TNF remains the protocol-neutral control plane.
- Prefer `tnf cursor ...` over raw `cursor ...` so MCP config and harness
  receipts stay attached.
- Run Turn Zero V2 before code changes unless the operator already requested
  implementation.
- Verify every action; never trust upstream agent output without structured
  confirmation.

## Raw Agent Prompt

Paste into a Cursor CLI session launched from repo root:

```text
Before planning or acting, run Turn Zero V2 (current Turn Zero) from the repository root: pnpm run tnf:onboard -- --task "<current task>". It runs scripts/protocols/turn-zero-v2-gate.cjs, derives Stage A from docs/core/FRONTLOAD_MANIFEST.md, verifies task routes and host injection, and classifies write-readiness before any mutation. Law: docs/protocols/TURN_ZERO_MANDATE.md.
```

## Quick Commands

- Link Cursor into assimilation routing: `tnf assimilate link cursor`
- Run through TNF harness: `tnf assimilate run cursor -- agent --help`
- Full start pipeline: `pnpm run tnf:start:cursor`
- Protocol health: `tnf protocol gate`
- Harness master loop: `tnf harness cycle` (see skill:
  `tnf-harness-master-loop`)
- Interactive harness: `/harness inspect`, `/harness cycle`, `/autonomous on`
