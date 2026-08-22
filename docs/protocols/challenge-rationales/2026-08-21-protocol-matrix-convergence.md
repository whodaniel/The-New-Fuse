# Protocol Matrix Convergence Challenge Rationale — 2026-08-21

`[CLASS:PRIME] [STATUS:PROPOSED] [DOC_TYPE:CHALLENGE_RATIONALE] [VISIBILITY:COLLECTIVE]`

## Protected/authority surfaces implicated

No locked authority document is mutated by this event. This rationale is recorded prospectively because future convergence work may materially affect:

- `docs/protocols/PROTOCOL_MAP.md`
- `docs/protocols/TURN_ZERO_MANDATE.md`
- `docs/protocols/TURN_END_MANDATE.md`
- state freshness / handoff / authority / classification contracts

## Assumption challenged

The emerging Personal Operational Graph architecture and the pre-2026-08-18 six-tier protocol map can both be misread as single master linear hierarchies. That would mix semantic primitives, lifecycle phases, cross-cutting invariants, evaluation gates, machine-readable representations, transports/providers, and application projections into one ordering and risks duplicate protocol ownership.

## Replacement behavior proposed

Represent TNF as an orthogonal protocol matrix:

1. persistent semantic kernel / relational meaning;
2. Turn Zero -> Turn End execution lifecycle;
3. cross-cutting authority/freshness/provenance/classification/ownership/cost invariants;
4. scope-specific evaluation gates and rubrics;
5. proof-bearing records/contracts;
6. transports/providers/adapters;
7. materialized read models and user-facing projections.

The Personal Operational Graph is placed in the final category as a reconciled read model over proof-bearing records rather than a new source of truth.

## Safety invariants retained

- legitimate human intent remains the top-level outcome constraint;
- capability remains distinct from authority;
- Turn Zero V2 lifecycle is not silently reordered;
- classification precedes persistence/mutation;
- volatile state requires current receipts/freshness;
- verification outranks narrative;
- private context is generalized/sanitized rather than propagated;
- existing namespace ownership is preferred over duplicate authority;
- shared mutable state requires explicit ownership;
- Turn End/handoff remains part of execution;
- provider/transport identities remain non-foundational.

## Authority basis

Operator explicitly requested a full protocol refresh and instructed that new work remain cohesive with pre-existing TNF routines, even where fundamental revisions may ultimately be warranted. This event does not itself authorize bypassing protected-doc validation or other existing governance gates.

## Evidence / baseline

Structural comparison is documented in:

- `docs/protocols/reports/PROTOCOL_MATRIX_CONVERGENCE_2026-08-21.md`
- `docs/protocols/PROTOCOL_MAP.md`
- `docs/protocols/TNF_COHERENT_STATE_CONTINUITY.md`
- `docs/protocols/TURN_ZERO_MANDATE.md`
- `docs/protocols/TNF_DOCUMENT_VETTING_PROCEDURE.md`
- `data/harness/intake-forwarder-config.json`
- `scripts/autonomy/tnf_intake_forwarder.py`

The comparison is structural rather than performance-based: the objective is to eliminate overlapping semantic ownership while retaining all existing safety properties.

## Disposition

Use this rationale as the required starting evidence if a later PR structurally updates `PROTOCOL_MAP.md` or any locked lifecycle/authority document. Any such mutation must still run the repository's current locked-document and protocol validation gates.