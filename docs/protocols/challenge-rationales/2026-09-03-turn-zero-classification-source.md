# Turn Zero classification source and handoff validate-on-read — 2026-09-03

`[CLASS:PRIME] [STATUS:PROPOSED] [DOC_TYPE:CHALLENGE_RATIONALE] [VISIBILITY:COLLECTIVE]`

- file: scripts/protocols/turn-zero-v2-gate.cjs
- file: scripts/protocols/validate-session-handoff.cjs (new)
- file: docs/core/FRONTLOAD_MANIFEST.md
- doc_hash_gate:
  sha256:7bd1a19ba23d341f0c6d23da1536bdec4ceafc4e5413b91ffed5536af00abba9
- doc_hash_validator:
  sha256:8021c4a6596a1550ba845dea25ce0e83a017d3d42214b73c786d7d628e71aab6
- doc_hash_manifest:
  sha256:1ab636fef453b1e176d9d2b8f87006fc773e978a3e5a34d9fd4041243db7fb2b
- authority_tier: TIER 3 (TACTICAL) per D26 — script and non-LOCKED doc edits.
  `~/.tnf/authority/tier.json` records `"tier": "tactical"`, operator Daniel
  Goldberg, issued 2026-07-28. Audit trail mandatory; this is that trail.

## Assumption challenged

Three assumptions, all in the Turn Zero machine gate.

**1. That `corporate` is a valid work domain.** Commit `7fd41cc3c` (2026-08-30,
"purge corporate metaphor and enforce compliance log for locked lexicon")
deprecated the term by operator directive and rewrote 25 files.
`TNF_SYSTEM_LEXICON.md` §2 now reads: _"The terms 'Corporate', 'Department', and
'Staff' are permanently deprecated."_ `TURN_ZERO_MANDATE.md:142` defines Axis 1
as `core` — TNF/product/framework work; the schema's `work_domain` enum is
`core|agency|personal|unknown`; every handoff receipt emitted since 2026-08-29
records `core`. The purge touched documents and the schema and never touched a
single executable, so `turn-zero-v2-gate.cjs:78` still required `corporate`.
Write-readiness and schema-validity were therefore mutually exclusive: a handoff
that satisfied the schema could not satisfy the gate.

This is the failure `TNF_BOOK_OF_AXIOMS` Axiom 8 (Non-Temporal Proliferation, =
D3) predicts: _"if an agent improves itself but fails to implement that
improvement into the shared TNF framework, the action is void."_ The purge was
void in exactly the part that never proliferated to code.

**2. That classification comes from the environment.** `classificationReceipt()`
read only `TNF_WORK_DOMAIN`, `TNF_ARTIFACT_DESTINATION`, `TNF_DATA_RESIDENCY`
and `TNF_DATA_SENSITIVITY`, and never read the handoff.
`TURN_ZERO_MANDATE.md:200` states _"Classification is recorded in handoff
state"_ and line 202 calls the environment variables _"environment hints"_. The
gate had inverted the hierarchy: it consulted only the hint and never the
record. Consequence — a handoff carrying a complete, valid classification
printed `unknown / unknown / unknown / unknown`, `unresolved` was permanently
true, and `writeReady` was permanently false unless a human exported four
variables by hand.

**3. That the handoff on disk can be trusted because a script wrote it.**
`SESSION_HANDOFF_LATEST.json` is a plain file in a shared checkout. Every agent
holding a file-write tool is a writer, whatever the emit path says.

## Evidence (2026-09-03, observed in session)

While this work was in progress the canonical handoff was replaced, at 12:24
local, by an 88-line file with
`handoff_id: a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d`,
`created_at: 2026-09-03T16:25:00.000Z`, and `source: "repo"`. Measured against
`tnf-session-handoff.schema.json` it was missing 14 of 18 required properties
and carried 6 properties the schema forbids (`additionalProperties: false`). No
script in the repository emits that shape and `context_refs` has never appeared
in the git history of `docs/protocols/reports/`. It was written by a model, from
imagination, over the record.

Nothing detected it. `enforce-session-handoff.cjs` is a pre-push gate scoped to
changed files and reported `OK (pre-push): no files to inspect` while the
corrupt file sat on disk. The fabricated copy is preserved outside the
repository; the record was recovered with `git checkout --` from the index.

## Replacement behavior

- `VALID.domain` accepts `core`, not `corporate` — the gate now agrees with the
  lexicon, the mandate and the schema.
- `classificationReceipt(recordedClassification)` reads the handoff's
  `classification` object first and lets a non-empty `TNF_*` variable override
  it, recording provenance per axis (`handoff` / `env` /
  `env-override(handoff=…)` / `unset`). Provenance is printed and carried in the
  JSON receipt. An override that contradicts the record raises a warning naming
  both values.
- `orientationSummary()` exposes `handoff.classification`; `main()` computes
  orientation before classification so the record is available.
- New `scripts/protocols/validate-session-handoff.cjs` validates the canonical
  handoff against its schema (required properties, `additionalProperties`,
  nested enums) plus fabrication heuristics (hand-shaped ids, non-git
  `head_sha`, clock times rounded to the minute). Deliberately self-contained —
  no `ajv`, no repo `node_modules` — because it must keep working when the
  workspace's dependencies do not, per Axiom 1 (Optimal Utility).
- The gate calls it on read. A schema-invalid handoff produces warnings and, in
  `--require-write-ready`, a blocker. Turn Zero no longer resumes from, or
  classifies out of, a record that fails its own schema.
- `FRONTLOAD_MANIFEST.md:263` worked example updated `corporate` → `core`, and
  the file was given the `[CLASS:…] [STATUS:…]` header D17 and Gate 3 require —
  it had none, despite being the Stage A rail inventory every session loads.

## Safety invariants retained

- No LOCKED document body was modified. `DIRECTIVES.md`, `TURN_ZERO_MANDATE.md`,
  `TURN_END_MANDATE.md` and `TNF_SYSTEM_LEXICON.md` are untouched; the known
  contradictions among them are recorded for a TIER 2 decision, not resolved
  here.
- The operator-facing **department** vocabulary is untouched and correct.
  `data/departments/corporate-departments.json` states departments (HR,
  Marketing, Design, Legal, Tech, Finance, Product, Ops) are _"Distinct from
  pipeline Clusters"_; the lexicon deprecates the corporate metaphor for agent
  infrastructure, not for the operator's real business lanes.
  `FRONTLOAD_MANIFEST.md:120-127` was deliberately left as written.
- Unknown classification stays explicit. Nothing defaults private material to
  public; `unresolved` still blocks write-readiness.
- The gate reports and blocks; it does not repair. It never writes the handoff.
- Existing behaviour is otherwise unchanged: the four destination, residency and
  sensitivity enums, and every safety rule in `validateClassification`, are as
  they were.

## Known consequence, deliberately not acted on

`--require-write-ready` still has no call site on the mutation path, though
`TURN_ZERO_MANDATE.md:128` names it as the machine gate and line 132 says
_"mutation may not [continue]"_ without it. Wiring it before this change would
have blocked every mutation in the repository, because classification was
permanently unresolved. That ordering constraint is now removed; wiring it
remains a separate decision.

## Authority basis

Operator instruction in session, 2026-09-03: reconcile Turn Zero V2 procedural
logic from first principles, verify alignment against the evolved protocol
corpus, then "proceed". Scope was agreed in advance as the TIER 3 half only,
with the LOCKED-document contradictions reserved for a TIER 2 decision.
