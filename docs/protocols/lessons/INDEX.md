# TNF Lessons Learned — Index

`[CLASS:PRIME] [STATUS:ACTIVE] [DOC_TYPE:PROTOCOL_INDEX] [VISIBILITY:COLLECTIVE]`

Every lesson is indexed here at write time, by
`scripts/protocols/turn-end-reflection.cjs`.

This index exists because three lesson files sat in `docs/protocols/reports/`
with nothing pointing at them, so nothing found them and each session
rediscovered the same ground. Axiom 5 (Persistence): "Fruitful understandings
shall never be left as transactional transients."

## Lessons

- [Validate on read when the writer set is unbounded](2026-09-03-validate-on-read-unbounded-writers.md)
  — 2026-09-03. A model overwrote the canonical handoff with an invented file.
  Consolidating writers cannot help when every agent with a file-write tool is a
  writer; validation has to happen at the read site.
- [Stale-buffer write-back is a fourth clobber class](2026-09-05-stale-buffer-clobber-and-critical-sections.md)
  — 2026-09-05. A live co-tenant agent erased on-disk edits twice by replaying
  its stale in-memory file buffers — a path no git hook can see. Edit
  co-tenant-owned files only inside a SIGSTOP freeze window, commit before
  resume, and verify behavior (not just commit membership) on the target branch.

## Earlier lessons, recorded before this index existed

Left in place rather than moved, so no existing reference breaks.

- [Protocol enforcement inertness](../reports/PROTOCOL_ENFORCEMENT_INERTNESS_LESSONS_20260901.md)
  — 2026-09-01. Governance present as doctrine, absent as running code; 643 of
  696 commits went direct to `main`.
- [Terminal sprawl recovery](../reports/TERMINAL_SPRAWL_RECOVERY_LESSONS_20260901.md)
  — 2026-09-01.
- [RC T5 database lessons](../reports/SESSION_HANDOFF_RC_T5_DB_LESSONS_20260829.md)
  — 2026-08-29.
