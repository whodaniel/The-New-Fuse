[CLASS:REPORT] [STATUS:ACTIVE] [DOC_TYPE:audit] [DOMAIN:orchestration]

# TNF Assimilation ↔ Agent Resource Fabric Reconciliation — 2026-08-22

## Scope

Audit the pre-existing TNF `assimilate` command/service/skills against the newly merged Agent Resource Fabric (#167) and eliminate overlap, dead pointers, and duplicate-authority risks.

Canonical base inspected: `whodaniel/tnf-monorepo` `main` @ `93174816c069daf8803562ae866d8673e532c4b0`.

Tracked implementation: issue #172, branch `feat/assimilation-resource-convergence-20260822`.

## Findings

### Existing assimilation is real and should be extended, not replaced

`packages/tnf-cli/src/commands/assimilate.ts` and `packages/tnf-cli/src/services/AssimilationService.ts` implement `tnf assimilate run|link|scan`.

`.agent/skills/tnf-parody-assimilate-cycle/SKILL.md` defines the core semantic loop:

1. inventory distinctive external capability;
2. inventory current TNF coverage;
3. build a gap matrix;
4. extend existing TNF silos before creating new ones;
5. verify the assimilated capability.

Its explicit guardrail — **never invent a parallel registry** — is controlling for this reconciliation.

### Dead/stale seams found

1. `AssimilationService.linkProvider()` only printed “Linked” and contained a TODO to create `.agent/assimilation-routes.json`.
2. `.agent/assimilation-routes.json` does not exist on current canonical `main`.
3. `data/harness/harness-config.json` nevertheless still cites that absent file as provider-routing evidence.
4. `tnf assimilate scan` imports `scripts/protocols/tnf-self-evolution-flywheel.cjs`.
5. That self-evolution flywheel path is absent on current canonical `main`, so the scan command is stale/broken.
6. `assimilate.ts` refers to a skill called `assimilation-tenet`; the actual current skill is `tnf-parody-assimilate-cycle`.
7. `tnf-skill-ubiquity-propagation` describes a broad multi-runtime copy/symlink topology that now overlaps the more general Agent Resource Fabric.
8. Successful assimilated provider executions appended operational invocation lines directly to tracked `docs/protocols/AGENT_STATUS_LEDGER.md`, creating unnecessary working-tree mutation for normal runtime activity.

## Reconciled architecture

### Assimilation plane

**Purpose:** decide what distinctive external capability TNF should retain, prove the gap, and codify it TNF-native.

Authority: `.agent/skills/tnf-parody-assimilate-cycle/SKILL.md` plus current TNF code/protocol state.

### Agent Resource Fabric

**Purpose:** content identity, provenance, dedupe, machine-local storage, verified redirect/rollback, and later safe reclamation for eligible reusable read-mostly artifacts.

Authority: `TNF_AGENT_RESOURCE_CONVERGENCE_PROTOCOL` + `data/harness/agent-resource-fabric.json`.

Resource Fabric does **not** decide whether an external capability deserves assimilation merely because files hash the same.

### Skill ubiquity

**Purpose:** compatibility-edge propagation so retained TNF skills can be reached by runtimes whose native discovery paths differ.

It is no longer treated as a second resource authority. Broad per-runtime copy/symlink loops are legacy compatibility techniques; host-specific verified adapters and the shared Resource Fabric are the target state.

### Provider/host routing

Provider execution stays under current provider/host authorities, principally `data/harness/provider-failover-policy.json` and host frontload/adapters. No new canonical `.agent/assimilation-routes.json` is introduced.

`tnf assimilate link` now means **verify and receipt** the installed provider against existing authorities, not silently create a second provider registry.

### Memory, user context, secrets

- stateful histories/trajectories/memory → memory/compaction/freshness;
- user-owned durable context → user-context storage mandate (#151/#153 workstream);
- secrets/credentials → machine-private credential boundary;
- reusable static resources → Agent Resource Fabric only after semantic classification.

## Canonical flow

`DISCOVER/PARODY → GAP MATRIX → ASSIMILATE TNF-NATIVE → CLASSIFY RETAINED OUTPUT → {RESOURCE FABRIC | PROVIDER/HOST ADAPTER | MEMORY/COMPACTION | USER-CONTEXT STORAGE | SECRET BOUNDARY} → VERIFY → PROPAGATE → RECEIPT`

## Implementation in #172 branch

- new `scripts/harness/assimilation-scan.cjs` composes current provider policy, skill topology, and Resource Fabric;
- new focused `assimilation-scan.test.cjs`;
- `tnf assimilate scan` routes to the current composition instead of the missing flywheel;
- `tnf assimilate link` verifies existing authorities and writes machine-local proof only;
- assimilated provider runs write machine-local receipts/ledger instead of dirtying tracked `AGENT_STATUS_LEDGER.md` on every invocation;
- provider executable names are constrained before shell-based PATH lookup;
- protocol gate uses current Turn Zero V2 gate;
- parody/assimilate skill explicitly classifies retained outputs into current TNF planes;
- skill-ubiquity skill is reframed as a Resource Fabric compatibility adapter;
- Agent Resource Convergence protocol now defines the assimilation relationship;
- onboarding contract contains an explicit assimilation/self-evolution task route.

## Verification

Executed before branch upload for the new scan engine fixture:

- `node --check assimilation-scan.cjs` — PASS.
- `node --test assimilation-scan.test.cjs` — **2/2 PASS**.

Repository-wide TNF CLI build/typecheck is not claimed from this ChatGPT environment. It must be run from a complete canonical checkout before merge or by an authorized local agent. The branch should remain review-gated until that check is available or the TypeScript diff is otherwise verified.

## Follow-through

- Update `data/harness/harness-config.json` to remove dead `.agent/assimilation-routes.json` evidence and add the Agent Resource Fabric/assimilation composition (issue #171).
- Complete ZCode canonical frontload assimilation independently under #170; use #168 for its Resource Fabric surfaces.
- Rebase/finish the host metadata-census branch after this convergence model lands so its classifications use the same semantic routing.
- Update shared Drive Agent Coordination and Engineering Context after the merge receipt is known.
- Do not touch the active `packages/workflow-builder` ownership boundary.
