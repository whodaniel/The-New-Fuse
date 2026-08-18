`[CLASS:PRIME] [STATUS:LOCKED] [DOC_TYPE:PROTOCOL_STANDARD] [VISIBILITY:COLLECTIVE]`

# TNF Turn Zero Mandate — V2

**Status:** ACTIVE  
**Protocol ID:** `TNF_TURN_ZERO_CANONICAL`  
**Canonical development repository:** `whodaniel/tnf-monorepo`

## Purpose

Turn Zero establishes the minimum verified authority, repository identity, classification, current context, and capability staffing required to take the **next safe action**.

It is not a ritual to load the entire framework before responding. In interactive work, responsiveness comes first; mutation readiness is gated separately.

## Authority

- Canonical source: `docs/protocols/TURN_ZERO_MANDATE.md` in `whodaniel/tnf-monorepo`.
- `whodaniel/The-New-Fuse` is the public open-runtime publication target.
- `whodaniel/fuse-control-plane` is the private proprietary control-plane publication target.
- Do not develop directly in either downstream publication target.
- External host mirrors are convenience surfaces only. If a mirror conflicts with this file, this file wins.
- Repository/product placement is governed jointly by:
  - `docs/REPO_SEPARATION.md`
  - `docs/product/TNF_PRODUCT_BOUNDARY.md`
  - `data/distribution/product-repo-map.json`
  - `data/distribution/oss-app-boundary.json`

## System Boundary

TNF is the orchestration framework/control plane. Harnesses and model hosts such as Claude Code, Codex, Cursor, Gemini, OpenClaw, Pi, local models, browser harnesses, or later providers are **capability providers**, not foundational protocol identities.

OpenClaw remains an optional adapter. Verification follows live enlistment and capability discovery rather than stale host assumptions.

## Core Lifecycle

Use the following lifecycle:

`RESPOND → ORIENT → CLASSIFY → HYDRATE → STAFF → ACT → VERIFY → PROPAGATE → HANDOFF`

### RESPOND

In interactive sessions, understand and answer the operator promptly. Do not block ordinary conversation on repository probes, full frontload, fleet discovery, or assimilation scans.

### ORIENT

Before a state-changing action, obtain the minimum current receipts required by the task.

### CLASSIFY

Before creating, moving, committing, publishing, or persisting an artifact, classify it on the three independent axes below.

### HYDRATE

Retrieve only task-relevant current context. Do not ingest a whole codebase map merely because the session began.

### STAFF

Resolve required capabilities to currently available providers. A capability may be staffed by an agent, harness, model, script, service, or human gate.

### ACT

Perform the scoped action.

### VERIFY

Empirically verify the result using a pathway appropriate to the action. Never infer success from intent or tool invocation alone.

### PROPAGATE

Generalize reusable learning without leaking private context.

### HANDOFF

Write enough current state, receipts, classification, and continuation information for another provider/session to resume safely.

---

## Gate 0 — Canonical Repository Identity

Before **write-capable TNF code/protocol work**, derive a live repository receipt:

```bash
git rev-parse --show-toplevel
git remote get-url origin
git branch --show-current
git rev-parse HEAD
git status --porcelain
```

Also detect in-progress merge/rebase/cherry-pick/revert state.

The canonical development origin must normalize to:

```text
whodaniel/tnf-monorepo
```

A historical local folder name such as `The-New-Fuse` does not establish repository identity. The remote does.

If the active repository is `The-New-Fuse` or `fuse-control-plane`, stop write-capable development and return to `tnf-monorepo`. Downstream repos are publication surfaces.

The machine gate is:

```bash
node scripts/protocols/turn-zero-v2-gate.cjs --require-write-ready
```

Read-only orientation may continue when repository identity cannot yet be proven; mutation may not.

---

## Three-Axis Classification

The old single “work plane” model is superseded by three orthogonal axes.

### Axis 1 — Work Domain

- `corporate` — TNF/product/framework work.
- `agency` — client-specific work.
- `personal` — one person's private life/work context.

Domain describes **whose problem** is being solved. It does not by itself determine where code belongs.

### Axis 2 — Artifact Destination

Every persisted artifact must be placed in one of the current product-boundary destinations:

- `oss_runtime`
- `public_contract`
- `private_control_plane`
- `satellite`
- `external`

Definitions follow `TNF_PRODUCT_BOUNDARY.md`.

Examples:

- a generalized relay primitive → `oss_runtime`
- an interface/schema exposing private capability safely → `public_contract`
- tenant authority/billing/hosted orchestration implementation → `private_control_plane`
- an optional game/integration/product → `satellite`
- personal strategy, client brief, private benefits/medical/legal material → `external`

### Axis 3 — Data Residency / Sensitivity

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

A useful product pattern discovered during personal/client work does **not** authorize carrying the underlying private facts into product source.

### Classification safety rules

1. `private` or `restricted` context must not be committed to public product source.
2. `secret_machine_local` material remains outside repository source control.
3. Personal/client artifacts default to `external` unless deliberately rewritten as sanitized, product-neutral implementation.
4. When classification is unclear, prefer the smallest public contract plus private implementation, or keep the artifact external until resolved.
5. Classification is recorded in handoff state.

Environment hints accepted by V2 tooling:

```text
TNF_WORK_DOMAIN
TNF_ARTIFACT_DESTINATION
TNF_DATA_RESIDENCY
TNF_DATA_SENSITIVITY
```

---

## State Freshness

Volatile facts are not asserted from memory.

Use `STATE_FRESHNESS_MANDATE.md` and:

```bash
node scripts/protocols/state-freshness-gate.cjs --frontload
node scripts/protocols/state-freshness-gate.cjs --refresh
```

Turn Zero freshness includes, where relevant:

- canonical `tnf-monorepo` main;
- public open-runtime main;
- private control-plane main;
- public PR/rules/leakage state;
- product-repository map;
- OSS/satellite boundary map;
- local repository identity/dirty state;
- live runtime services.

A stale or missing receipt means **unknown**, not broken.

Catastrophic claims require corroboration from an independent probe.

After context compaction, re-probe any volatile fact on which the next action depends.

---

## Task-Scoped Context Hydration

Do not use `apps/frontend/src/data/codebase_map.json` as mandatory Turn Zero authority.

For TNF development, hydrate in this order:

1. `data/distribution/product-repo-map.json`
2. `data/distribution/oss-app-boundary.json`
3. `docs/product/TNF_PRODUCT_BOUNDARY.md`
4. `docs/REPO_SEPARATION.md`
5. current freshness/repository receipts
6. exact packages/files involved in the task
7. relevant satellite repository only when the task crosses that boundary

Large ledgers, generated trackers, historical maps, and daily memories are retrieved only when task-relevant.

Dynamic recall may be used as a clue source, never as a substitute for current code/authority.

---

## Capability Staffing Mandate

Turn Zero staffs **capabilities**, not brands or hard-coded agent identities.

For a nontrivial task:

1. identify required capabilities;
2. discover currently enlisted providers;
3. evaluate authority, privacy, cost, latency, context, and reliability;
4. staff each capability with the best available provider;
5. execute;
6. verify outputs independently when consequence warrants it.

Discovery may use:

- harness configuration/runtime state;
- `tnf agents who --json`;
- capability registry/matcher;
- installed skills/scripts;
- live provider probes;
- human/operator approval surfaces.

Named providers remain valid implementation details. They are not mandatory protocol dependencies.

Parallelize when it reduces time/risk and the providers can work independently. Do not delegate merely to satisfy a ritual.

---

## Inspect → Act → Verify

This invariant remains mandatory.

- **Inspect** current authority, state, and relevant context.
- **Act** with explicit scope.
- **Verify** empirically.

Experimental/cutting-edge implementation should be verified through a stable or independently understandable path where practical.

A tool call returning success is a receipt for the call, not necessarily proof that the intended system outcome exists.

---

## Privacy-Preserving Assimilation

### Universalize the pattern, not the private context.

TNF should benefit from reusable lessons, but assimilation is a transformation, not copying.

When a personal, tenant, client, medical, legal, financial, or other sensitive workflow reveals a generally useful improvement:

1. extract the generalized mechanism;
2. strip identities, private facts, destinations, secrets, and case-specific data;
3. classify the generalized artifact through the product boundary;
4. test it independently of the private source context;
5. only then assimilate it into TNF.

Do not put private source material into TNF merely because the workflow produced a useful idea.

Attribution remains required for substantive human/scientific claims where provenance matters.

---

## ASSIMILATE_CHECK V2

ASSIMILATE_CHECK is a structured review, not a mandatory full-host scan on every interactive turn.

### Inputs

Inspect only enlisted/relevant sources:

- current session/handoff;
- recent task-relevant diff/commits;
- known failure/trajectory sources exposed by enlisted harness adapters;
- next actions;
- recurring failures observed with sufficient evidence.

No host-specific path such as `~/.hermes/...` is universally mandatory.

### Outputs

A material reusable finding becomes one of:

- code/test fix;
- protocol/runbook change;
- skill;
- issue/directive;
- known-failure entry;
- intentionally external/private note.

Not every observation deserves a permanent TNF artifact. The test is reusable system value.

---

## Interactive Mode

Interactive is the default.

At session start:

1. respond to the user;
2. read Stage A from `FRONTLOAD_MANIFEST.md` as needed;
3. show/derive a compact repository + freshness orientation before mutation;
4. classify when persistence/mutation becomes relevant;
5. hydrate only the current task;
6. staff capabilities only when useful.

Do **not** automatically:

- git pull;
- ingest full codebase maps;
- run all host scans;
- load all memory/ledgers;
- execute a full assimilation sweep.

Heavy work can run when requested, in swarm mode, or at the point it becomes a dependency.

---

## Swarm / Autonomous Mode

For coordinated or long-running work:

1. run Gate 0;
2. load Stage A and task-relevant Stage B/C frontload;
3. validate handoff freshness;
4. classify planned artifacts;
5. hydrate current repository/product boundaries;
6. discover/staff required capabilities;
7. execute work packages;
8. verify;
9. perform ASSIMILATE_CHECK V2;
10. write Turn End V2.

Autonomous execution does not override existing destructive-operation, credential, elevation, publication, or operator-approval boundaries.

---

## Repository Publication

All TNF development lands in `whodaniel/tnf-monorepo`.

After canonical development is merged:

```bash
pnpm run sync:repos:dry-run
```

Then use the repository's controlled publication workflow:

- public open runtime → generated `sync/open-runtime` PR into `The-New-Fuse`
- proprietary control-plane extract → generated update to `fuse-control-plane`

Never “keep repos in sync” by manually repeating feature commits in downstream targets.

---

## Turn End Contract

Use:

```bash
node scripts/turn-end-v2.cjs
```

Turn End records:

- canonical repository identity;
- branch/head;
- three-axis classification;
- capabilities required/staffed;
- publication impact;
- freshness receipts;
- changed paths;
- verification;
- continuation/next actions.

Schema:

`docs/protocols/schemas/tnf-session-handoff.schema.json`

Current spec:

`tnf/session-handoff/0.2`

---

## Enforcement Targets

These surfaces must remain aligned with Turn Zero:

- `docs/protocols/TURN_END_MANDATE.md`
- `docs/protocols/STATE_FRESHNESS_MANDATE.md`
- `docs/protocols/state-freshness.registry.json`
- `docs/protocols/ADAPTABLE_HOST_VERIFICATION.md`
- `docs/core/FRONTLOAD_MANIFEST.md`
- `docs/product/TNF_PRODUCT_BOUNDARY.md`
- `docs/REPO_SEPARATION.md`
- `scripts/protocols/turn-zero-v2-gate.cjs`
- `scripts/tnf-onboard-twip.cjs`
- `scripts/turn-end-v2.cjs`
- `docs/protocols/schemas/tnf-session-handoff.schema.json`

## Operator-facing principle

**Establish just enough verified authority, context, classification, and capability to safely take the next action.**
