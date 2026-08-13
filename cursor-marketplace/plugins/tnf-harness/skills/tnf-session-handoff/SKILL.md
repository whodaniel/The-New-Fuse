---
name: tnf-session-handoff
description:
  Write a durable TNF session handoff so the next agent resumes with full
  context. Use at the end of a work session, before a context reset, or when the
  operator asks to hand off.
---

# TNF Session Handoff

Capture the session's outcome into the canonical handoff artifacts so continuity
survives context resets and agent swaps. This is the "Turn End" counterpart to
Turn Zero.

## When to use

- End of a work session or major milestone.
- Before a likely context reset or agent handoff.
- Operator says "hand off", "turn end", or "checkpoint".

## What to produce

Update (or, if a local `tnf` CLI exists, regenerate) these artifacts:

- `docs/protocols/reports/SESSION_HANDOFF_LATEST.json`
- `docs/protocols/reports/SESSION_HANDOFF_LATEST.md`
- `docs/protocols/LIVING_STATE.md` (active steps + current directive)

If the `tnf` CLI is available, prefer the built-in pathway:

```bash
tnf turn-end
```

Otherwise, edit the artifacts directly following their existing structure.

## Handoff contents (JSON)

At minimum capture:

- `handoff_id`, `created_at`, `repository`, `branch`, `head_sha`
- `work_summary` — what changed and why
- `changed_paths` — files touched
- `next_actions` — ordered, concrete next steps
- `continuation` — owner, targets, priority, and a `resume_checklist`
- `verification` — what was verified and how (tests, type-check, exit codes)

## Guardrails

- Do not commit or push the handoff unless the operator confirms (safety gates).
- Keep `work_summary` honest: record what was verified, not what was assumed.
- Preserve existing history entries; append, don't overwrite.
