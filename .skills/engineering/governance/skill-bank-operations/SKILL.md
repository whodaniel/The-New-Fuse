---
name: skill-bank-operations
description: |
  Operate and troubleshoot TNF skill-bank automation around scripts/skills/*.
  Use when tasks involve syncing skill inventories, generating snapshots,
  querying the skill index, ingesting/retrying pending imports, or running the
  supervisor loop. Clarify the distinction between executable script namespace
  (scripts/skills) and loadable skill definitions (.skills/**/SKILL.md and
  .agent/skills/**/SKILL.md).
primary_type: governance
secondary_tags:
  - deterministic
  - interoperability
category: engineering/governance
risk_tier: medium
harmful_pattern_detection: true
harmful_pattern_signals:
  - script-as-skill-confusion
  - snapshot-sprawl
  - ingest-drift
metadata:
  source: tnf-permanent
  source_snapshot: none
  status: permanent
---

# Skill Bank Operations

Use this skill to run and govern the TNF skill-bank pipeline.

## Canonical Separation

- Skill definitions: `.skills/**/SKILL.md`, `.agent/skills/**/SKILL.md`
- Skill-bank automation scripts: `scripts/skills/*`
- Generated artifacts: `.agent/skill-bank/*`
- Generated snapshots: `.agent/skill-bank/snapshots/*`

Treat `scripts/skills/*` as executable tooling, not as skill-definition roots.

## Standard Workflow

1. Sync skill inventory and generate artifacts.

```bash
pnpm run skills:bank:sync
```

2. Check high-level status.

```bash
pnpm run skills:bank:status
```

3. Query for a skill by name/id text.

```bash
node scripts/skills/skill-bank-query.cjs "<query>"
```

4. Ingest index output and retry pending records.

```bash
pnpm run skills:bank:ingest
pnpm run skills:bank:retry-pending
```

5. Run continuous reconciliation loop when needed.

```bash
pnpm run skills:bank:supervisor:start
pnpm run skills:bank:supervisor:status
pnpm run skills:bank:supervisor:stop
```

## Adaptability Guardrails

- Allow new persona/skill definitions by default when they follow `SKILL.md` format.
- Do not hardcode closed allowlists for skill IDs or categories.
- Validate shape and normalization, not static enumerations.
- Warn on unknown categories/tags first; auto-register pending taxonomy updates.
- Keep drift checks directional:
  - block destructive regressions (missing required fields, broken references)
  - do not block additive growth (new skills, new tags, new categories)

## Misclassification Checks

Run these checks before concluding discovery is healthy:

```bash
find scripts/skills -name SKILL.md
find .agent/skills -name SKILL.md | wc -l
find .skills -name SKILL.md | wc -l
```

Expected pattern:

- `scripts/skills` returns no `SKILL.md`
- Skill roots return valid `SKILL.md` counts
