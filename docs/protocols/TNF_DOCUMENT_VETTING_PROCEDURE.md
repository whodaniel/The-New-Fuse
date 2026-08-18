# 🛠️ TNF Document Vetting & Gating Procedure

`[CLASS:PRIME] [STATUS:LOCKED] [DOC_TYPE:PROTOCOL_STANDARD] [VISIBILITY:COLLECTIVE]`

**Status:** ACTIVE

## Gate 1 — Definition & Class Validation
Validate purpose and current usefulness.

## Gate 2 — Library & Namespace Assignment
Assign the correct architecture/protocol/product namespace and avoid duplicate authority.

## Gate 3 — Flag Integrity
Authority documents must carry required metadata.

## Gate 4 — Linkage & Attribution
Preserve source pointers, timestamps, parent project IDs, or requirement documents.

## Gate 5 — Challenge & Verify
Any body mutation of a protected/locked governance document requires a fresh verified `challenge_rationale` stating the file, challenged assumption/failure, replacement behavior, retained safety invariants, and authorization.

Historical rationale remains in `docs/protocols/CHALLENGE_RATIONALE_LOG.md`. New rationale should normally be one immutable event under `docs/protocols/challenge-rationales/YYYY-MM-DD-<slug>.md`. Event files are never silently edited/deleted; corrections are new events.

Mechanical enforcement: `scripts/protocols/validate-locked-doc-ledger.cjs`.

## Regular effectiveness vetting
Review efficiency, relevance, assumptions, and privacy. Ask whether a generalized improvement can be preserved without carrying private context.

## Deprecated facts
Preserve old states in git history and challenge events. Do not rewrite history to make superseded rules appear never to have existed.

## Turn Zero / Turn End special rule
`TURN_ZERO_MANDATE.md` and `TURN_END_MANDATE.md` are a paired lifecycle contract. Material changes must check onboarding/frontload, handoff schema/generation, freshness, repository/product classification, capability staffing, privacy/data residency, and downstream publication.
