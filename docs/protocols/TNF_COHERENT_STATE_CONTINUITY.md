# TNF Coherent State Continuity

`[CLASS:PRIME] [STATUS:ACTIVE] [DOC_TYPE:ARCHITECTURE_DOCTRINE] [VISIBILITY:COLLECTIVE]`

**Established:** 2026-08-18  
**Scope:** product-neutral architecture derived from Turn Zero V2,
capability-first staffing, repository separation, state freshness, multi-agent
concurrency, and operator-directed design synthesis.

## Purpose

TNF should not model a changing world as a pile of immutable assertions. It
should preserve a continuously testable chain connecting **human intent,
historical context, current observation, authority, action, consequence,
receipt, memory, and next state**.

The architectural objective is **coherence across change**.

## Persistent logical kernel

Eight primitives remain useful across code, agents, workflows, personal
operating systems, organizations, and external services:

1. **Intent** — the outcome actually sought.
2. **Authority** — who or what is permitted to decide or mutate.
3. **Context** — the minimum relevant information required to act.
4. **Capability** — the ability required by the task, independent of provider
   identity.
5. **Boundary** — where information, authority, money, code, or responsibility
   may flow.
6. **Action** — a bounded operation against current state.
7. **Receipt** — evidence of what actually occurred.
8. **Handoff** — sufficient state for another actor to continue without
   reconstructing reality from scratch.

Named agents, repositories, models, programs, and vendors are **providers,
containers, authority surfaces, or state stores** participating in this grammar;
they are not the grammar itself.

## Continuous execution loop

```text
HUMAN INTENT
    ↓
ORIENT
    ↓
CLASSIFY
    ↓
HYDRATE
    ↓
STAFF CAPABILITIES
    ↓
ACT
    ↓
VERIFY
    ↓
PROPAGATE GENERALIZED LEARNING
    ↓
HANDOFF
    ↓
REVIEW / NEXT INTENT
```

This is the continuous form of Turn Zero + Turn End. Turn Zero establishes
enough verified context and authority to safely act. Turn End preserves enough
proof-bearing state to continue.

## Canonical truth is evidentiary

Canonical status should be demonstrable rather than merely asserted.

A useful claim model is:

```yaml
claim:
  subject: <entity>
  predicate: <relationship-or-state>
  value: <current-value>

provenance:
  historical_decisions: []
  authority_refs: []

current_receipts:
  observations: []
  observed_at: <timestamp>
  ttl: <freshness-window>

confidence:
  state: verified | reported | inferred | unknown
```

A repository is canonical because current repository maps, governance contracts,
ref observations, and observed publication behavior support that claim. A
remembered repository name is not sufficient evidence.

## Proof-bearing state

A TNF state should be treated as more than a current value.

```text
State =
    current observations
  + historical provenance
  + relationships
  + authority
  + active intents
  + unresolved dependencies
  + actions performed
  + receipts
  + confidence/freshness
  + possible next transitions
```

Agents should pass proof-bearing state where the cost is justified, not naked
conclusions.

## Memory dimensions

TNF should avoid flattening all memory into one undifferentiated store.
Different memory classes have different authority, lifetime, retrieval, and
privacy semantics:

- **episodic** — what happened;
- **semantic** — what was learned;
- **procedural** — how to perform a workflow;
- **authority** — who may authorize what;
- **relational** — how entities are connected;
- **state** — what is presently observed;
- **provenance** — why a claim is believed;
- **intent** — what outcome the system is preserving.

## Relative context

The same entity can have different valid relational projections depending on
task and observer. For example, a repository may simultaneously be a development
source, publication upstream, historical lineage object, or external fork
target.

TNF should represent these as explicit relationships rather than forcing one
global label onto every context.

## Capability is not authority

A provider's ability to perform an operation is independent of permission to
perform it.

```text
actor.capabilities ≠ actor.authority_scope
```

A mutation should be permitted only when required capability and required
authority both resolve successfully.

## Context must be scoped and fresh

Do not copy all context everywhere. Resolve authoritative references and hydrate
only the information required by the current intent.

Existence is not freshness. A commit object existing does not prove it is the
current branch tip. A process existing does not prove service health. A
historical schedule does not prove it remains active.

Volatile claims therefore require observations with freshness semantics.

## Classification precedes mutation

Before mutation, classify independently across at least:

### Work domain

- core
- agency
- personal

### Artifact destination

- OSS runtime
- public contract
- private control plane
- satellite
- external

### Data residency / sensitivity

- product state
- bounded working artifact
- external durable storage
- secret / machine-local

and:

- public
- internal
- private
- restricted

A personal or client workflow may generate a generalizable OSS mechanism without
making the source personal context public.

**Rule: universalize the pattern, not the private context.**

## Shared-state concurrency requires ownership

Multiple rational agents can corrupt shared state if ownership is implicit.

For mutable resources, TNF should increasingly track:

```text
resource
owner / claimant
scope
lease or lock
last writer
expected next writer
```

The general lifecycle is:

```text
READ → CLAIM → MUTATE → VERIFY → RELEASE / HANDOFF
```

This applies to Git index/worktrees, migrations, deployment branches, browser
sessions, generated artifacts, and other shared mutation surfaces.

## Verification outranks narrative

A statement that something worked is weaker than a receipt.

Prefer:

```yaml
assertion: frontend build succeeded
evidence:
  command: <command>
  exit_code: 0
  artifact: <path>
  observed_at: <timestamp>
```

over prose-only completion claims.

TNF should distinguish **verified fact**, **reported state**, **inference**, and
**unknown**.

## Contradiction is information

When a locally correct abstraction fails in another context, treat the
contradiction as evidence that the abstraction is incomplete.

The Turn Zero V2 public-boundary correction is the reference pattern: an
internal repository-identity rule was correct for canonical development but too
absolute for legitimate OSS forks. The contradiction yielded a better relational
model rather than a weakened rule.

## Propagation discipline

```text
Experience
  ↓
Extract candidate lesson
  ↓
Remove private/context-specific material
  ↓
Classify destination
  ↓
Test independently
  ↓
Propagate generalized mechanism
```

Do not proliferate local workarounds, stale assumptions, private context, or
unverified conclusions as universal doctrine.

## Handoff is part of execution

Completion includes durable continuation state:

```yaml
completed: []
pending: []
blocked: []
waiting_on: []
next_actions: []
receipts: []
owners: []
```

A transcript is useful history but is not a substitute for a structured handoff.

## Alignment framing

A productive systems-level definition of alignment for TNF is:

> Preserve legitimate human intent through chains of delegated action across
> heterogeneous systems while maintaining explicit authority, context integrity,
> accountability, reversibility where possible, and human recourse.

This is a research and engineering framing, not a claim that the general AI
alignment problem is solved.

## Design test

For any new TNF feature or protocol, ask:

1. Whose intent is being preserved?
2. What authority permits the action?
3. What current evidence supports the context?
4. Which capabilities are required, and which providers can satisfy them?
5. Which boundaries constrain data and mutation?
6. What state is changed?
7. What receipt proves the change?
8. What generalized lesson, if any, should propagate?
9. What must the next actor know to continue coherently?

If those answers are unavailable for a consequential operation, the system
should reduce confidence, request authority/context, or stop rather than
fabricate continuity.
