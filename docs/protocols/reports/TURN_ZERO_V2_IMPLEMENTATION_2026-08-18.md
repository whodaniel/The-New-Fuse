# Turn Zero V2 Implementation & Cross-Codebase Audit

**Date:** 2026-08-18  
**Canonical repository:** `whodaniel/tnf-monorepo`

## Result
Turn Zero V2 replaces eager frontload and stale work-plane/named-agent assumptions with a progressive, repository-aware, capability-first lifecycle.

## Implemented
- repository identity Gate 0;
- three-axis classification;
- task-scoped hydration;
- capability staffing;
- privacy-preserving assimilation;
- nonblocking interactive onboarding;
- handoff spec `tnf/session-handoff/0.2`;
- expanded state freshness;
- immutable governance challenge events;
- controlled publication boundary.

## Public-boundary follow-up
Before publication, cross-codebase review found that public OSS clones cannot access private monorepo/control-plane probes and must not falsely identify themselves as the private canonical repository. V2 therefore distinguishes canonical internal development, owned downstream publication targets, and external/fork repositories. Private freshness domains degrade to `INTERNAL_UNAVAILABLE` for OSS users instead of producing false failures.

## Legacy implication
`scripts/tnf-onboard.cjs` remains available as opt-in deep diagnostics (`--legacy-full`) while V2 gains operational soak time. Direct legacy `turn-end.cjs` callers should migrate to `turn-end-v2.cjs`.

## Publication classification
This revision is OSS/public-contract shaped. No proprietary implementation path changed; the private control-plane extract has no direct source delta from this protocol work.
