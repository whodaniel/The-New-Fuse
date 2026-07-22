---
description:
  'Show the canonical TNF living state, ledger, and latest handoff summary'
---

Summarize the current TNF state for the operator.

Read and synthesize (do not dump raw contents):

- `docs/protocols/LIVING_STATE.md` — current directive + active steps (surface
  only steps that are still open or gated).
- `docs/protocols/AGENT_STATUS_LEDGER.md` — "Next Agent Focus" and any P0 items.
- `docs/protocols/reports/SESSION_HANDOFF_LATEST.json` — `work_summary`,
  `next_actions`, and `continuation.resume_checklist`.

If a local `tnf` CLI is available, you may instead run `tnf state` and present
its output.

Output a short table (handoff id, branch, head SHA, directive) followed by a
bullet list of open/gated next actions. Read-only.
