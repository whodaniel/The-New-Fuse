# TNF State Freshness Mandate — V2

**Status:** ACTIVE — 2026-08-18  
**Enforced by:** `scripts/protocols/state-freshness-gate.cjs`  
**Registry:** `docs/protocols/state-freshness.registry.json`

## Purpose

Volatile state changes independently of conversation memory. TNF must not make architectural, publication, security, or operational decisions from stale claims.

## Rules

### R1 — Volatile facts are never asserted from memory
Remote refs, PR/CI state, branch rules, publication contents, product/repository classifications, local work-tree identity, service reachability, and similar mutable facts require a current receipt within the domain TTL.

### R2 — Canonical development state and publication state are different domains
- `whodaniel/tnf-monorepo` = canonical internal development source.
- `whodaniel/The-New-Fuse` = public publication state.
- `whodaniel/fuse-control-plane` = private publication/extract state.
Public OSS consumers may legitimately lack access to private domains; `INTERNAL_UNAVAILABLE` is not a framework failure.

### R3 — Existence is not position
Commit exists ≠ main tip; file exists locally ≠ pushed/published; process listens ≠ service healthy; app present ≠ included in OSS package.

### R4 — Catastrophic claims require corroboration
Irreversible loss/exposure claims require a second independent probe. Disagreement is `SPLIT`, not permission to select the most alarming result.

### R5 — Report the receipt
When a volatile fact matters, record source/ref, observation state/time, and relevant value.

### R6 — Correct false claims explicitly
If an earlier status statement proves wrong, correct the operator model clearly.

## V2 domain families

- canonical private development main when accessible;
- public open-runtime main;
- private control-plane publication main when accessible;
- public PR/rules/leakage state;
- product/repository map;
- OSS/satellite boundary;
- local repository identity/work state;
- runtime service reachability.

## Commands

```bash
node scripts/protocols/state-freshness-gate.cjs --frontload
node scripts/protocols/state-freshness-gate.cjs --refresh
node scripts/protocols/state-freshness-gate.cjs --check
```

Missing/stale means re-probe before assertion, not automatic system failure. After context compaction re-probe volatile facts needed by the next action.
