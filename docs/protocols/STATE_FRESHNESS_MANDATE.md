# TNF State Freshness Mandate — V2

**Status:** ACTIVE — 2026-08-18  
**Enforced by:** `scripts/protocols/state-freshness-gate.cjs`  
**Registry:** `docs/protocols/state-freshness.registry.json`

## Purpose

Volatile state changes independently of conversation memory. TNF must not make architectural, publication, security, or operational decisions from stale claims.

The 2026-08-14 false-catastrophe incident proved the key rule: existence of a Git object did not establish its branch position, and a confident but uncorroborated interpretation changed operator behavior.

## Rules

### R1 — Volatile facts are never asserted from memory

Remote refs, PR/CI state, branch rules, publication contents, product/repository classifications, local work-tree identity, service reachability, and similar mutable facts require a current receipt within the domain TTL.

Conversation history and compaction summaries are clue sources, not receipts.

### R2 — Canonical development state and publication state are different domains

- `whodaniel/tnf-monorepo` = canonical development source.
- `whodaniel/The-New-Fuse` = public publication state.
- `whodaniel/fuse-control-plane` = private publication/extract state.

A downstream publication SHA does not establish canonical source state. A monorepo file does not establish that it is publicly published.

### R3 — Existence is not position

Examples:

- commit object exists ≠ it is `main` tip;
- file exists locally ≠ committed/pushed/published;
- process listens ≠ service round-trip succeeds;
- app exists in a workspace ≠ it ships in the OSS download.

Each freshness domain records its specific `trap`.

### R4 — Catastrophic claims require corroboration

Irreversible loss/exposure claims require a second independent probe capable of falsifying the first interpretation. When two views disagree, state is `SPLIT`; do not select the more alarming result by default.

### R5 — Report the receipt

When the fact matters, report what was measured: source/ref, observation time/state, and relevant value.

### R6 — Correct false claims explicitly

If an earlier status statement proves wrong, correct the operator's model clearly rather than silently moving on.

## V2 domain families

The registry now tracks:

- canonical development main;
- public open-runtime main;
- private control-plane publication main;
- public PR queue/rules/proprietary leakage;
- product/repository map revision;
- OSS/satellite boundary revision;
- local canonical repository identity/work state;
- runtime service reachability.

Add domains when a mutable fact can materially alter a decision and has a known misread/failure mode.

## Turn Zero

```bash
node scripts/protocols/state-freshness-gate.cjs --frontload
```

This report never wedges an interactive session. Missing/stale means **re-probe before asserting**, not “system failure.”

## Refresh / check

```bash
node scripts/protocols/state-freshness-gate.cjs --refresh
node scripts/protocols/state-freshness-gate.cjs --check
```

Refresh after an operation that could move the state on which the next decision depends.

## After context compaction

Treat inherited volatile claims as stale for decision purposes and re-probe the domains needed by the next action.

## Verification

```bash
node --test scripts/protocols/state-freshness-gate.test.cjs
```
