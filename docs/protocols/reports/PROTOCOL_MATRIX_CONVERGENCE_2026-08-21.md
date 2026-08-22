# TNF Protocol Matrix Convergence — 2026-08-21

`[CLASS:PRIME] [STATUS:PROPOSED] [DOC_TYPE:ARCHITECTURE_RECONCILIATION] [VISIBILITY:COLLECTIVE]`

## Purpose

This report reconciles the emerging Personal Operational Graph / boot-orientation work (#139 / #140) with the pre-existing TNF protocol system. It is deliberately **not** a replacement authority document. It records the current architectural conclusion, identifies overlap risks, and defines the safest path for any later protocol mutation through the existing TNF vetting/challenge process.

## Authority status

- Existing locked/active protocol documents retain their current authority.
- This report is a reconciliation proposal and evidence artifact until reviewed/merged through normal TNF governance.
- No locked Turn Zero, Turn End, authority, freshness, or governance document is superseded by this report.
- The accompanying challenge-rationale event exists so any later structural mutation is explicit and reviewable rather than silent.

## Sources reviewed

Primary authority and architecture surfaces reviewed in this pass include:

- `docs/protocols/PROTOCOL_MAP.md`
- `docs/protocols/TNF_GOVERNANCE_TENETS.md`
- `docs/protocols/TNF_DOCUMENT_VETTING_PROCEDURE.md`
- `docs/protocols/TURN_ZERO_MANDATE.md`
- `docs/protocols/TNF_COHERENT_STATE_CONTINUITY.md`
- `.agent/SYSTEM_PROMPT.md`
- `data/harness/intake-forwarder-config.json`
- `scripts/autonomy/tnf_intake_forwarder.py`
- the 2026-08-18 Tier-0 Relational Interaction Semantics / Agent Alignment distribution artifacts, treated as evidence unless already represented by canonical repo doctrine.

This report does not claim every historical protocol is re-authored here. `PROTOCOL_MAP.md` remains the inventory/index authority for the broader protocol corpus pending a dedicated map refresh.

## Core finding: TNF is a matrix, not one linear stack

The recent orientation architecture is directionally correct, but a single sequence such as:

`Sources -> Receipts -> Graph -> Reconciliation -> Orientation -> Interaction -> Action -> Receipts`

is insufficient as the master protocol hierarchy. It mixes different kinds of things: semantics, lifecycle phases, evidence constraints, representations, and applications.

The more durable model is an **orthogonal protocol matrix**.

### Axis A — Persistent semantic kernel

Existing TNF doctrine already identifies the durable primitives:

1. Intent
2. Authority
3. Context
4. Capability
5. Boundary
6. Action
7. Receipt
8. Handoff

Relational interaction semantics further describe acts such as REQUEST, ACK, CLARIFY, CONFIRM, COMMIT, DELEGATE, REFUSE, CHALLENGE, REPAIR, VERIFY, HANDOFF, and REVOKE/CANCEL.

These primitives describe meaning. They should not be replaced by provider, transport, UI, or graph-specific nouns.

### Axis B — Execution lifecycle / state machine

Turn Zero V2 defines:

`RESPOND -> ORIENT -> CLASSIFY -> HYDRATE -> STAFF -> ACT -> VERIFY -> PROPAGATE -> HANDOFF`

This remains the correct primary lifecycle. The Personal Operational Graph does **not** replace this sequence. Instead, it can materially improve the `ORIENT`, `HYDRATE`, `STAFF`, `VERIFY`, and `HANDOFF` phases by supplying a compact proof-bearing projection.

### Axis C — Cross-cutting invariants

The following are not merely lifecycle stages and should not be modeled as subordinate UI fields:

- authority / capability separation;
- provenance / attribution;
- freshness / observation time / TTL;
- verification / confidence;
- classification / privacy / residency / repository boundary;
- ownership / lease / shared-state concurrency;
- cost / metered-execution authority;
- reversibility / human recourse where consequence warrants it.

These invariants constrain every meaningful state transition and every materialized view.

### Axis D — Evaluation and graduation gates

TNF already has multiple gate families. They serve different scopes and should not be collapsed into one generic `verification` enum.

The locked document-vetting procedure defines five governance/document gates:

1. Definition & Class Validation
2. Library & Namespace Assignment
3. Flag Integrity
4. Linkage & Attribution
5. Challenge & Verify

The intelligence intake forwarder separately implements a Gauntlet/Rubric path for graduating external or private-source intelligence through sanitization, attribution, implementation-density/utility checks, and visibility constraints.

Turn Zero has its own mutation-readiness gates (canonical repository identity, classification, freshness, authority/capability readiness).

Conclusion: **Rubric and Gauntlet are evaluation functions over candidate state/artifacts; they are not foundational ontology nodes and not replacements for Turn Zero.** A future generalized gate interface may unify their shape, but their policy scopes must remain explicit.

### Axis E — Protocol representations and proof-bearing records

This axis contains machine-readable contracts such as:

- interaction/envelope records;
- context references;
- handoff packets / session handoff;
- receipts and observations;
- authority/classification records;
- agent capability/activity snapshots;
- reconciliation findings.

Representations should encode the semantic kernel and invariants rather than invent parallel meanings.

### Axis F — Transport / providers / adapters

Redis, WebSocket, MCP, A2A, GitHub, Claude, OpenAI, Google, Cursor, browser extensions, local models, and future hosts belong here. They provide capabilities, state sources, or delivery lanes. They are not foundational TNF identities.

### Axis G — Materialized projections / applications

The proposed Personal Operational Graph belongs here.

It should be defined as a **derived, proof-bearing read model** over canonical TNF state, provider observations, receipts, relationships, and user-authorized preference facts.

`OrientationSnapshot` is then a compact projection of that read model for Turn Zero and edge surfaces.

The graph is therefore not the source of truth and must not silently become a second ontology, authority registry, task system, handoff store, or provider registry.

## Recommended fundamental ordering

For conceptual documentation, use this dependency order:

```text
HUMAN / LEGITIMATE INTENT
        |
        v
RELATIONAL MEANING + PERSISTENT LOGICAL KERNEL
        |
        +-------------------------------+
        |                               |
        v                               v
EXECUTION LIFECYCLE                CROSS-CUTTING INVARIANTS
Turn Zero -> Turn End              authority / boundary / freshness /
                                   provenance / verification / ownership /
                                   privacy / cost / recourse
        |                               |
        +---------------+---------------+
                        v
             PROOF-BEARING RECORDS
       claims / observations / receipts /
       handoffs / interaction state / snapshots
                        |
                        v
             RECONCILIATION / GATES
       classify / challenge / vet / corroborate /
       graduate / detect conflict and staleness
                        |
                        v
            MATERIALIZED READ MODELS
        Personal Operational Graph / indexes
                        |
                        v
              ORIENTATION PROJECTIONS
       Now / Network / Changes / Reconcile /
                   Ask / Act
                        |
                        v
             EDGE / APPLICATION SURFACES
      CLI / desktop / browser / voice / API
                        |
                        v
              PROVIDER-BACKED ACTION
                        |
                        v
               NEW RECEIPTS / STATE
                        +----> lifecycle continues
```

Transport/provider adapters can enter at the observation, staffing, action, and receipt boundaries without changing the semantic foundation.

## Implications for #139 / #140

### Keep

- Personal Operational Graph as a normalized, provider-neutral projection.
- Reconciliation findings and explicit stale/conflicting/unreachable/unauthorized states.
- `OrientationSnapshot` and progressive `Now / Network / Changes / Reconcile / Ask / Act` rendering.
- Local-first/headless orientation before rich UI.

### Reconcile before merge

PR #140 currently introduces `OperationalProvenance`, verification states, authorization scope, node kinds, and edge kinds. Before making the protocol public/canonical, compare each with existing:

- state freshness / confidence terminology;
- attribution/resource-pointer requirements;
- authority contracts and classification axes;
- UFTE/federated entity identity and relationship semantics;
- cross-agent capability/activity ledger contracts;
- handoff/receipt schemas;
- context-reference contracts.

Prefer composition/reference to duplicate fields where an existing TNF contract already owns semantics.

### Important correction

Do **not** describe the Personal Operational Graph as TNF's new root ontology or source of truth.

Preferred description:

> A subject/workspace-scoped materialized read model that reconciles proof-bearing TNF records and authorized external observations into a navigable operational topology.

Likewise, `OrientationSnapshot` is not a replacement for Turn Zero. It is an input/output projection used primarily by the `ORIENT` phase and progressively refreshed as later phases change state.

## Terms / Rubric / Gauntlet placement

The current codebase shows at least two distinct gating chains:

### Governance/document vetting

`DEFINE/CLASSIFY -> NAMESPACE -> FLAG -> LINK/ATTRIBUTE -> CHALLENGE/VERIFY -> ACCEPT/SUPERSEDE`

This protects authority-bearing knowledge from overlap and silent drift.

### Intelligence Gauntlet

`PRIVATE/EXTERNAL INTAKE -> AUTHENTICATED CONFIG/PERMISSIONS -> PII SCRUB -> DENSITY/UTILITY -> ATTRIBUTION -> VISIBILITY CHECK -> GRADUATED DISTILLATION -> KNOWLEDGE GRAPH`

This protects assimilation boundaries and is especially relevant to ChatGPT Library / external-agent artifacts.

These chains should become graph-visible as provenance/evaluation receipts, but the graph must not reinterpret or bypass them.

## Protocol-map drift observation

`PROTOCOL_MAP.md` remains valuable and should not be discarded. However, its six-tier hierarchy was revised before the 2026-08-18 Coherent State Continuity / Turn Zero V2 synthesis. It should therefore receive a separate, challenge-aware refresh that:

1. preserves its inventory role;
2. adds the orthogonal-matrix view rather than forcing every protocol into one parent-child chain;
3. distinguishes authority, lifecycle, invariants, gates, representations, transports, and projections;
4. indexes newer contracts (#119/#121/#139 after stabilization);
5. marks historical/superseded relationships without deleting lineage.

The challenge-rationale seed for that work is `docs/protocols/challenge-rationales/2026-08-21-protocol-matrix-convergence.md` on the current integration branch. It does not itself supersede any locked document.

## Evolution rule

When TNF discovers a stronger abstraction:

`CONTRADICTION -> INSPECT EXISTING OWNER -> IDENTIFY RETAINED SAFETY PROPERTY -> CHALLENGE RATIONALE -> ADD/REVISE MINIMUM AUTHORITY -> VERIFY -> PROPAGATE -> HANDOFF`

Do not fork doctrine merely because a new model has a cleaner vocabulary.

## Acceptance test for future architecture

A proposed protocol or subsystem should answer:

1. Which semantic primitive(s) does it implement?
2. Which lifecycle phase(s) consume or emit it?
3. Which cross-cutting invariants constrain it?
4. Which gate/rubric evaluates it, if any?
5. Which canonical contract owns its machine-readable representation?
6. Is it a source record, a derived projection, or a provider/transport?
7. Which existing owner would it overlap with?
8. What receipt proves its behavior?
9. How can it evolve without breaking prior proof-bearing continuity?

If those questions cannot be answered, the unit is not ready to become a new TNF protocol.

## Recommended next mutations

1. Keep PR #140 draft until contract-level overlap reconciliation is complete.
2. Merge the swarm orientation front door only with an explicit pointer to this convergence report.
3. Audit `PROTOCOL_MAP.md` against post-2026-08-13 protocols and use the recorded challenge rationale before structural rewrite.
4. Build a machine-readable protocol registry that records `owner`, `layer/axis`, `status`, `supersedes`, `depends_on`, `enforced_by`, and `evidence` without replacing source documents.
5. Make the future Personal Operational Graph consume that registry as one source, proving the graph architecture on TNF's own protocol matrix first.

## Current conclusion

The strongest long-term configuration is **not to replace the old TNF stack with the Personal Operational Graph**. It is to let TNF's mature semantic kernel and lifecycle remain foundational, model governance/evidence properties as orthogonal invariants, preserve specialized rubric/gauntlet scopes, and place the graph above proof-bearing records as a reconciled materialized projection.

This gives TNF room to add providers, transports, policies, user domains, and new interaction patterns without repeatedly rewriting the foundation.