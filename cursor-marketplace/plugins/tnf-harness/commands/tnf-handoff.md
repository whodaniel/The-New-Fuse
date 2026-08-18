---
description:
  'Write a durable TNF session handoff (Turn End) so the next agent resumes with
  full context'
---

Produce a TNF session handoff capturing this session's outcome.

If a local `tnf` CLI is available, prefer:

```bash
tnf turn-end
```

Otherwise, update these artifacts directly, following their existing structure:

- `docs/protocols/reports/SESSION_HANDOFF_LATEST.json`
- `docs/protocols/reports/SESSION_HANDOFF_LATEST.md`
- `docs/protocols/LIVING_STATE.md` (current directive + active steps)

Capture at minimum: `handoff_id`, `created_at`, `repository`, `branch`,
`head_sha`, `work_summary`, `changed_paths`, ordered `next_actions`,
`continuation` (owner, targets, priority, `resume_checklist`), and
`verification` (what was verified and how).

Guardrails: append to history, do not overwrite. Keep `work_summary` honest —
record what was verified, not assumed. Do NOT commit or push unless the operator
explicitly confirms.
