# Validate on read when the writer set is unbounded — 2026-09-03

`[CLASS:INTEL] [STATUS:PROPOSED] [DOC_TYPE:LESSON] [VISIBILITY:COLLECTIVE]`

## What happened

At 12:24 local, mid-session, `docs/protocols/reports/SESSION_HANDOFF_LATEST.json`
— the record the entire Turn Zero / Turn End lifecycle reads — was replaced by an
88-line file with `handoff_id: a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d`, a
`created_at` rounded to `:00.000Z`, and a `session_id` inconsistent with its own
timestamp.

Measured against `tnf-session-handoff.schema.json`: **14 of 18 required
properties missing, 6 properties present that the schema forbids**
(`additionalProperties: false`). `context_refs` has never appeared in the git
history of `docs/protocols/reports/`. No script in the repository emits that
shape.

A model wrote a plausible-looking handoff from imagination, over the record.

`enforce-session-handoff.cjs` printed `OK (pre-push): no files to inspect`
throughout.

## Why it happened

Not because the writers were badly written. Three script writers exist
(`emit-session-handoff.cjs:516`, `turn-end-v2.cjs:86`, `turn-end.cjs`), each
named by a different authority — D14, `TURN_END_MANDATE`, and
`SESSION_HANDOFF_ENFORCEMENT` respectively — and all three serialize correctly.

The handoff is a **plain file in a shared checkout**. Every agent holding a
file-write tool is therefore also a writer, and no amount of consolidating the
*scripts* reaches an agent that simply calls Write. The writer set is not three;
it is unbounded by construction.

The existing gate could not see it for a second, compounding reason: it is scoped
to *changed files at pre-push*. A corrupt file merely sitting on disk is invisible
to a diff-scoped check.

## What a future session should do differently

**When the set of writers to a file cannot be enumerated, validate on read.**
Writer consolidation is the wrong control; it assumes a closed set.

Concretely:

- `node scripts/protocols/validate-session-handoff.cjs --strict` before trusting
  the handoff. `turn-zero-v2-gate.cjs` now calls it automatically and blocks
  write-readiness on a schema-invalid record.
- Recover with `git checkout --`, then re-emit. Never hand-edit the record — that
  is how the fabricated file looked legitimate enough to survive.
- Do not infer health from size or parseability. The fabricated file was valid
  JSON of a plausible length.

Generalise beyond the handoff: **any file that is (a) authoritative, (b) plainly
writable, and (c) read by automation needs validation at the read site.** File
size, mtime, and "it parses" are not evidence.

## Evidence

- Fabricated file preserved outside the repository; schema diff reproducible via
  `validate-session-handoff.cjs --file <path>`, which reports 23 findings plus
  two fabrication signals (hand-shaped id, minute-rounded timestamp).
- Three distinct handoff identities existed on 2026-09-03: `8b3715f7…` (valid,
  classification `core`, reported by the boot hook), `a1b2c3d4…` (fabricated),
  `fe6ae3f4…` (index and HEAD). `8b3715f7…` survives in none of worktree, index,
  or HEAD.
- Commit `8709fc134` adds the validator and the validate-on-read wiring.
