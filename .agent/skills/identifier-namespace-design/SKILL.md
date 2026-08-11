---
name: identifier-namespace-design
description:
  How to size an identifier space, keep provisional and authoritative IDs from
  being confused, and resolve name collisions deterministically by precedence.
  Includes the birthday-bound sizing check that catches collisions before they
  reach production.
primary_type: diagnostic
category: engineering/patterns
risk_tier: high
harmful_pattern_detection: true
harmful_pattern_signals:
  - undersized-hash-id-space
  - provisional-id-masquerading-as-authoritative
  - undefined-resolution-among-duplicate-names
  - shared-prefix-across-distinct-namespaces
---

# Identifier Namespace Design

From auditing TNF's federated ID schemes on 2026-08-09, which had a live routing
defect nobody had noticed.

## Size the space by the birthday bound, not by intuition

TNF minted browser-side agent IDs as `5000 + (hash % 10000)` — 10,000 values.
That feels roomy next to ~200 agents. It is not.

Expected collisions ≈ **n² / 2N**. At n=194, N=10,000: ~1.9 expected, and
P(at least one) ≈ 90%. Measured against the real roster: **two collisions**.

```
ID#:4gV  <-  brand-outreach-agent || temporal-agent-reclassifier
ID#:3Ub  <-  interoperability-protocol-agent || research-agent
```

Because message routing parsed `@ID#:…`, each was an **ambiguous address**, not
a cosmetic clash.

Rules of thumb:

- For collision probability ≤ 1e-6 at n items, you need **N ≳ n² / 2e-6**. At
  n=200 that is ~2e10 — so a 32-bit space is the floor, not the ceiling.
- Sizing must anticipate growth. Collisions scale quadratically, so a space that
  is comfortable at 200 fails at 2,000. Re-measure per order of magnitude.
- **Always test against the real population**, not a synthetic one. Hash every
  actual name and count distinct outputs. It is a five-line script and it is the
  difference between a theory and a finding.

## Keep provisional IDs distinguishable from authoritative ones

The deeper bug was not the space size — it was that a *hashed local placeholder*
was indistinguishable from a *sequential registry-assigned identifier*. Both
rendered as `ID#:<Base58>`.

The spec named exactly one source of truth (`FederatedIdentityService`,
allocating via Redis `INCR`). A browser content script cannot reach Redis, so it
hashed instead — a reasonable fallback that silently became a second minting
authority.

When an edge cannot reach the allocator:

- **Document the fallback as provisional**, and make the authoritative value
  always win. Never overwrite a server-assigned ID with a locally computed one.
- Prefer a **distinguishable form** (separate prefix or marker) so a provisional
  value can never be mistaken for a registered one. If the format is already
  load-bearing in parsers, widen the space and document the invariant instead —
  changing the prefix breaks every consumer that matches on it.
- If the same value is computed in several runtimes, **say so in each copy**.
  Three mirrors of TNF's hash carry an explicit "must match X and Y exactly"
  comment; a silent divergence yields a different ID on the browser edge than
  the relay computes for the same agent.

## Distinct namespaces need distinct prefixes

TNF once used `ID#:` for both federated agent identity (a sequential int) and
the intelligence indexer (hash bytes). Same prefix, different encodings — a
documented "do not confuse these" warning, which is a design smell. The fix was
a migration to `VEC#:` for the indexer, making the prefixes disjoint.

A warning in a doc is not a namespace boundary. If two things must never be
confused, encode the distinction in the identifier.

## Resolve duplicate names by declared precedence

When one name legitimately exists in several roots — vendored copies, curated
packs, project-local overrides — the question is not "which do we delete" but
"which wins."

TNF had 50 skill names with disagreeing content across permanent roots. They
were not accidental duplicates: they were the **same skill vendored into
different roots** (`anthropic/`, `antigravity/`, a flattened distribution root).
Already namespaced by directory, but the `name:` field carried no namespace, so
they collided at resolution time with nothing deciding the winner.

Declaring a precedence order fixed it without editing 50 files or renaming
anything:

```
project-authored  >  curated  >  vendored  >  foreign runtime  >  snapshots
```

Then publish, per name, the path it **resolves to**. Deterministic resolution
plus a visible winner beats deduplication: the variants stay available, and the
ambiguity is gone.

Before deduplicating anything, ask whether the copies are *redundant* or
*variant*. Deleting a vendor variant loses content; declaring precedence does
not.

## Triage before counting

A raw divergence count conflates defects with expected drift. TNF's 72 "diverged
skills" split into 50 real conflicts, 21 stale snapshots awaiting a promotion
sweep, and 0 snapshot-only. Only the first group is actionable.

Hash the **body**, not the whole file — frontmatter legitimately differs per root
(a promoted copy gains `category`, `risk_tier`), and counting that as content
divergence reports conflicts that are actually correct promotions.

See also [[reconciling-layered-specs]], [[auditing-large-corpora]].
