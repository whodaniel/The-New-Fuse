# TNF Protocol Matrix Convergence — 2026-08-21

`[CLASS:PRIME] [STATUS:PROPOSED] [DOC_TYPE:CONVERGENCE_REPORT] [VISIBILITY:COLLECTIVE]`

## Purpose

Record the current architectural conclusion after reconciling the Personal Operational Graph / orientation work with the pre-existing TNF lifecycle, frontload, freshness, authority, handoff, capability-staffing, privacy, and publication protocols.

This report is not a replacement protocol. It exists to prevent new architecture work from creating a parallel ontology or silently reordering concepts that live on different logical axes.

## Current conclusion

The recent Personal Operational Graph direction remains strong, but it should be positioned as a **state/evidence substrate and projection layer within the existing TNF matrix**, not as a replacement lifecycle.

The existing Turn Zero V2 lifecycle remains the temporal control loop:

`RESPOND -> ORIENT -> CLASSIFY -> HYDRATE -> STAFF -> ACT -> VERIFY -> PROPAGATE -> HANDOFF`

The proposed Personal Operational Graph should primarily support `ORIENT`, `HYDRATE`, `VERIFY`, `PROPAGATE`, and `HANDOFF`, while exposing authority/classification/cost/privacy state needed by the other phases.

## Fundamental distinction: sequence vs invariants vs substrate vs projection

TNF should not force all important concepts into one linear stack.

### 1. Semantic foundations

These describe what interactions and state *mean*:

- intent;
- authority;
- context;
- capability;
- boundary/classification;
- action;
- receipt/evidence;
- handoff/continuity;
- communication/coordination semantics where applicable.

These are ontology primitives, not a boot sequence.

### 2. Lifecycle sequence

Turn Zero / Turn End govern when work progresses:

`RESPOND -> ORIENT -> CLASSIFY -> HYDRATE -> STAFF -> ACT -> VERIFY -> PROPAGATE -> HANDOFF`

Do not replace this with `Sources -> Receipts -> Graph -> Reconciliation -> Orientation -> Interaction -> Action` as if both were competing process sequences. The latter is better understood as a data-flow / state-transformation view.

### 3. Cross-cutting invariants

These apply at multiple lifecycle stages and therefore should not be ordered as single steps:

- authority;
- provenance;
- state freshness;
- verification;
- privacy/data residency;
- cost/execution authority;
- shared-state ownership/concurrency;
- reversibility/recourse where applicable.

A system may need to check authority before staffing, before action, and again when a proposed action changes scope. Freshness may be required during orientation and again after execution. Verification is both a lifecycle stage and a quality property of claims.

### 4. Evidence/state substrate

The Personal Operational Graph is proposed here:

`source observations + TNF registries + receipts + handoffs + user-confirmed relationships -> normalized proof-bearing graph`

The graph should represent current relationships and evidence without becoming an alternative authority source. Provider/local truth remains provenance-bearing input; the graph is a reconciled TNF projection.

### 5. Reconciliation

Reconciliation compares claims/receipts and emits explicit epistemic state such as:

- verified;
- corroborated;
- stale;
- conflicting;
- missing;
- unreachable;
- unauthorized;
- inferred.

Reconciliation is a service over evidence, not a replacement for State Freshness or authority checks.

### 6. User/agent projections

`OrientationSnapshot`, desktop Now/Network/Changes/Reconcile/Ask/Act, CLI/TUI views, browser surfaces, voice, and external-agent context are projections over the same substrate.

They should never acquire independent canonical state.

### 7. Transport/provider layer

MCP, A2A, APIs, SDKs, Redis, WebSocket, GitHub, model providers, and vendor-specific agents remain adapters/capability surfaces. They do not define TNF's fundamental identity or semantics.

## Recommended long-term stack

A useful multidimensional representation is:

```text
HUMAN INTENT / LEGITIMATE AUTHORITY
          |
          v
SEMANTIC PRIMITIVES
(intent, authority, context, capability, boundary, action, receipt, handoff)
          |
          +---------------- CROSS-CUTTING INVARIANTS ----------------+
          | provenance | freshness | privacy | ownership | cost | verification |
          |
          v
TURN ZERO / TURN END LIFECYCLE
RESPOND -> ORIENT -> CLASSIFY -> HYDRATE -> STAFF -> ACT -> VERIFY -> PROPAGATE -> HANDOFF
          |
          v
PROOF-BEARING STATE SUBSTRATE
registries + receipts + handoffs + observations -> Personal Operational Graph
          |
          v
RECONCILIATION / DELTA / CONFIDENCE
          |
          v
PROJECTIONS
orientation | CLI | desktop | browser | voice | external-agent context
          |
          v
ADAPTERS / EXECUTORS / TRANSPORTS
MCP | A2A | APIs | SDKs | Redis | WS | GitHub | vendor runtimes
```

This is intentionally not a pure vertical stack: the invariants span the lifecycle and substrate.

## Rail-loading integrity finding

A concrete drift risk exists today:

- `docs/core/FRONTLOAD_MANIFEST.md` defines Stage A;
- `.agent/SYSTEM_PROMPT.md` contains its own startup file list;
- `scripts/tnf-onboard.cjs` contains `FRONTLOAD_CHECKLIST` and `FRONTLOAD_BUDGET_PROFILE` lists;
- `scripts/verify-repo-frontload.cjs` contains a separate hard-coded `REQUIRED` list and checks presence rather than actual context hydration.

This creates multiple partially overlapping representations of the fundamental rails.

### Direction

1. `FRONTLOAD_MANIFEST.md` remains the human-readable authority for progressive rail composition.
2. Consumers should derive the fundamental rail set from one machine-readable interpretation/source rather than independently duplicating it.
3. Onboard/frontload should actually read the required Stage A files and emit a content-addressed hydration receipt.
4. Receipt should include manifest hash, rail hashes, repo origin/branch/HEAD, timestamps, and consumer/runtime identity.
5. Turn Zero write readiness should verify the hydration receipt where applicable.
6. Context compaction/provider substitution/repository movement invalidates unprovable hydration and triggers minimum re-hydration.
7. Existing State Freshness continues to govern volatile external/runtime observations; rail hydration governs whether protocol authority content was actually loaded.

## Relationship to the Personal Operational Graph work

Issues #139/#142 and PR #140 should not introduce duplicate authority/freshness/provenance vocabularies where existing TNF contracts already provide them.

Before #140 becomes stable, map each proposed field/enumeration against:

- Turn Zero V2 three-axis classification;
- State Freshness mandate/registry states;
- authority integration surfaces;
- existing handoff V2 fields;
- cross-agent capability/activity ledger;
- harness permission/confirmation controls;
- existing UFTE/entity identity semantics where relevant;
- existing rubric/Gauntlet/intake evaluation mechanisms after their current canonical implementations are traced.

Where semantic overlap exists, prefer reuse or an explicit adapter/mapping. New vocabulary requires a documented reason.

## Immediate pathway

1. Complete protocol archaeology for rubric/Gauntlet/matrix terminology and map it into this model.
2. Implement manifest-derived Stage A hydration receipts and tests.
3. Reconcile `.agent/SYSTEM_PROMPT.md`, `tnf-onboard.cjs`, and `verify-repo-frontload.cjs` so none own a competing fundamental rail inventory.
4. Add rail receipt summary to session handoff only if it can be done without bloating handoff state.
5. Review PR #140 against the resulting protocol map before merging.
6. Only then implement richer graph projection / desktop orientation.

## Architectural decision posture

No fundamental reorder of Turn Zero V2 is recommended at this time.

The important correction is conceptual: **do not confuse ontology, lifecycle, invariants, state substrate, projection, and transport as if they are all positions in one chain.** TNF is better modeled as a matrix of coordinated axes with a clear temporal lifecycle running through it.

That matrix structure is more extensible because new providers, interfaces, memory systems, reconciliation methods, or graph projections can evolve without destabilizing human intent, authority, evidence, or lifecycle semantics.

Related: #119 #121 #139 #140 #141 #142
