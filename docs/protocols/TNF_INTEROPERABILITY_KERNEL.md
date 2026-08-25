# TNF Interoperability Kernel

`[CLASS:PUBLIC_CONTRACT] [STATUS:ACTIVE_CANDIDATE] [VISIBILITY:PUBLIC]`

## Purpose

Define the minimum semantics an independent TNF-compatible runtime, client, provider, or adapter needs in order to participate safely without exposing private hosted orchestration decision procedures.

This document is a **public interoperability contract**, not the complete TNF orchestration-intelligence architecture.

## Public semantic primitives

TNF-compatible systems should preserve these concepts explicitly where relevant:

- **Intent** — the requested or preserved outcome.
- **Authority** — the scope within which an actor may decide or mutate.
- **Context** — bounded information required for the current interaction.
- **Capability** — ability to perform an operation, independent of permission.
- **Boundary** — constraints on information, responsibility, authority, and state flow.
- **Action** — a bounded operation against current state.
- **Receipt** — evidence describing what actually occurred.
- **Handoff** — sufficient continuation state for another authorized actor to proceed.

### Required invariant

`Capability != Authority`

A provider being able to perform an operation does not itself authorize the operation.

## Interoperability ordering

At public protocol boundaries, distinguish:

```text
semantic intent / interaction
        ↓
protocol contract
        ↓
envelope / representation
        ↓
transport / carrier
```

Implementations may use different internal models and optimization strategies provided they honor the public contract.

## Public evidence semantics

Compatible implementations should distinguish at least:

- `verified` — supported by current executed evidence;
- `reported` — asserted by a source but not independently verified;
- `inferred` — derived from available evidence;
- `unknown` — insufficient evidence.

A receipt should identify its subject/action, relevant result, provenance/provider, and freshness/time information when material.

## Public context semantics

Context exchange should be scoped to the current interaction. A public TNF implementation may use inline context, references, durable artifacts, MCP resources, files, HTTP resources, Redis references, or other carriers.

The public contract does not prescribe the private algorithm used to rank, select, compress, reconcile, or promote context.

## Public admission / permission boundary

A hosted TNF service may expose admission, challenge, status, permission, and receipt contracts. Clients must be able to:

- submit an admission/identity/capability claim through a documented contract;
- receive challenge or denial information;
- verify or persist a receipt where provided;
- distinguish permission for a scoped operation from global trust.

The hosted service is not required to disclose its private evidence weighting, authority-resolution, route-scoring, trust-resolution, or policy-synthesis algorithm.

## Public extension surface

Public TNF distributions should expose sufficient contracts for independent adapters/providers to implement:

- provider/capability declaration;
- message/envelope exchange;
- context references;
- receipts and verification metadata;
- public control-plane client interfaces/stubs;
- supported transport adapters;
- compatibility/conformance checks.

## Degraded local operation

The open runtime should remain useful without the hosted control plane. Where hosted authority/intelligence is unavailable, public implementations should fail explicitly, degrade safely, or use documented local policy modes rather than silently assuming hosted authority.

## Out of scope for this public contract

The following are implementation details and are not required for interoperability:

- proprietary graph construction/inference algorithms;
- route/path optimization weights;
- business/value causality reasoning;
- evidence-promotion/scoring algorithms;
- context-selection ranking;
- provider staffing/cost/quota optimization;
- counterfactual architecture synthesis;
- recursive contradiction/evolution logic;
- tenant/customer operational graph state;
- private hosted orchestration policy.

Public schemas may describe the inputs/outputs of such capabilities without publishing their decision procedure.
