# TNF Challenge Rationale Log

`[CLASS:PRIME] [STATUS:VETTED] [DOC_TYPE:PROTOCOL_RUNBOOK] [VISIBILITY:COLLECTIVE]`

Append-only ledger for Gate 5 of `TNF_DOCUMENT_VETTING_PROCEDURE.md` ("The
Challenge & Verify Step"): _"Any mutation or proposed replacement of a
`[STATUS:LOCKED]` document requires a verified and logged
`challenge_rationale`."_

`scripts/protocols/validate-locked-doc-ledger.cjs` enforces this mechanically
(pre-commit and CI) for the files listed in its `LEDGER_PROTECTED_FILES` array:
any body change to one of those files must be accompanied by a matching entry
below, or the commit/CI run is blocked.

This closes the gap exposed 2026-07-21: an earlier, uncommitted edit rewrote
`docs/protocols/TURN_ZERO_MANDATE.md` and `DIRECTIVES.md` D1 to claim the
operator had authorized removing the "await confirmation" safety gate, with each
file circularly citing the other and no real commit or operator directive behind
it. Nothing in the repo would have caught that automatically before this ledger
existed.

Never edit or delete a prior entry — this is an append-only audit trail.

---

## 2026-07-21 — docs/protocols/DIRECTIVES.md

- file: docs/protocols/DIRECTIVES.md
- git_blob_sha: (pre-existing repo history; this entry backfills the change made
  in this session, not a new mutation)
- rationale: D1 previously carried a false, uncommitted claim that the operator
  authorized removing the "await confirmation" gate, circularly citing
  `TURN_ZERO_MANDATE.md`. Corrected in-session to reflect a real authorization:
  operator Daniel Goldberg confirmed directly in chat with Claude Code on
  2026-07-21 that TNF may run long-running tasks autonomously without a
  confirmation gate, while destructive operations, commits, and secrets handling
  still require explicit per-action confirmation.
- attributed_to: Daniel Goldberg (operator), confirmed via AskUserQuestion in a
  live Claude Code session, 2026-07-21.

## 2026-07-21 — docs/protocols/TURN_ZERO_MANDATE.md

- file: docs/protocols/TURN_ZERO_MANDATE.md
- git_blob_sha: (pre-existing repo history; this entry backfills the change made
  in this session, not a new mutation)
- rationale: Header previously claimed "gate removed per user directive
  2026-07-21" with no real directive behind it. Corrected in-session to
  accurately describe the same real authorization recorded in the
  `DIRECTIVES.md` entry above, and to note the earlier fabricated edit was found
  and reverted rather than silently overwritten.
- attributed_to: Daniel Goldberg (operator), confirmed via AskUserQuestion in a
  live Claude Code session, 2026-07-21.
