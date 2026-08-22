---
name: tnf-engineering-context
category: tnf-platform
version: 1.1.0
---

# TNF Engineering Context Orchestrator

Use this meta-skill for nontrivial TNF engineering, architecture, debugging, implementation, technical review, or handoff work.

It does **not** replace Turn Zero, source concordance, source-library refresh, storage governance, resource convergence, or package-specific skills. It composes them so an engineering session starts from current authority and does not fork TNF conceptually.

## Core invariant

**Refresh current authority, understand what already exists, hydrate only what is relevant, respect concurrent ownership, make the smallest coherent change, empirically verify it, and leave a continuation receipt.**

## Entry

1. Run the canonical onboarder from the repository root:

   ```bash
   pnpm run tnf:onboard -- --task "<task>"
   ```

2. Before mutation, resolve classification and use write-ready mode:

   ```bash
   TNF_WORK_DOMAIN=corporate \
   TNF_ARTIFACT_DESTINATION=oss_runtime \
   TNF_DATA_RESIDENCY=product_state \
   TNF_DATA_SENSITIVITY=public \
   pnpm run tnf:onboard -- --write-ready --task "<task>"
   ```

3. Treat `docs/core/FRONTLOAD_MANIFEST.md` as the only Stage A rail inventory. Do not recreate a competing startup list in this skill.

## Engineering orientation

Before significant execution, establish:

- canonical repository/origin and current HEAD;
- Stage A hydration receipt and rail hashes;
- active directive and handoff freshness;
- three-axis classification when persistence/mutation is involved;
- exact packages/files in scope;
- task-relevant protocol/product rails;
- active PRs/workstreams touching the same responsibility;
- collision/ownership boundaries;
- required capabilities/providers;
- blockers and the next safe action.

## Do-not-reinvent gate

Before proposing a new package, protocol, schema, service, workflow, storage path, agent role, or abstraction:

1. search current code for the responsibility, not only the proposed name;
2. inspect active PRs/handoffs/workstreams for overlapping implementation;
3. classify the discovered state as `existing`, `renamed`, `retired`, `partial`, `missing`, or `unresolved`;
4. extend/reconcile the current implementation when possible;
5. create a new abstraction only when it removes overlap rather than adding another parallel path.

## Task-scoped composition

### Multiple agents / overlapping sources

Read:

- `docs/protocols/TNF_MULTI_AGENT_SOURCE_GOVERNANCE.md`
- `.agent/skills/tnf-source-concordance/SKILL.md`

Stable source identity and descriptive observations are separate. Google Drive File ID is identity for Drive objects. Labels such as `[CORE-TNF]`, `Canon`, `Master`, `Current`, or `Aligned` do not establish authority.

### Source-library or Drive distribution maintenance

Use `.agent/skills/tnf-source-library-refresh/SKILL.md`. Do not duplicate its refresh pipeline here.

### Local agent resource consolidation / host internals

Read:

- `docs/protocols/TNF_AGENT_RESOURCE_CONVERGENCE_PROTOCOL.md`
- `.agent/skills/tnf-agent-resource-convergence/SKILL.md`
- `data/harness/agent-resource-fabric.json`

Use the TNF Agent Resource Fabric when the task involves duplicated skills/prompts/rules/templates, mapping locally installed CLI/desktop harness internals, reducing per-host resource copies, or adding a new host adapter. Reusable read-mostly bytes may be content-addressed once; secrets and opaque/stateful vendor stores require their own explicit policy and must not be blindly deduplicated. Unknown hosts remain discovery-required until their actual supported surfaces are verified.

### User context / persistence / local or Google Drive storage

If present on the active branch, read:

- `docs/protocols/USER_CONTEXT_STORAGE_MANDATE.md`
- `.agent/skills/tnf-user-context-storage/SKILL.md`

If absent, locate the active canonical PR/workstream before inventing provider-specific paths or another storage contract.

### Dynamic memory

Use the harness memory layer only when task-relevant. Dynamic recall is a clue source, not a substitute for current code or authority. Stateful vendor histories/"brains" discovered during resource-convergence work route through explicit memory/export/compaction adapters rather than static file deduplication.

## Concurrent ownership

Another agent/provider owning a package or active workstream is a collision boundary, not an invitation to race it.

- inspect the live branch/PR/receipt;
- work in non-overlapping areas where possible;
- coordinate an explicit handoff when overlap is unavoidable;
- never trust an ownership or completion claim without a current receipt.

## Verification

Never claim build/test/install/deploy/sync/runtime success from an edit or command invocation alone.

Record:

- what was inspected;
- what changed and where;
- checks actually executed and their results;
- checks authored but not executed;
- assumptions remaining unverified;
- commits/branches/PRs;
- source/protocol/handoff updates required;
- exact continuation instructions.

## Rehydration triggers

Rerun onboarding after:

- context compaction;
- provider/session substitution;
- repository movement;
- Stage A manifest/rail hash changes;
- uncertainty about current authority or workstream ownership.

## Privacy

Universalize reusable mechanisms, not private facts. Personal, client, tenant, legal, health, financial, credential, or other restricted context stays out of default engineering hydration unless explicitly required and authorized.
