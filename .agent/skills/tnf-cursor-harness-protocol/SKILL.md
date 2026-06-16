---
name: tnf-cursor-harness-protocol
description: Onboard and operate Cursor CLI agents under TNF harness protocol (Turn Zero, inspect-act-verify, MCP routing). Use when launching Cursor CLI from TNF, running tnf cursor, or assimilating Cursor into the TNF control plane.
---

# TNF Cursor Harness Protocol

Use this skill when Cursor CLI is routed through TNF (`tnf cursor`, `tnf assimilate run cursor`, or `pnpm run tnf:start:cursor`).

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

1. `docs/protocols/TURN_ZERO_MANDATE.md`
2. `docs/protocols/LIVING_STATE.md`
3. `docs/protocols/AGENT_STATUS_LEDGER.md`
4. `docs/protocols/reports/SESSION_HANDOFF_LATEST.json`

## Cursor Operator Policy

- TNF remains the protocol-neutral control plane.
- Prefer `tnf cursor ...` over raw `cursor ...` so MCP config and harness receipts stay attached.
- Run Turn Zero before code changes unless the operator already requested implementation.
- Verify every action; never trust upstream agent output without structured confirmation.

## Raw Agent Prompt

Paste into a Cursor CLI session launched from repo root:

```text
Execute the Turn Zero Mandate exactly as outlined in ./docs/protocols/TURN_ZERO_MANDATE.md. Read the Living State, Ledger, and Handoff artifacts in ./docs/protocols/, output a summary of your orientation, and await my confirmation before executing any code changes.
```

## Quick Commands

- Link Cursor into assimilation routing: `tnf assimilate link cursor`
- Run through TNF harness: `tnf assimilate run cursor -- agent --help`
- Full start pipeline: `pnpm run tnf:start:cursor`
- Protocol health: `tnf protocol gate`
