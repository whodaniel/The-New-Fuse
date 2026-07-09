# Curator Question — Rate Limit Gateway Drift (2026-07-08)

`[CLASS:INTEL] [STATUS:RESOLVED] [DOC_TYPE:CURATOR_QUESTION] [VISIBILITY:COLLECTIVE] [OWNER:TNF]`

## Resolution (2026-07-09)

**Option (a) applied:** `Rate Limit Gateway` anchored in
`TNF_GOVERNANCE_TENETS.md` §3.B with Gate 5 `challenge_rationale` recorded in
§3.C audit trail. All 13 tenets in `DIRECTIVES.md` §3 now trace to governance
sources.

## Discovery context

The `tnf-directives` skill (`.agent/skills/tnf-directives/SKILL.md`) was audited
today via a 5-pass Prometheus scan executed by a delegated validator subagent.
The Direct Tenets scan (Pass 2) cross-referenced all 13 tenets listed in
`docs/protocols/DIRECTIVES.md` §3 against the canonical
`docs/protocols/TNF_GOVERNANCE_TENETS.md` §2-6.

## Finding (PASS_WITH_FLAG)

12 of 13 tenets trace back to a clearly-cited section in
`TNF_GOVERNANCE_TENETS.md`:

| Tenet (canonical DIRECTIVES.md §3) | Line | Governance source section |
| ---------------------------------- | ---- | ------------------------- |
| Anti-Lobotomy                      | 70   | §6                        |
| 50-Step Loop Breaker               | 71   | §2A                       |
| Budget Sentinel                    | 72   | §2A                       |
| GPU Thermal Gating                 | 73   | §2A                       |
| Disposable Runtimes                | 74   | §2B                       |
| Lateral Lock                       | 75   | §2B                       |
| Synthetics Labeling                | 76   | §3A                       |
| Visual Integrity Gate              | 77   | §3A                       |
| Merkle Tree Consistency            | 78   | §5                        |
| Attribution Overrule               | 79   | §1                        |
| High-Risk HITL                     | 80   | §3B                       |
| Journaling requirement             | 82   | §5                        |

**No-match item:** `Rate Limit Gateway` (DIRECTIVES.md §3 line 81).

The verifier scanned `TNF_GOVERNANCE_TENETS.md` §1-6 in full and found no entry
corresponding to a per-agent rate-limit cap or burst-limit, even though the
broader Governance Synthesis (`TNF_GOVERNANCE_SYNTHESIS_v2.0.md` §8
Authentication & Access Control matrix, "Rate Limiting" row) does.

## Why this matters

D16 (Document Vetting — Five Gates) requires every governed unit pass Gate 4
(Linkage & Attribution) and Gate 5 (Challenge & Verify). A tenet listed at
`[CLASS:PRIME]` with no source-of-truth anchor cannot satisfy that gate.

## Curator question (single, decisive)

Should **`Rate Limit Gateway`** be:

- (a) **Anchored** — patch `TNF_GOVERNANCE_TENETS.md` §2-6 to add an explicit
  "Per-agent rate-limit gateway" subsection with citation to
  `TNF_GOVERNANCE_SYNTHESIS_v2.0.md` §8 (the row already exists in the
  synthesis). Fastest, lowest risk.

- (b) **Demoted** — remove `Rate Limit Gateway` from `DIRECTIVES.md` §3 L81
  because it lives in the synthesis (already class PRIME/LOCKED) and does not
  need to be reasserted at tenets level. Also clean.

- (c) **Other** — take a path not listed above; document reasoning.

`challenge_rationale` (the substantive one) is: the synthesis matrix is the
heavier normative surface; the tenets file is the safety-rule posture. Both are
`[CLASS:PRIME]`. Either anchor it once more, or trust the synthesis to cover it.
Under the **Apollo-Specator decision prefs** ("fix the class, not the site"),
option (a) is the class fix; option (b) is the local fix. **Recommendation:
(a).**

## Required for resolution

- Curator agent must record the chosen option + challenge_rationale in
  `LIVING_STATE.md` active steps.
- If (a): add to `TNF_GOVERNANCE_TENETS.md` with `[CLASS:PRIME]` tag, then
  re-run the `tnf-directives` skill to re-derive `DIRECTIVES.md` and
  `LIVING_DIRECTIVES_CARD.md` (existing skill §100 — "New protocol added…
  re-derive").
- If (b): patch `DIRECTIVES.md` §3 L81 to remove or relink and re-derive.

Either way, this file (`CURATOR_QUESTION_RATE_LIMIT_GATEWAY_2026-07-08.md`)
should be moved to `docs/protocols/reports/_archive/` after resolution with the
decision recorded.

---

## Provenance (resource_pointer)

- **Verifier:** subagent `deleg_138473bd` (5-pass Prometheus scan, dispatched
  2026-07-08T22:39:22Z).
- **Verifier transcript:**
  `/Users/danielgoldberg/.hermes/cache/delegation/subagent-summary-0-20260708_224703_480012.txt`
  (lines 23-65 of the file are the canonical output JSON).
- **Filed by:** current session (TNF cooperative audit; post-session, before
  Turn End).
- **Related PCIDs:** none yet — will be assigned when a director picks this up.
