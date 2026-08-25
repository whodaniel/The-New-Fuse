`[CLASS:PRIME] [STATUS:LOCKED] [DOC_TYPE:PROTOCOL_STANDARD] [VISIBILITY:PUBLIC]`

# TNF Turn Zero Mandate — Open Runtime V2

**Status:** ACTIVE  
**Protocol ID:** `TNF_TURN_ZERO_CANONICAL`  
**Open runtime:** `whodaniel/The-New-Fuse`

## Purpose

Turn Zero establishes the minimum verified authority, repository role, classification, current context, and capability staffing required to take the **next safe action**.

It is not a ritual to load the entire framework before responding. In interactive work, responsiveness comes first; mutation readiness is gated separately.

The open runtime must remain capable of completing Turn Zero without access to private TNF source or the hosted orchestration-intelligence implementation.

## Public semantic authority

The open agent is grounded by:

- `.agent/SYSTEM_PROMPT.md`
- `docs/protocols/TNF_INTEROPERABILITY_KERNEL.md`
- `docs/protocols/TNF_OPEN_AGENT_CORE.md`
- `docs/core/FRONTLOAD_MANIFEST.md`
- `data/harness/open-agent-contract.json`

Preserve the public semantic kernel:

`Intent · Authority · Context · Capability · Boundary · Action · Receipt · Handoff`

## Repository roles are relational

Repository identity does not have one universal meaning independent of observer/task.

- `whodaniel/The-New-Fuse` is the official public runtime source and distribution repository. Open-source users may clone it, run it, inspect it, modify it locally, fork it, and contribute to it.
- An external fork/clone is a legitimate public-runtime work surface. A fork does not automatically gain upstream publication authority.
- TNF's internal product/release process may maintain a separate private canonical development source and publish into the open repository.
- `private_control_plane` implementation does not belong in the open runtime and must be placed in an authorized private source.

The open-source agent MUST NOT require private repository access for ordinary public/local operation.

## Core lifecycle

Use:

`RESPOND → ORIENT → CLASSIFY → HYDRATE → STAFF → ACT → VERIFY → PROPAGATE → HANDOFF`

### RESPOND

In interactive sessions, understand and answer the operator promptly. Do not block ordinary conversation on full repository scans, provider discovery, or context ingestion.

### ORIENT

Before a consequential state-changing action, obtain the minimum current receipts required by the task. Run the public rail gate and inspect current repository/runtime state.

### CLASSIFY

Before creating, moving, committing, publishing, or persisting an artifact, classify it independently across work domain, artifact destination, data residency, and sensitivity.

### HYDRATE

Retrieve only task-relevant current context. Do not ingest an entire codebase or every memory artifact merely because the session began.

### STAFF

Resolve required capabilities to currently available providers. Capability providers may include agents, models, scripts, services, tools, humans, or an optional hosted TNF decision service.

### ACT

Perform the bounded operation permitted by the current authority, boundary, and ownership state.

### VERIFY

Empirically verify the intended outcome using an appropriate pathway. Never infer system success from intent, generated prose, or a tool invocation alone.

### PROPAGATE

Generalize reusable learning without leaking private/context-specific material.

### HANDOFF

Preserve enough current state, receipts, ownership, classification, unresolved dependencies, and continuation information for another authorized actor/session to continue coherently.

---

## Gate 0 — Public agent rail

Before claiming TNF onboarding, verify the public semantic/protocol rail:

```bash
node scripts/protocols/open-agent-rail-gate.cjs
```

This hashes the required public rails and writes a machine-local receipt under `~/.tnf/runtime/` unless `--no-write` is supplied.

A missing rail means the open-agent harness is incomplete; it does not mean the hosted SaaS must be contacted.

---

## Gate 1 — Repository / operation state

Before write-capable work, inspect at least:

```bash
git rev-parse --show-toplevel
git remote get-url origin
git branch --show-current
git rev-parse HEAD
git status --porcelain
```

Also detect in-progress merge/rebase/cherry-pick/revert state.

The machine gate is:

```bash
node scripts/protocols/turn-zero-v2-gate.cjs --require-write-ready
```

Repository mode changes the meaning of the work:

- official public runtime → legitimate OSS/public-contract work surface;
- fork/external clone → legitimate public-runtime work surface without implied upstream authority;
- private control-plane source → not an OSS work surface;
- internal TNF development source → may contain additional private capabilities, but those are not prerequisites for public protocol correctness.

---

## Gate 2 — Three-axis classification

### Axis 1 — Work domain

- `corporate`
- `agency`
- `personal`

Domain describes whose problem is being solved; it does not itself decide publication.

### Axis 2 — Artifact destination

- `oss_runtime`
- `public_contract`
- `private_control_plane`
- `satellite`
- `external`

In the open runtime, `private_control_plane` is a boundary violation for persisted implementation.

### Axis 3 — Data residency / sensitivity

Residency:

- `product_state`
- `bounded_working`
- `external_durable`
- `secret_machine_local`

Sensitivity:

- `public`
- `internal`
- `private`
- `restricted`

Safety rules:

1. private/restricted context must not be committed to public product source;
2. secret-machine-local material remains outside repository source control;
3. personal/client artifacts default external unless deliberately rewritten as sanitized product-neutral mechanisms;
4. when classification is unclear, publish the smallest public contract or keep the implementation private/external until resolved;
5. a public contract does not require disclosure of a private decision procedure.

Environment hints:

```text
TNF_WORK_DOMAIN
TNF_ARTIFACT_DESTINATION
TNF_DATA_RESIDENCY
TNF_DATA_SENSITIVITY
```

---

## Gate 3 — State freshness

Volatile facts are not asserted from memory.

Use current probes/receipts appropriate to the claim. Where available:

```bash
node scripts/protocols/state-freshness-gate.cjs --frontload
node scripts/protocols/state-freshness-gate.cjs --refresh
```

A stale or missing receipt means **unknown**, not automatically broken or verified.

After context compaction, provider/session substitution, repository movement, or loss of confidence in current state, re-probe facts on which the next action depends.

---

## Gate 4 — Task-scoped context hydration

Hydrate in this order unless the task requires a narrower subset:

1. public semantic rails from `FRONTLOAD_MANIFEST.md`;
2. current repository/runtime receipt;
3. public product/boundary maps relevant to the task;
4. exact packages/files/tests involved;
5. provider/capability observations required for execution;
6. only then larger maps, histories, memories, or satellite repositories that are actually relevant.

Generated codebase maps and dynamic recall are clue sources, not authority substitutes.

Context may be inline or referenced through files, resources, content hashes, MCP resources, Redis references, URLs, or other supported carriers. The public protocol does not require the private hosted context-ranking algorithm.

---

## Gate 5 — Capability staffing

Turn Zero staffs **capabilities**, not brands.

For a nontrivial task:

1. identify required capabilities;
2. discover currently available providers;
3. apply hard capability, authority, boundary, privacy, and explicit operator requirements;
4. choose among eligible providers using an inspectable local/operator policy or an intentionally configured hosted policy contract;
5. execute;
6. verify independently when consequence warrants it.

The open runtime may use local deterministic/configurable policy. Missing hosted optimization does not remove local agency.

`Capability != Authority` remains mandatory.

---

## Gate 6 — Shared mutation / ownership

Before changing shared mutable state, establish ownership/collision awareness appropriate to the resource.

General pattern:

`READ → CLAIM/CHECK → MUTATE → VERIFY → RELEASE/HANDOFF`

This applies to Git worktrees/index/branches, deployment state, durable shared files, browser sessions, task queues, migrations, and other shared mutation surfaces.

A provider being available does not prove that it owns the resource or may change it.

---

## Gate 7 — Inspect → Act → Verify

- **Inspect** current authority, relevant context, state, ownership, and source.
- **Act** with explicit scope.
- **Verify** empirically.

Distinguish evidence classes at least as:

- `verified`
- `reported`
- `inferred`
- `unknown`

Do not silently upgrade reported/inferred state to verified.

A successful tool call is a receipt for that invocation, not necessarily proof of the intended downstream outcome.

---

## Gate 8 — Privacy-preserving propagation

**Universalize the pattern, not the private context.**

When sensitive work reveals a generally useful improvement:

1. extract the generalized mechanism;
2. remove identities, private facts, credentials, case-specific destinations, and unnecessary source context;
3. classify the generalized artifact;
4. test it independently;
5. only then promote it into shared/public TNF source.

Do not move private decision algorithms into the public runtime merely because a public contract calls them.

---

## Interactive mode

At session start:

1. respond to the user;
2. run/read the public Stage A rail as needed;
3. orient repository/runtime state before mutation;
4. classify when persistence/mutation becomes relevant;
5. hydrate only the current task;
6. staff capabilities only when useful.

Do not automatically pull, load all memory, scan every provider, or execute full assimilation merely because the agent started.

---

## Swarm / autonomous mode

For coordinated or long-running work:

1. verify the public agent rail;
2. orient repository/runtime state;
3. classify planned artifacts;
4. hydrate current task state;
5. establish ownership/collision boundaries;
6. discover/staff required capabilities;
7. execute bounded work packages;
8. verify;
9. propagate only generalized public-safe learning;
10. write receipts/handoff.

Autonomous execution does not override destructive-operation, credential, elevation, publication, privacy, or operator-approval boundaries.

---

## Public/private composition

The open runtime must contain the **logical railways and gateways** required to follow TNF protocol.

It may call a hosted TNF service for optional optimization or hosted authority through public contracts, but correctness of the public lifecycle must not depend on access to private implementation source.

If hosted policy is absent:

- use a valid inspectable local/operator policy where possible;
- request operator choice where appropriate;
- use a documented deterministic fallback where semantics permit;
- defer/deny only the specific action whose missing authority/policy is consequential.

Do not collapse the whole agent into a thin remote client.

---

## Turn End contract

When durable continuation is required, preserve:

- repository/runtime identity;
- intent/scope;
- classification/boundaries;
- current head/state references;
- completed/pending/blocked work;
- ownership;
- evidence/receipts;
- unverified assumptions;
- next actions.

Use the current public handoff schema/tooling where available.

---

## Enforcement surfaces

These public surfaces must remain aligned:

- `.agent/SYSTEM_PROMPT.md`
- `.agent/context/agent-onboarding.md`
- `.agent/workflows/frontload.md`
- `docs/protocols/TNF_INTEROPERABILITY_KERNEL.md`
- `docs/protocols/TNF_OPEN_AGENT_CORE.md`
- `docs/core/FRONTLOAD_MANIFEST.md`
- `data/harness/open-agent-contract.json`
- `scripts/protocols/open-agent-rail-gate.cjs`
- `scripts/protocols/turn-zero-v2-gate.cjs`
- `scripts/tnf-onboard-twip.cjs`
- `packages/tnf-cli/src/orchestration/TurnZeroService.ts`

## Operator-facing principle

**Establish just enough verified meaning, authority, context, classification, ownership, and capability to safely take the next action — while preserving local open-agent agency.**
