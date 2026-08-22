# TNF Session Handoff — Turn Zero / Full Harness

**Spec:** `tnf/session-handoff/0.2`  
**Handoff:** `4a465e39-52b6-48b8-b0c6-4bc75e7b99a2`  
**Canonical basis:** `whodaniel/tnf-monorepo` `main` @ `db8d5f52d30692ccb1b9bfbcbd24b55b50291d0a`  
**Created:** 2026-08-22T12:49:00Z

## Current state

Turn Zero V2 is now the canonical manifest-derived onboarding entrypoint for fresh TNF agent sessions. Stage A comes only from `docs/core/FRONTLOAD_MANIFEST.md`, current rail bytes are SHA-256 receipted, repository/handoff freshness is reported rather than assumed, and Stage B/C context stays task-scoped.

PR #156 merged the full-harness onboarding model, machine `data/harness/onboarding-contract.json`, host-pointer alignment, and `tnf-engineering-context` meta-skill. PR #157 made handoff freshness relation-aware and aligned the machine harness inventory. PR #159 added a fail-closed required-route integrity gate: every `taskRoutes[].load` target in the onboarding contract must resolve before onboarding passes; explicitly optional `loadIfPresent` routes remain non-blocking.

Harness-critical routing no longer depends on the broad generated `.agent/SKILL_MANIFEST.md` being freshly regenerated. The machine onboarding contract directly names the specialist routes and the onboarder now verifies them.

## Verification

- PR #156 focused onboarding-contract suite: **14/14 passed locally** before merge.
- PR #157 focused handoff relation suite: **10/10 passed locally** before merge.
- PR #159 focused onboarding-route suite: **3/3 passed**, plus JavaScript syntax checks.

These prove repository-side behavior. They do **not** prove that every installed host context file on the operator machine has already been repaired to the latest pointer block.

## Active collision boundaries

- `packages/workflow-builder`: local Claude-reported active ownership. Refresh its latest Git receipt before touching overlapping package/canvas/adapter files.
- user-context storage: PR #151 plus dependent PR #153. Continue that stack and require executable verification before promotion; do not create a parallel local/Google Drive provider architecture.

## Required continuation

1. Run `pnpm run tnf:onboard -- --task "<current task>"` from canonical `tnf-monorepo` before consequential work.
2. On the operator machine run `node scripts/harness/provision-injection-surfaces.cjs --repair`.
3. Then run `pnpm run tnf:onboard -- --full-harness --task "host propagation verification"` and preserve the resulting receipts.
4. Regenerate `.agent/SKILL_MANIFEST.md` repository-locally with `node scripts/skills/build-skill-manifest.cjs`; this is discovery-catalog freshness, not Stage-A authority.
5. Continue Claude's workflow-builder stream from its newest verified Git state.
6. Continue PR #151/#153 on their existing storage-provider stack and run their authored tests before promotion.
7. Refresh shared Drive Agent Coordination and TNF Engineering Context/source-library pointers whenever canonical `main` advances materially.
