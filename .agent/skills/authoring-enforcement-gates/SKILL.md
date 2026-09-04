---
name: authoring-enforcement-gates
description:
  How to write a coherence gate that measures a doctrine-vs-code gap and that
  people will keep running. Covers choosing the property to assert, why over-
  reporting destroys a gate faster than under-reporting, judging by intent rather
  than syntax, and the four false-positive classes that show up every time.
primary_type: procedural
category: engineering/patterns
status: PROPOSED
---

# Authoring an enforcement gate that survives its own false positives

## When to use this

You have found a gap between what TNF's doctrine says and what its code does,
and you are about to write a script that fails when the gap reopens. This is the
common shape: a protocol is correct, an implementation drifted, and nothing
measures the distance.

Do not use this for a one-off audit. A gate earns its cost only if it runs
repeatedly.

## The method

**1. Assert a property, not a pattern.** "No authorization decision reads a
declared role" is a property. "The string `role ===` does not appear" is a
pattern, and it will be wrong within a week.

**2. Make the gate fail on its own drift.** `role-coherence-gate.cjs` C1 compares
its authority vocabulary against `tnf-identity.cjs` and errors if they diverge.
That check caught the gate's own list trailing a `super-admin` addition, in the
same session that added it. A gate that cannot detect its own staleness becomes
another stale authority.

**3. Judge by intent, not by syntax.** The same expression is fine or fatal
depending on what consumes it. `agents.filter(a => a.role === 'worker')` picking
a queue is correct; the identical comparison deciding what an agent may *do* is a
privilege escalation. Classify by surrounding context — an authorization-shaped
window without a sanctioned resolve call is an error; a routing-shaped window is
silent; anything else warns so a human names the intent.

**4. Grade findings by whether acting on them is safe.** Legacy identifiers that
still resolve correctly are warnings, not errors — erroring on them would revoke
live authority to satisfy a linter.

**5. Print the remedy in the finding.** Every error should carry the command or
edit that clears it.

## Why the obvious approach fails

The obvious gate greps for the bad string and reports every hit. It will be
uninstalled, because a gate that cries wolf teaches people to skip it — and then
it protects nothing at the moment it matters.

Four false-positive classes appeared while writing one gate, all found by running
it against a tree that was already correct:

| Class | Symptom | Fix |
| --- | --- | --- |
| Self-match | flagged its own constant list of forbidden values | exempt the gate from its own checks |
| Prose | flagged the sentence in a doc comment *explaining* the defect | skip comment lines |
| Wrong premise | reported `role` vs `dacc_role` as a conflict when they are different vocabularies by design | validate each against its own vocabulary, never against each other |
| Narrow window | reported correctly-guarded code because the guard sat one line outside the context window | widen the window to span a multi-line condition and the call feeding it |

The last two are the dangerous ones: they do not look like bugs, they look like
findings. **Run a new gate against code you know to be correct, and treat every
finding there as a gate defect until proven otherwise.**

## Overlap reviewed

Nearest existing skills, all ≤33% descriptor overlap:
`tnf-enforcement-change-safety` (how to change enforcement without breaking the
fleet), `tnf-harness-integrity-auditor` (auditing harness state),
`master-of-taxonomies` (classification schemes), `tnf-command-surface-gate`
(one specific gate), `tnf-self-evolution-protocol` (D27 cadence).

This is distinct: those cover changing, running, or auditing enforcement. This
covers **authoring a new gate**, and specifically the false-positive discipline
that decides whether it stays installed.

## Derived from

`scripts/protocols/role-coherence-gate.cjs` (C1–C7) and
`scripts/protocols/validate-session-handoff.cjs`, 2026-09-03. Findings went
9 errors / 15 warnings → 1 error / 6 warnings, with four of those reductions
being gate corrections rather than code fixes.
