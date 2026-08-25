`[CLASS:PUBLIC_CONTRACT] [STATUS:ACTIVE] [DOC_TYPE:PROTOCOL_STANDARD] [VISIBILITY:PUBLIC]`

# TNF Open Agent Core

**Protocol ID:** `TNF_OPEN_AGENT_CORE`  
**Purpose:** Preserve the reasoning and protocol capabilities that make the open-source TNF agent useful while keeping hosted optimization and proprietary orchestration-intelligence implementations behind explicit contracts.

## Non-lobotomy invariant

The open TNF agent MUST NOT be reduced to a relay client, schema bundle, or thin hosted-service shell.

A compliant open runtime must remain capable of completing the public TNF control loop locally:

`RESPOND → ORIENT → CLASSIFY → HYDRATE → STAFF → ACT → VERIFY → PROPAGATE → HANDOFF`

Hosted TNF may improve or optimize decisions, but it must not be required for the open agent to preserve TNF protocol semantics or safely perform ordinary local/public work.

## Public logical railway

The open agent preserves the following semantic state where relevant:

1. **Intent** — what outcome is being pursued.
2. **Authority** — what actor/policy permits an action.
3. **Context** — the bounded information needed now.
4. **Capability** — what ability is required and which providers can supply it.
5. **Boundary** — where data, authority, mutation, cost, and responsibility may flow.
6. **Action** — the bounded operation being performed.
7. **Receipt** — evidence of what actually happened.
8. **Handoff** — enough continuation state for an authorized next actor/session.

These are public interoperability semantics. A compatible implementation may represent them differently internally.

## Public logical gateways

### Gateway A — Orientation

Before consequential action, establish the current repository/runtime surface and the minimum relevant state. Do not require a full-codebase context dump.

### Gateway B — Classification

Before persistence, publication, or cross-boundary mutation, classify the work and destination. Public runtime source must not become a carrier for private/restricted or private-control-plane implementation.

### Gateway C — Context hydration

Hydrate task-relevant current context. Prefer pointers/references where appropriate. Treat volatile facts as observations with freshness rather than timeless truth.

### Gateway D — Capability staffing

Discover eligible capability providers. Apply hard capability/authority/boundary requirements first. Selection among eligible providers may use:

- explicit operator choice;
- an inspectable local policy;
- user-supplied configurable weights/preferences;
- an optional hosted TNF policy contract.

The public runtime does not require the hosted TNF scoring algorithm.

### Gateway E — Authority and ownership

Capability never grants authority. Shared mutable resources require collision/ownership awareness appropriate to the resource before mutation.

### Gateway F — Action

Perform only the scoped action permitted by the current authority and boundary state.

### Gateway G — Verification

Verify consequential outcomes empirically. Distinguish:

- `verified`
- `reported`
- `inferred`
- `unknown`

A tool invocation succeeding is not automatically proof that the intended system state changed correctly.

### Gateway H — Propagation

Promote reusable learning only after removing private/context-specific material and checking that the generalized mechanism belongs in the public runtime.

### Gateway I — Handoff

When work continues across agents/sessions, preserve current state, receipts, unresolved dependencies, ownership, and next actions.

## Local autonomy requirements

A TNF open-source installation must support the following without access to private TNF source:

- start and run the TNF CLI;
- load and verify its public logical rail;
- perform Turn Zero orientation;
- classify public/local work;
- discover local/enlisted agents/providers/capabilities;
- coordinate agents through public message/relay/contracts;
- maintain public/local context and memory according to public boundary rules;
- run tools subject to local authority/permission controls;
- produce receipts and handoffs;
- operate under deterministic/operator-configured local policy;
- clearly identify hosted-only capabilities rather than fabricating them.

## Open policy extension point

The public runtime SHOULD permit an operator or third party to supply a local decision policy without modifying TNF core semantics.

A local policy may rank otherwise-eligible choices using operator-owned preferences such as latency, cost, locality, reliability, or other declared observations. The policy and its parameters should be inspectable by the operator.

TNF's proprietary hosted policy may use additional evidence, learned parameters, graph reasoning, or optimization. Public compatibility depends on the contract/receipt, not disclosure of that implementation.

## Public/private composition rule

Public:

- semantic grammar required for compatibility;
- lifecycle and gates;
- authority/capability separation;
- context/receipt/handoff contracts;
- local tool and agent coordination;
- explicit local policy extension points;
- safe deterministic fallbacks;
- compatibility/conformance tests.

Private/hosted by default:

- proprietary scoring weights or learned ranking models;
- private graph inference/reachability implementation;
- evidence weighting/promotion algorithms beyond public evidence states;
- private authority/trust synthesis;
- proprietary context ranking;
- provider/model optimization policy;
- business/value optimization and counterfactual architecture reasoning;
- recursive internal architecture-evolution machinery.

## Failure semantics

If a hosted-only optimizer or policy is unavailable, the open agent must not silently stop reasoning.

It should instead choose one of:

- execute under a valid local/operator policy;
- request operator choice;
- use a safe deterministic fallback when semantics permit;
- defer/deny the specific action if the missing decision authority is consequential.

## Conformance test

An open TNF distribution fails this protocol if any of the following are true:

- its Stage A/public agent rails are missing;
- `tnf:onboard` cannot load/verify those rails;
- ordinary public/local work requires access to the private monorepo;
- the agent cannot perform the public lifecycle without the hosted SaaS;
- capability is treated as authority;
- missing hosted optimization is treated as absence of all local agency;
- public compatibility depends on proprietary implementation source rather than a documented contract.
