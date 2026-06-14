# Email Exclusion Review (2026-05-06)

## Final Snapshot
- Excluded facts evaluated: `30`
- `keep_excluded_already_covered`: `10`
- `keep_excluded_low_signal`: `14`
- `keep_excluded_suspicious_subject`: `6`
- `optional_review`: `0`

## Resolution Notes
- Optional extension imports previously added `3` low-confidence facts (`2002-11-08`, `2002-11-18`, `2005-10-25`).
- The last held optional fact (`1999-11-16 Welcome Aboard`) is now resolved as `covered_exact_evidence` via mailbox-path evidence overlap with the existing `Telecommuter onboarding record` row.
- Deterministic closure artifact: `data/protocols/email-optional-review-resolution.2026-05-06.json`.

## Already Covered (No Additional Import Needed)
- Count: `10`
- Date span: `1999-02-16` -> `2005-10-25`
- Narrative channels: `Personal Life Story (Private)`, `Media Empire Story (Private)`
- Row-level sender/subject details are intentionally omitted from this public-facing summary and retained only in private archaeology artifacts.

## Retained as Low-Signal
- Count: `14`
- Date span: `1999-08-31` -> `2005-11-07`
- Narrative channels: `Personal Life Story (Private)`, `Media Empire Story (Private)`
- Row-level sender/subject details are intentionally omitted from this public-facing summary and retained only in private archaeology artifacts.

## Retained as Suspicious Subject
- Count: `6`
- Date span: `2007-06-18` -> `2015-11-14`
- Narrative channels: `Personal Life Story (Private)`, `Media Empire Story (Private)`
- Row-level sender/subject details are intentionally omitted from this public-facing summary and retained only in private archaeology artifacts.

## Process Notes
- Source machine report: `data/protocols/email-supabase-timeline-validation.2026-05-06.json`.
- Optional queue artifact after adjudication: `data/protocols/email-exclusion-optional-review.2026-05-06.json`.
- Promote any retained row only with explicit evidence justification and preserve mailbox/message references.
