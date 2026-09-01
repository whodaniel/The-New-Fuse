---
description: Execute manifest-derived TNF Turn Zero and refresh canonical engineering context.
---

# /frontload — TNF Context Frontload

Use at session start, after context compaction/reset, after provider substitution, after repository movement, or whenever current authority/workstream ownership is uncertain.

## Authority

- lifecycle/write readiness: `docs/protocols/TURN_ZERO_MANDATE.md`
- Stage A inventory: `docs/core/FRONTLOAD_MANIFEST.md`
- machine contract: `data/harness/onboarding-contract.json`

This workflow is only a pointer. It must not carry its own competing Stage A list.

## Execute

```bash
pnpm run tnf:onboard -- --task "<current task if known>"
```

Before mutation:

```bash
TNF_WORK_DOMAIN=corporate \
TNF_ARTIFACT_DESTINATION=oss_runtime \
TNF_DATA_RESIDENCY=product_state \
TNF_DATA_SENSITIVITY=public \
pnpm run tnf:onboard -- --write-ready --task "<task>"
```

The onboarder should return a manifest-derived Stage A hash receipt, repository/handoff freshness, task-scoped hydration plan, host-injection verification, and provider discovery.

## Task Routes

For nontrivial TNF engineering, load `.agent/skills/tnf-engineering-context/SKILL.md`.

For multi-agent/Drive/source reconciliation, load `docs/protocols/TNF_MULTI_AGENT_SOURCE_GOVERNANCE.md` and `.agent/skills/tnf-source-concordance/SKILL.md`.

For source-library maintenance, load `.agent/skills/tnf-source-library-refresh/SKILL.md`.

For user-context/storage work, use the canonical storage mandate/skill if present; otherwise inspect the active canonical PR/workstream rather than creating a parallel provider path.

## Completion

Report what was inspected, current repo/HEAD, active collision boundaries, exact changes, verification actually executed, unverified assumptions, and continuation state.
