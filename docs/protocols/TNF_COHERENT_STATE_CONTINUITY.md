# TNF Coherent State Continuity — Public Interoperability Projection

`[CLASS:PUBLIC_CONTRACT] [STATUS:ACTIVE_CANDIDATE] [DOC_TYPE:INTEROPERABILITY_DOCTRINE] [VISIBILITY:PUBLIC]`

**Established:** 2026-08-18  
**Public projection revised:** 2026-08-25

## Purpose

Define the continuity properties a TNF-compatible public runtime or integration should preserve across delegated actions without publishing the private hosted orchestration algorithms used to rank context, resolve authority, score routes, synthesize policy, reason over business state, or evolve the internal semantic graph.

For the public compatibility surface, see `TNF_INTEROPERABILITY_KERNEL.md`.

## Public continuity requirements

TNF-compatible implementations should preserve, where applicable:

- a bounded **intent** or requested outcome;
- explicit **authority scope** distinct from capability;
- scoped **context** appropriate to the interaction;
- required **capability** declarations;
- relevant **boundaries** on data and mutation;
- a bounded **action**;
- a **receipt** or evidence record for consequential outcomes;
- sufficient **handoff** information for authorized continuation.

### Capability is not authority

```text
actor.capabilities != actor.authority_scope
```

Ability to perform an operation does not itself authorize the operation.

## Evidence states

Public TNF contracts distinguish at least:

- `verified`
- `reported`
- `inferred`
- `unknown`

Implementations should not promote reported or inferred state to verified without current evidence appropriate to the claim.

## Freshness

Existence is not freshness. Volatile state should carry or derive an observation time/freshness signal when consequential decisions depend on it.

## Handoff

A public handoff may include completed/pending/blocked work, current receipts, and next actions. A transcript alone is not required to serve as authoritative continuation state.

## Provider independence

Named models, agents, repositories, CI services, transports, and vendors are implementation participants. Public interoperability should not require a particular provider when an equivalent contract can be satisfied by another implementation.

## Private hosted intelligence is out of scope

The public runtime is not entitled to the implementation details used by the hosted TNF control plane for:

- relational graph construction/inference;
- reachability/path scoring;
- evidence weighting/promotion;
- authority/trust synthesis;
- context-selection/ranking;
- provider staffing optimization;
- business/value causality;
- counterfactual architecture search;
- recursive contradiction/evolution machinery.

Those capabilities may be exposed through public contracts or receipts without publishing the decision procedure.

## Historical note

A fuller working architecture doctrine was previously published in the open repository. The current public document intentionally narrows future publication to the interoperability surface while preserving compatibility. Public history is not rewritten by this change.
