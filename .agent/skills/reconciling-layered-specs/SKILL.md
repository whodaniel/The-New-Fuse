---
name: reconciling-layered-specs
description:
  How to find the authoritative definition in a system that specifies the same
  thing in prose, JSON schema, and code at once. Covers precedence between spec
  layers, detecting name collisions between specs, and telling a real conflict
  apart from complementary scope.
primary_type: diagnostic
category: engineering/governance
risk_tier: medium
harmful_pattern_detection: false
---

# Reconciling Layered Specs

TNF specifies the same concepts at three layers: prose protocols in
`docs/protocols/*.md`, machine schemas in `docs/protocols/schemas/*.json`, and
the implementation. They drift. This is how to decide which one is right.

## Schema beats prose. Code beats a stale schema.

The load-bearing rule, learned the hard way on 2026-08-09.

`TNF_FEDERATED_TAG_SYNERGY_SPEC.md` (UFTE) described `mcid` as a *"Base58 Merkle
Entity Hash."* Reading prose as canonical, that looked authoritative — it was a
recent `[CLASS:PRIME]` spec. It was wrong. `mcid` is the **Master Cumulative
ID**: `tnf-master-cumulative-id.schema.json` requires `spec`/`id`/`scope`/
`lineage`, the code implements exactly that envelope, and Phase 9 states its
`id` is a **UUID v4**. A Base58 digest could never have been stored in it.
Merkle hashing had its own schema the whole time.

**Before treating any prose spec as canonical, check whether a schema of the
same name exists.** `ls docs/protocols/schemas/` costs one command and would
have prevented the wrong conclusion.

Precedence when layers disagree:

1. **JSON schema** — machine-checkable, usually validated in CI
2. **Implementation** — what actually runs; if it contradicts a schema, one is
   stale and you must determine which
3. **Prose protocol** — intent and rationale, most prone to drift
4. **Reports / audits** — point-in-time; check the date before trusting

Prose is still where the *why* lives. Read it for rationale, not for field
names.

## Same name ≠ same concept; different name ≠ different concept

Two failure modes, and you must distinguish them before "fixing" anything.

**Collision** — two specs use one name for different things. UFTE's `mcid`
versus MCID's `mcid`. This is a real defect: whoever reads the wrong spec builds
the wrong field. Fix by renaming the newcomer, never the established schema.

**False collision** — two specs use different names for genuinely different
subjects that merely look similar. UFTE's `federatedId`
(`tnf:entity:v2:<base58>`) versus Phase 9's `canonicalEntityId`
(`TNF:SCOPE:CATEGORY:PROVIDER:NAME:INSTANCE`) looked like competing identity
schemes. They are not: Phase 9 identifies **agents** (rows on the `agents`
table); UFTE identifies **content entities** (docs, goals, skills) that have no
such row. Merging them would have destroyed information.

The test: **name the subject each identifies, and the consumer that reads it.**
Different subject or different consumer → complementary, document the boundary.
Same subject and same consumer → collision, rename one.

## Check what a validator actually scans

A protocol's stated scope and its enforced scope are different numbers.

`TNF_DOCUMENT_TAGGING_PROTOCOL` says "every governed markdown unit" must carry
four tags. `validate-doc-tagging.cjs` scans a **hardcoded 7-file allowlist**
plus one directory — not the other 81 protocol docs. That gap is the whole
explanation for "only 12% of docs carry `[CLASS:*]`."

`TNF_ARTIFACTS_LIFECYCLE_PROTOCOL` rule 5 states the principle directly: a rule
is not in force until the script references it **and** that script runs in CI.
Apply it as a test — open the validator and read its scan roots before reporting
a compliance percentage. Otherwise you will report a corpus as non-compliant
when it was never checked.

## Register what you write

A new protocol doc that nothing links to is invisible. `PROTOCOL_MAP.md` is the
index; a doc absent from it is an orphan on arrival — which is how 85% of this
repo's docs ended up unreferenced. Add the row in the same commit.

Cross-reference in **both** directions. When a new protocol overlaps an existing
one, each must name the other and state the boundary, or the next reader finds
whichever one they searched first and never learns the other exists.

See also [[auditing-large-corpora]], [[verifying-command-success]].
