# TNF Swarm Orientation Entrypoint

`[CLASS:PRIME] [STATUS:ACTIVE] [DOC_TYPE:ORIENTATION] [DOMAIN_SCOPE:TNF]`

This document is the compact front door for coding agents, orchestration agents, external teammate runtimes, and TNF edge agents. It does not replace live repository hydration or Turn Zero. It tells an entering actor where current authority and high-value context live so the actor can hydrate progressively instead of reconstructing TNF from chat history.

## 1. Canonical source and publication topology

- Development authority: `whodaniel/tnf-monorepo`.
- Public open-runtime publication target: `whodaniel/The-New-Fuse`.
- Private proprietary publication target: `whodaniel/fuse-control-plane`.
- Refresh repository/branch/HEAD state before mutation. Remembered SHAs, folder names, chat transcripts, or downstream copies are not current-state authority.

## 2. Required operating posture

Use Inspect -> Act -> Verify. Capability is not authority. Message delivery is not shared meaning. Preserve human intent, authority scope, provenance, freshness, verification receipts, and handoff continuity.

Turn Zero lifecycle:

`RESPOND -> ORIENT -> CLASSIFY -> HYDRATE -> STAFF -> ACT -> VERIFY -> PROPAGATE -> HANDOFF`

Hydrate only the authoritative context needed for the present task.

## 3. Read these current-state surfaces first

1. `docs/protocols/LIVING_STATE.md` — live directive and synchronized state.
2. `docs/protocols/reports/SESSION_HANDOFF_LATEST.json` and `.md` — continuation baton and resume checklist.
3. `docs/protocols/AGENT_STATUS_LEDGER.md` — active agent/fleet status and next-agent focus.
4. `docs/protocols/TURN_ZERO_MANDATE.md` — entry lifecycle and authority rules.
5. `docs/protocols/TURN_END_MANDATE.md` — closeout/propagation/handoff discipline.
6. `docs/operations/CANONICAL_RECONCILIATION_STATUS_2026-08-21.md` — latest engineering reconciliation receipt.
7. `docs/protocols/TNF_COHERENT_STATE_CONTINUITY.md` — persistent logical kernel and proof-bearing continuity doctrine.
8. `docs/protocols/PROTOCOL_MAP.md` — broad protocol inventory/index; reconcile it against post-2026-08-13 V2 doctrine before treating its tier diagram as the only architecture view.
9. `docs/protocols/reports/PROTOCOL_MATRIX_CONVERGENCE_2026-08-21.md` — current reconciliation of #139/#140 with the established TNF matrix.
10. `.agent/AGENTS.md` — engineering principles and available TNF skills.

If any of these conflict with observed live state, do not silently choose one. Re-verify and record the conflict.

## 4. Current convergence direction

Issues `#119`, `#121`, and `#139` define the current cross-agent/orientation architecture. Draft PR `#140` begins a protocol implementation, but it remains subject to contract-level overlap reconciliation before becoming canonical.

Do **not** treat the current direction as a replacement linear stack. The durable model is an orthogonal matrix:

- **semantic kernel:** Intent / Authority / Context / Capability / Boundary / Action / Receipt / Handoff, plus relational interaction semantics;
- **lifecycle:** RESPOND / ORIENT / CLASSIFY / HYDRATE / STAFF / ACT / VERIFY / PROPAGATE / HANDOFF;
- **cross-cutting invariants:** provenance, freshness, authority, classification/privacy/residency, ownership, verification/confidence, cost and recourse;
- **gates/evaluation:** Turn Zero mutation readiness, locked-document vetting, intelligence Gauntlet/Rubric, and other scope-specific policies;
- **proof-bearing records:** claims, observations, receipts, handoffs, context references, capability/activity snapshots and reconciliation findings;
- **providers/transports:** Redis, WebSocket, MCP, A2A, GitHub, model hosts and adapters;
- **materialized projections/applications:** Personal Operational Graph, OrientationSnapshot, CLI, desktop, browser, voice and API surfaces.

The intended runtime feedback loop may still be summarized as:

`Sources/Observations -> Proof-bearing Records -> Reconciliation -> Personal Operational Graph read model -> Orientation -> Lifecycle/Interaction -> Authorized Action -> New Receipts`

but this loop must not be mistaken for the master ontology.

The Personal Operational Graph is a **derived, subject/workspace-scoped materialized read model**, not a new source of truth. `OrientationSnapshot` is primarily a projection used by the existing `ORIENT` phase; it does not replace Turn Zero.

Primary orientation concepts remain:

- **Now** — current focus, active work, blockers, running agents/pipelines.
- **Network** — agents, projects, goals, tasks, resources, repositories, integrations and pipelines.
- **Changes** — deltas since the last verified orientation.
- **Reconcile** — contradictions, staleness, duplicate/disconnected state, missing evidence.
- **Ask** — high-information questions required to improve TNF's model.
- **Act** — safe recommended actions with authority/cost/privacy boundaries visible.

## 5. Tier-0 interaction doctrine

Before consequential work, establish:

- **Intent** — what human/product outcome is being preserved?
- **Authority** — who authorized the action and at what scope?
- **Context** — which current evidence is actually needed?
- **Capability** — what abilities are required independent of provider identity?
- **Boundary** — where may code/data/state/responsibility flow?
- **Action** — what bounded mutation is proposed?
- **Receipt** — what evidence proves what actually occurred?
- **Handoff** — what must survive for the next actor?

Communication acts are meaningful state transitions. Distinguish REQUEST, ACK, CLARIFY, CONFIRM, COMMIT, DELEGATE, REFUSE, CHALLENGE, REPAIR, ESCALATE, VERIFY, HANDOFF, and REVOKE rather than treating all messages as undifferentiated text.

## 6. Existing gate chains must remain distinct

Do not collapse every TNF gate into one generic status field.

The locked document-vetting chain is:

`DEFINE/CLASSIFY -> NAMESPACE -> FLAG -> LINK/ATTRIBUTE -> CHALLENGE/VERIFY -> ACCEPT/SUPERSEDE`

The intelligence Gauntlet/Rubric chain is approximately:

`PRIVATE/EXTERNAL INTAKE -> AUTH/PERMISSIONS -> PII SCRUB -> DENSITY/UTILITY -> ATTRIBUTION -> VISIBILITY -> GRADUATED DISTILLATION`

Turn Zero separately gates mutation readiness through live repository identity, classification, freshness, authority and capability staffing.

These evaluations may emit receipts into the operational graph; the graph does not reinterpret or bypass their policy scopes.

## 7. Shared-state/concurrency rules

- Do not reset, clean, stash/pop, rebase, broadly restore, or bulk-merge a shared checkout without exclusive ownership.
- Do not assume staged paths or global handoff files belong to you.
- Treat publication branches, migration numbers, registries, schedulers, and global handoff artifacts as shared mutation surfaces.
- Prefer scoped integration branches. Current release-train policy expects `integration/` or approved `hotfix/` lanes.
- If ownership is ambiguous: inspect, report, and hand off instead of cleaning by inference.

## 8. Evidence and privacy discipline

Existence is not freshness. A commit existing is not proof it is current main; a process existing is not proof it is healthy; a successful local build is not proof it is canonical or shipped.

Use terminology owned by the relevant canonical protocol. Do not casually introduce new verification/confidence vocabularies when State Freshness, authority, handoff, UFTE, or another established contract already owns the semantics.

Universalize reusable mechanisms, not private operator/client context. Do not propagate credentials, cookies, raw private histories, personal/legal/medical/financial material, or unsupported provider state into public/product contracts.

## 9. ChatGPT/other external artifact promotion rule

ChatGPT Library files, conversation attachments, Claude artifacts, Gemini artifacts, Cursor scratch files, and local agent notes are discovery/evidence surfaces until promoted. They are not canonical merely because an advanced model created them.

Promotion pipeline:

`inventory -> classify -> deduplicate/reconcile -> extract reusable claims -> sanitize -> commit canonical source -> link provenance -> verify -> index/handoff`

Prefer Markdown/JSON/source files for canonical swarm consumption. Keep presentation derivatives (PDF/DOCX/ZIP) outside source control unless the binary itself is a required product artifact. When a distribution package contains doctrine that already exists in repo-native source, link the source rather than duplicating the binary.

## 10. Recently recovered external doctrine to assimilate

A ChatGPT-generated Tier-0 distribution package dated 2026-08-18 contains useful doctrine that should be treated as an alignment aid, not newer authority than live repository state. Its high-value reusable claims are already represented or reconciled by `TNF_COHERENT_STATE_CONTINUITY.md` and the convergence report:

- communication belongs at the semantic/relational layer above transport;
- capability and authority must remain separate;
- context should be scoped, referenced, and fresh;
- canonicality should be proof-bearing through provenance/receipts;
- shared mutable state requires explicit ownership;
- contradiction is information that should improve abstractions;
- handoff is part of execution rather than paperwork afterward;
- preserve legitimate human intent across delegated action;
- orient and staff by required capabilities, not historical vendor/agent names.

Agents should reconcile these claims against current protocol docs before proposing duplicate frameworks.

## 11. Delegation lanes available now

Agents may independently contribute through bounded lanes without waiting for one model to carry the entire effort:

- **Protocol-convergence lane:** audit #140 fields against State Freshness, authority, classification, UFTE/entity identity, context-reference, handoff/receipt, and cross-agent activity contracts before generator wiring.
- **Protocol-map lane:** inventory post-2026-08-13 changes and prepare a challenge-aware `PROTOCOL_MAP.md` refresh rather than replacing the hierarchy silently.
- **Projection lane:** identify existing TNF state sources that can populate a Personal Operational Graph locally without paid provider polling or duplicate authority.
- **CLI lane:** only after contract convergence, design/implement deterministic `tnf orient --json` and `tnf reconcile --json` over the projection.
- **Turn Zero lane:** map `OrientationSnapshot` into progressive Turn Zero hydration without changing the locked lifecycle casually.
- **Desktop/UX lane:** prototype Now / Network / Changes / Reconcile / Ask / Act while keeping UI state non-authoritative.
- **Adapter lane:** map GitHub/local TNF first, then provider adapters under #121 using established snapshots/receipts and explicit permission boundaries.
- **Artifact-assimilation lane:** audit external model artifacts through the existing Gauntlet/vetting concepts, eliminate duplicates, and promote only canonical reusable source.

Each lane must leave a durable receipt: branch/commit/PR or issue comment, evidence, tests/probes performed, unresolved conflicts, and a continuation handoff.

## 12. Handoff minimum

A useful swarm handoff includes repository, origin, branch, HEAD, classification/domain/destination/residency/sensitivity, required and staffed capabilities, completed/pending/blocked/waiting-on, next actions, verification receipts, and claimed/released shared resources.

Do not require the next actor to reconstruct reality from a chat transcript.
