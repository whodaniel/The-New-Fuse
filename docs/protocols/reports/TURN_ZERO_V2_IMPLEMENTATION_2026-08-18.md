# Turn Zero V2 Implementation & Cross-Codebase Audit

**Date:** 2026-08-18  
**Historical implementation branch:** `protocol/turn-zero-v2-context-capability`  
**Canonical repository:** `whodaniel/tnf-monorepo`  
**Current status:** **MERGED; public-boundary correction merged; canonical downstream publication still requires `sync:repos`.**

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

Handoff records:
- actual repository plus canonical TNF repository relationship;
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
- local repository identity.

Private/internal freshness probes must degrade as `INTERNAL_UNAVAILABLE` where appropriate in public OSS contexts rather than making legitimate public clones fail orientation.

### Frontload

Removed mandatory dependency on generated `apps/frontend/src/data/codebase_map.json`; current product/repo maps plus exact task paths are now authoritative hydration sources.

### Host verification

Adaptable-host verification resolves capabilities to currently enlisted providers and removes universal host-specific trajectory assumptions.

### Governance gate

Added immutable challenge-event files under `docs/protocols/challenge-rationales/` and extended the locked-document validator to protect Turn End as well as Turn Zero/Directives.

## Canonical merge receipts

### Core V2

Merged to canonical `main` as:

`732050a0f2229450fc55e7ccc07ec7d0f783797f`  
`feat(protocol): Turn Zero V2 context and capability stack`

### Public-boundary correction

Cross-codebase review exposed that the first repository-identity rule was too absolute for legitimate OSS clones/forks. The correction distinguishes canonical internal development, owned downstream publication targets, and external/public forks while preserving the protection against developing directly in TNF's owned publication repos.

Merged as:

`c993a2c42153cda9ab1d807bad6cb2fed05ed2c4`  
`fix(protocol): make Turn Zero V2 public-boundary safe`

This is an important architecture example: contradiction across a valid context improved the relational model rather than weakening the safety property.

## Cross-codebase implications

### `scripts/tnf-onboard.cjs`

Retained as a legacy/deep-diagnostics implementation because it contains substantial environment/runtime diagnostics. Its older prose is no longer the default onboarding surface. Future cleanup can remove superseded work-plane/named-fleet wording after V2 has operated successfully for a validation period.

### Handoff consumers

Consumers that hard-code spec `0.1` may require migration. The V2 wrapper deliberately begins from the legacy payload and adds fields so semantic compatibility is retained where possible, but strict-schema consumers should be updated to `0.2`.

### Publication

These protocol/runtime changes are OSS-shaped and should flow to `The-New-Fuse` only through the canonical repository-separation machinery.

A manually constructed `sync/open-runtime` preview PR was created during the publication investigation. Review determined that an API-constructed export could be semantically correct while byte-divergent from `scripts/sync-repos.sh`. Public PR #148 was therefore **closed without merge** on 2026-08-18 and must not be treated as a `sync:repos` receipt.

No new proprietary implementation was introduced by Turn Zero V2; `fuse-control-plane` should receive only what the normal sync tool classifies/extracts.

### Satellites

No satellite source change is required. Satellite sessions should consume the updated product-repository map and use their own repo identity after the canonical classification step routes work there.

### Personal/client workflows

The revision allows personal/client work to improve TNF **only through sanitized generalized mechanisms**. Raw benefits, health, legal, financial, client, tenant, relationship, and similar private artifacts remain outside product source.

## Verification status

The original required verification plan was:

```bash
node --test scripts/protocols/turn-zero-v2-gate.test.cjs
node --test scripts/protocols/state-freshness-gate.test.cjs
node scripts/protocols/validate-locked-doc-ledger.cjs --mode=ci --base=origin/main
node scripts/verify-repo-frontload.cjs
pnpm run sync:repos:dry-run
```

The coordinating GitHub session observed no PR-triggered workflow-run receipts for the private implementation PR and did not have shell/workflow-dispatch access to execute the canonical workstation commands. Therefore this report does **not** retroactively claim those commands passed merely because the PRs merged.

The missing receipt that matters most before public publication is the canonical:

`pnpm run sync:repos:dry-run`

followed by the real repository-separation sync.

## Broader doctrine established after implementation

The same-day architectural synthesis generalized Turn Zero V2 into a larger TNF concept: **coherent proof-bearing state continuity**.

See:

- `docs/protocols/TNF_COHERENT_STATE_CONTINUITY.md`
- `docs/protocols/reports/CONTEXTUAL_EVOLUTION_LOG_2026-08-18.md`
- `docs/protocols/reports/MULTI_AGENT_CONVERGENCE_2026-08-18.md`

The persistent kernel is:

**Intent → Authority → Context → Capability → Boundary → Action → Receipt → Handoff**

and canonical state should be backed by provenance/freshness/receipts rather than naked assertions.

## Current follow-up

1. Obtain closeout packets from the concurrently active agents before their sessions are terminated.
2. Reconcile shared-index ownership, maintenance-agent local commits, system-process registry state, and the reported Subscribe feature.
3. Run real interactive `pnpm run tnf:onboard` on the operator workstation.
4. Run a classified write-ready session.
5. Run `turn-end-v2.cjs` and validate handoff `0.2` in the real workstation context.
6. Run `pnpm run sync:repos:dry-run`.
7. Publish only via the canonical repo-separation sync.
8. After convergence, rank the next work by impact, dependency, risk reduction, and execution cost rather than continuing all discovered threads simultaneously.
