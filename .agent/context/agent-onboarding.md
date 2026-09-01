# TNF Agent Onboarding

This is the repository-local onboarding guide for AI agents. Canonical authority is `docs/protocols/TURN_ZERO_MANDATE.md`; Stage A inventory authority is `docs/core/FRONTLOAD_MANIFEST.md`.

## Standard Boot Sequence

Run from the canonical TNF repository root:

```bash
pnpm run tnf:onboard -- --task "<current task if known>"
```

The onboarder must:

- derive Stage A from `FRONTLOAD_MANIFEST.md` rather than a copied checklist;
- read/hash every Stage A rail and write `.agent/runtime-logs/turn-zero-stage-a.latest.json`;
- report repository identity/HEAD and handoff freshness;
- emit a task-scoped Stage B/C hydration plan;
- verify host injection coverage;
- attempt current capability/provider discovery.

Before write-capable work, resolve classification and use:

```bash
TNF_WORK_DOMAIN=corporate \
TNF_ARTIFACT_DESTINATION=oss_runtime \
TNF_DATA_RESIDENCY=product_state \
TNF_DATA_SENSITIVITY=public \
pnpm run tnf:onboard -- --write-ready --task "<task>"
```

For deeper harness verification:

```bash
pnpm run tnf:onboard -- --full-harness --task "<task>"
```

If host injection is missing, repair it explicitly:

```bash
node scripts/harness/provision-injection-surfaces.cjs --repair
node scripts/install-agent-frontload.cjs --repair
```

The pre-V2 `scripts/tnf-onboard.cjs` is retained only for `--legacy-full` diagnostics. It is not the Stage A authority.

## Fully Harnessed Meaning

A session is fully harnessed when it has a current manifest-derived Stage A receipt, repository/freshness orientation, a task-scoped hydration route, provider discovery, and verified host injection when applicable. It does **not** mean loading the entire TNF corpus into every session.

After context compaction, provider substitution, repository movement, manifest/rail hash changes, or authority uncertainty, rerun the standard onboarder.

## Engineering Sessions

For nontrivial engineering work, load:

`.agent/skills/tnf-engineering-context/SKILL.md`

Before introducing a new package/protocol/schema/service/workflow/storage path/agent abstraction, search the current implementation and active workstreams for the same responsibility. Prefer reconciliation over duplication.

## Multi-Agent / Source Work

When multiple agents or overlapping durable sources are involved, load:

- `docs/protocols/TNF_MULTI_AGENT_SOURCE_GOVERNANCE.md`
- `.agent/skills/tnf-source-concordance/SKILL.md`

Stable source identity is separate from titles/taxonomies/facets. Discovery does not itself authorize implementation.

## User Context / Storage

If the task touches user-context persistence, profiles, memory, local storage, or Google Drive, load the canonical user-context storage mandate/skill when present on the active branch. If absent, locate the active canonical PR/workstream before creating another provider model.

## Orientation Summary Contract

Before significant execution, report:

- canonical repo/origin and current HEAD;
- Stage A receipt status/hash;
- active directive and handoff freshness;
- task classification when persistence/mutation is involved;
- exact packages/files in scope;
- task-specific protocol/skill routes;
- active PR/workstream collision boundaries;
- required capabilities/providers;
- blockers and next safe action.

Do not wait for a second confirmation if the operator's current request already authorizes implementation.

## Runtime Configuration

Resolve repository files from the current repo root. Do not commit personal absolute paths, Drive IDs, tokens, or provider-specific credentials.

Live relay/API/Redis/provider facts are volatile. Resolve them from current environment/configuration and re-probe rather than trusting a dated prompt or memory entry.

## Guardrails

- Inspect structured state before acting.
- Verify every consequential outcome before reporting success.
- Treat another agent's claims as unverified until current evidence is inspected.
- Respect active workstream/package ownership boundaries.
- Keep private/restricted data out of default fleet hydration.
- Prefer TNF-native command routes to host-specific compatibility routes.

## Raw Agent Prompt

```text
From the canonical TNF repository root, run `pnpm run tnf:onboard -- --task "<current task>"`. Treat `docs/core/FRONTLOAD_MANIFEST.md` as the only Stage A rail inventory and `docs/protocols/TURN_ZERO_MANDATE.md` as the lifecycle/write-readiness authority. Follow the manifest-derived receipt and task-scoped routes it emits. Before mutation, verify current repository state, active workstream ownership, classification, and the exact implementation already present. Do not infer authority from old docs, labels, or chat memory; do not duplicate an active implementation. Empirically verify consequential results and leave a continuation receipt.
```
