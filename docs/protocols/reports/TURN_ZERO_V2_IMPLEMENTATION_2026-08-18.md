# Turn Zero V2 Implementation & Cross-Codebase Audit

**Date:** 2026-08-18  
**Branch:** `protocol/turn-zero-v2-context-capability`  
**Canonical repository:** `whodaniel/tnf-monorepo`

## Operator directive

The operator explicitly approved the Turn Zero revision and directed that the observations/plans be documented in the actual TNF repository, fully implemented, committed, pushed, propagated to applicable publication areas, and checked for broader codebase implications.

## Problem statement

Turn Zero's original philosophy remains valuable, but several implementation assumptions drifted behind TNF's current architecture:

1. canonical development moved to `whodaniel/tnf-monorepo` while `The-New-Fuse` and `fuse-control-plane` became publication targets;
2. product placement evolved from a three-plane model to explicit OSS runtime / public contract / private control plane / satellite / external classifications;
3. harness staffing evolved from named-agent dependence to capability-first staffing;
4. generated codebase trackers were intentionally removed from tracked source, making fixed `codebase_map.json` ingestion a stale startup dependency;
5. member/personal data doctrine requires durable private material to remain external while TNF holds bounded working state/references;
6. state freshness monitored public publication state more strongly than canonical development/product-boundary state;
7. ASSIMILATE_CHECK hard-coded a Hermes trajectory path despite adaptable-host doctrine;
8. Turn End handoff `0.1` lacked repository/classification/capability/publication/freshness context.

## Implemented changes

### Turn Zero V2

`docs/protocols/TURN_ZERO_MANDATE.md`

Lifecycle:

`RESPOND -> ORIENT -> CLASSIFY -> HYDRATE -> STAFF -> ACT -> VERIFY -> PROPAGATE -> HANDOFF`

Key changes:
- repository identity Gate 0;
- three-axis classification;
- task-scoped hydration;
- capability staffing;
- privacy-preserving assimilation;
- nonblocking interactive mode;
- controlled downstream publication.

### Runtime write-readiness gate

`scripts/protocols/turn-zero-v2-gate.cjs`

Checks:
- normalized git origin;
- branch/HEAD/dirty state;
- merge/rebase/cherry-pick/revert state;
- classification validity;
- privacy/destination conflicts;
- task-scoped hydration suggestions;
- state-freshness frontload.

### Onboarding

`scripts/tnf-onboard-twip.cjs`

Turn Zero V2 is now the default compact onboarding path. The large historical onboarder is retained as opt-in `--legacy-full` diagnostics instead of blocking every interactive start.

### Turn End V2

`docs/protocols/TURN_END_MANDATE.md` and `scripts/turn-end-v2.cjs`

Handoff now records:
- canonical repository context;
- classification;
- required/staffed capabilities;
- publication impact;
- freshness receipts.

### Handoff schema

`docs/protocols/schemas/tnf-session-handoff.schema.json`

Upgraded to `tnf/session-handoff/0.2`.

### State freshness

Expanded to include:
- canonical private development main;
- public runtime main;
- private control-plane publication main;
- product-repo map;
- OSS/satellite app boundary;
- local canonical repo identity.

### Frontload

Removed mandatory dependency on generated `apps/frontend/src/data/codebase_map.json`; current product/repo maps plus exact task paths are now authoritative hydration sources.

### Host verification

Adaptable-host verification now resolves capabilities to currently enlisted providers and removes universal host-specific trajectory assumptions.

### Governance gate

Added immutable challenge-event files under `docs/protocols/challenge-rationales/` and extended the locked-document validator to protect Turn End as well as Turn Zero/Directives.

## Cross-codebase implications

### `scripts/tnf-onboard.cjs`

Retained as a legacy/deep-diagnostics implementation because it contains substantial environment/runtime diagnostics. Its older prose is no longer the default onboarding surface. Future cleanup can remove superseded work-plane/named-fleet wording after V2 has operated successfully for a full validation period.

### Handoff consumers

Consumers that hard-code spec `0.1` may require migration. The V2 wrapper deliberately starts from the legacy handoff payload and adds fields so semantic compatibility is retained where possible, but strict-schema consumers should be updated to `0.2`.

### Publication

These protocol/runtime changes are OSS-shaped and should flow to `The-New-Fuse` through the existing sync/open-runtime publication PR after canonical merge. No new proprietary implementation was introduced; `fuse-control-plane` should only receive whatever the normal sync tool classifies/extracts.

### Satellites

No satellite source change is required. Satellite sessions should consume the updated product-repository map and use their own repo identity after the canonical classification step routes work there.

### Personal/client workflows

The revision intentionally allows personal/client work to improve TNF **only through sanitized generalized mechanisms**. Raw benefits, health, legal, financial, client, tenant, and similar artifacts remain outside product source.

## Verification plan

Required before merge:

```bash
node --test scripts/protocols/turn-zero-v2-gate.test.cjs
node --test scripts/protocols/state-freshness-gate.test.cjs
node scripts/protocols/validate-locked-doc-ledger.cjs --mode=ci --base=origin/main
node scripts/verify-repo-frontload.cjs
pnpm run sync:repos:dry-run
```

Also inspect CI for strict schema consumers or stale frontload expectations.

## Follow-up after merge

1. Run real interactive `pnpm run tnf:onboard` on the operator workstation.
2. Run a classified `--write-ready` session.
3. Run `turn-end-v2.cjs` and validate the resulting handoff against schema 0.2.
4. Observe one full development cycle before deleting/deep-refactoring the legacy onboard diagnostics.
5. Publish via the controlled repo-separation workflow.
6. Update any downstream/session consumers that reject handoff 0.2.
