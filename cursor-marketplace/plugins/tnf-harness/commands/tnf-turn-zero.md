---
description:
  'Run TNF Turn Zero V2 (current Turn Zero) — onboard + Stage A orientation'
---

Execute **Turn Zero V2** (current Turn Zero) for the current repository.

Naming law: “Turn Zero” means Turn Zero V2. There is no separate current Turn
Zero.

Steps:

1. From the TNF repository root, run:
   ```bash
   pnpm run tnf:onboard -- --task "<current task>"
   ```
   (This runs `scripts/protocols/turn-zero-v2-gate.cjs`.)
2. Read / confirm from the onboard receipt:
   - `docs/protocols/TURN_ZERO_MANDATE.md`
   - `docs/protocols/LIVING_STATE.md`
   - `docs/protocols/reports/SESSION_HANDOFF_LATEST.json` (or `.md` fallback)
3. Check repo state: current branch, ahead/behind `origin`, dirty file count.
4. Emit a compact orientation briefing:
   - Protocol: Turn Zero V2
   - Handoff id + timestamp, branch, head SHA
   - Current directive
   - Open and operator-gated tasks
   - Write-readiness / blockers
   - Any P0 or `session-stale` flags
5. For ordinary conversation, continue. Before mutation, require write-ready
   onboard unless the operator already authorized implementation.

If a local `tnf` CLI is available, you may run `tnf onboard` and
`node scripts/cursor/tnf-cursor-harness-onboard.cjs` to automate boot. This
command is read-only relative to product code: do not edit, commit, or kill
processes unless the operator asked for implementation.
