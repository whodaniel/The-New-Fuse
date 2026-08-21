# Contextual Evolution Log — 2026-08-18

`[CLASS:PRIME] [STATUS:ACTIVE] [DOC_TYPE:EVOLUTION_LOG] [VISIBILITY:COLLECTIVE]`

## Scope

This report records the durable TNF architectural changes and design conclusions established on 2026-08-18. It deliberately separates:

- **GitHub-verified canonical state**;
- **operator-supplied active-agent reports** not yet independently canonicalized;
- **generalized architectural synthesis** derived from those observations.

Private/operator-specific life, medical, financial, relationship, or benefits context is intentionally excluded. Only product-neutral structural learning is recorded.

## Canonical repository evidence

As observed from GitHub on 2026-08-18, the canonical development repository is `whodaniel/tnf-monorepo` and the following commits are present on current `main` in this order:

| Commit | Durable change |
|---|---|
| `9107fe0debe89644173e6889e749e28f72da3648` | Capability-first harness staffing: staff required capabilities rather than named agents. |
| `a2a094d5adaf9a76a56519dcd248220f2e4061db` | Open-runtime sync no longer hard-codes an operator home path. |
| `732050a0f2229450fc55e7ccc07ec7d0f783797f` | Turn Zero V2: repository-aware progressive lifecycle, classification, scoped hydration, capability staffing, freshness, handoff 0.2, privacy-preserving assimilation. |
| `c993a2c42153cda9ab1d807bad6cb2fed05ed2c4` | Public-boundary correction: distinguish canonical development, owned publication targets, and legitimate external/public forks. |
| `b932f5ce5f93eeb59ecf2e3c7f06e66ab2aa4b6c` | Jules local routing retargeted to `tnf-monorepo`; public persona-PR cleanup behavior added for downstream publication. |

These commits constitute the current evidentiary anchor for today's protocol evolution.

## Turn Zero V2 evolution

The original Turn Zero model was revised from an eager frontload ritual into a progressive execution lifecycle:

```text
RESPOND → ORIENT → CLASSIFY → HYDRATE → STAFF → ACT → VERIFY → PROPAGATE → HANDOFF
```

The revision established several durable rules:

1. Repository identity is a mutation gate, not a folder-name assumption.
2. Work domain, artifact destination, and data residency/sensitivity are orthogonal classifications.
3. Context is hydrated according to the task rather than by loading a generated monolithic codebase map.
4. Capabilities are staffed by available providers; named agents are adapters/providers, not protocol primitives.
5. Reusable learning can propagate only after private/context-specific data is removed.
6. State freshness must cover canonical development state and product boundaries, not only public publication state.
7. Turn End must preserve repository, classification, capability, publication, and freshness context.

## Public-boundary correction as evolutionary evidence

The first V2 repository-identity implementation correctly protected TNF's internal canonical workflow but was too absolute for a legitimate public clone/fork.

The contradiction exposed a missing relational distinction. V2 was corrected to recognize at least:

- canonical internal development;
- owned downstream publication target;
- legitimate external/public fork.

This event is now a reference example for the TNF evolution rule:

> A contradiction between a locally correct rule and a valid external context is evidence that the abstraction is incomplete. Improve the abstraction rather than silently weakening the safety property.

## Publication integrity lesson

A manually constructed open-runtime preview PR was created during the V2 publication investigation. Subsequent review determined that a semantically equivalent manual export could still be byte-divergent from the canonical `scripts/sync-repos.sh` output and create later publication churn.

The preview PR was therefore closed without merge on 2026-08-18.

Durable publication rule:

```text
canonical monorepo merge
  → sync:repos dry-run
  → canonical repo-separation sync
  → generated sync/open-runtime PR
  → review/merge publication
```

A successful GitHub write is not itself proof that the write followed the authoritative publication pathway.

## Multi-agent concurrency lessons

Active-agent reports on 2026-08-18 exposed recurring shared-state hazards:

- a shared Git index can contain staged work belonging to several agents;
- lint-staged stash/restore behavior can alter staged state in ways that confuse ownership;
- broad cleanup/rebase/reset/stash operations are unsafe in a shared checkout;
- migration numbering, publication branches, handoff files, and system-process registries are shared mutation surfaces and require explicit ownership or coordination.

Generalized rule:

> Shared mutable state requires explicit ownership/claim semantics. Rational local actions are not sufficient to guarantee globally coherent state.

## Git maintenance / host-load lesson — reported state

One active maintenance agent reported:

- successful full `git gc` after mutation-guard remediation;
- `pack-refs` performs multiple transactions, including loose-ref deletions that can resemble a real `refs/stash` deletion;
- forcing every incremental pack-refs shape through the guard is not required if full maintenance succeeds;
- extreme host load should cause scheduled work to defer rather than thresholds being increased until a job happens to run.

These are recorded as **operator-supplied agent findings**, not GitHub-verifiable runtime facts. Any current host-load or gc claim must be reprobed before being treated as present state.

## External scheduler lesson — partially verified

PR/commit evidence confirms local Jules targeting was changed to `tnf-monorepo`. The active Jules session separately reported that cloud Scheduled jobs may persist outside local repo configuration and require deletion through the Jules control surface.

Generalized rule:

> Local routing changes do not prove that external SaaS scheduler state was removed. External control surfaces require their own receipts and handoff.

## Subscribe-to-Updates implementation — reported, not yet canonicalized

An active command-agent session reported an end-to-end subscription feature spanning database schema/migration, API, gateway, and frontend, with successful local build/typecheck receipts. At the time of this log, no corresponding canonical `main` commit has been established from GitHub evidence.

Therefore its status is:

- **implementation:** reported in shared working tree;
- **build:** reported successful by the active agent;
- **canonical durability:** unresolved pending agent closeout/commit ownership reconciliation.

This distinction is intentional. “Built locally” must not be silently translated to “shipped” or “canonical.”

## Persistent logical synthesis

Today's separate changes converge on a common architecture:

```text
HUMAN INTENT
  → AUTHORITY / CONSTRAINTS
  → CURRENT VERIFIED STATE
  → CLASSIFICATION
  → CONTEXT + CAPABILITIES + BOUNDARIES
  → ACTION
  → VERIFICATION
  → RECEIPTS
  → GENERALIZED LEARNING
  → HANDOFF
  → CONTINUOUS EVOLUTION
```

The detailed doctrine is now recorded in `docs/protocols/TNF_COHERENT_STATE_CONTINUITY.md`.

## Canonicality doctrine

TNF should increasingly use **proof-bearing continuity** rather than naked “single source of truth” assertions.

Canonical state means the system can show the authority, provenance, freshness, observations, and state transitions that support the claim.

This does not make all truth relative. It makes the evidence and relationship behind a claim inspectable.

## Open state after today's evolution

The following remain intentionally unresolved and must not be rewritten as completed work:

1. Canonical `sync:repos:dry-run` and canonical open-runtime publication of Turn Zero V2 have not been established by a receipt in this coordinating session.
2. External Jules Scheduled jobs require current-state verification/operator action in the Jules UI if still present.
3. The command-agent subscription feature requires final ownership/commit/migration/security closeout before canonical status can be assigned.
4. Maintenance-agent local commits/shared-index state require final closeout receipts before they can be reconciled with canonical GitHub history.
5. A later strategy pass should rank next work by impact, dependency, risk reduction, and machine/operator cost rather than continuing all discovered threads simultaneously.
