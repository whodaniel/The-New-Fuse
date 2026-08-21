# 🛠️ TNF Document Vetting & Gating Procedure

`[CLASS:PRIME] [STATUS:LOCKED] [DOC_TYPE:PROTOCOL_STANDARD] [VISIBILITY:COLLECTIVE]`

**Status:** ACTIVE  
**Scope:** Departmental ingestion, governance mutations, and handoffs  
**Location:** `docs/protocols/`

This procedure defines the gates information and authority-bearing documents pass before they are accepted into TNF. It enforces the **Challenging Prior Assumptions** protocol without turning the audit trail into an ever-growing file that must be rewritten for every change.

---

## 1. Gating Sequence

### Gate 1 — Definition & Class Validation

- The unit must match a defined class in the TNF system lexicon.
- Ask why the unit exists and whether its structure remains useful.
- Reject or refactor units that have no clear purpose.

### Gate 2 — Library & Namespace Assignment

- Assign the unit to the correct architecture, protocol, intelligence, product, or other namespace.
- Check whether an existing unit already owns the concern.
- Prefer explicit linkage over duplicate authority.

### Gate 3 — Flag Integrity

Authority and long-lived protocol documents must carry the required header metadata, including `[CLASS:X] [STATUS:Y]` where applicable.

### Gate 4 — Linkage & Attribution

- Preserve verifiable source pointers, timestamps, parent project IDs, or requirement documents.
- Code/procedure changes must link to the requirement or protocol they implement when the relationship is not obvious.

### Gate 5 — Challenge & Verify

Any body mutation or proposed replacement of a protected/locked governance document requires a **fresh, verified `challenge_rationale`**.

A rationale must state:

1. the protected file being changed;
2. the specific assumption or failure being challenged;
3. the replacement behavior;
4. safety invariants retained;
5. who/what authorized the change;
6. where relevant, the target document hash or other immutable receipt.

If the replacement relies on experimental architecture, record a verifiable baseline comparison or explain why the comparison is structural rather than performance-based.

### Challenge-event storage

Historical rationale remains in:

- `docs/protocols/CHALLENGE_RATIONALE_LOG.md`

New rationale should normally be recorded as one **immutable event file** under:

- `docs/protocols/challenge-rationales/YYYY-MM-DD-<slug>.md`

This avoids rewriting a large monolithic ledger for every governance mutation while preserving an append-only audit trail. A challenge-event file is never silently edited or deleted after it has landed. Corrections are made by a new event that supersedes or clarifies the earlier event.

Mechanical enforcement lives in:

- `scripts/protocols/validate-locked-doc-ledger.cjs`

The validator accepts a fresh legacy-ledger entry for compatibility, but V2 governance changes should prefer immutable event files.

---

## 2. Regular Effectiveness Vetting

The vetting procedure itself must be reviewed periodically.

1. **Efficiency audit:** Are gates adding measurable integrity or merely latency?
2. **Relevance check:** Have classes/namespaces become obsolete?
3. **Assumption challenge:** Identify a small simplification that preserves or improves integrity.
4. **Privacy check:** Are private facts being propagated when only a generalized pattern is needed?

---

## 3. Assumption Challenge Protocol

When a pending or challenged unit is processed, ask:

- Is there a simpler, zero- or low-cost way to represent this?
- Does it align with the current TNF product/repository boundary?
- Is it authority, implementation, evidence, or merely a receipt?
- Can the reusable lesson be generalized without carrying private context?

Record material findings in the appropriate challenge event, directive, status ledger, issue, or implementation report.

---

## 4. Deprecated-Fact Archiving

When a locked rule is successfully challenged and replaced:

- preserve the old state in git history;
- record the reason for replacement in the challenge event;
- move only genuinely useful historical context into an explicit History/Archive section when that improves comprehension;
- never silently rewrite history to make the old rule appear never to have existed.

Git history plus immutable challenge events are the primary audit trail. Duplicating every superseded paragraph into active authority is not required when doing so would increase frontload without improving recoverability.

---

## 5. Turn Zero / Turn End Special Rule

`TURN_ZERO_MANDATE.md` and `TURN_END_MANDATE.md` are a paired lifecycle contract. A material change to either must be evaluated for implications to:

- onboarding/frontload;
- session handoff schema/generation;
- state freshness;
- repository/product classification;
- capability staffing;
- privacy/data residency;
- downstream publication.

The validator protects both documents so one side cannot drift independently.
