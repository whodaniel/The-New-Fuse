---
name: agent-registry-manager
description: Build, refresh, and import the TNF agent registry from `.claude/agents` and `config/ai-agents` into backend storage, including capability/tag extraction and drift checks. Use when Codex needs to register agents in bulk, regenerate registry snapshots, import snapshots through `/api/agent-registry/import/snapshot`, or verify registry consistency in CI.
---

# Agent Registry Manager

Use this skill to keep The New Fuse agent registry current and deterministic.

## Workflow

1. Build snapshot artifacts from source definitions.
2. Review snapshot totals and spot anomalies.
3. Import snapshot into backend registry API.
4. Verify registry state and run drift checks.

## Commands

Run from repo root:

```bash
pnpm agents:registry:build
pnpm agents:registry:check
pnpm agents:registry:import
```

Direct build script:

```bash
node scripts/agent-registry/build-agent-registry.mjs
```

Direct import script:

```bash
node scripts/agent-registry/import-agent-registry-snapshot.mjs
```

## Input Sources

- `.claude/agents/*.md` for local agent definitions.
- `config/ai-agents/*.json` for external agent profiles.

## Output Artifacts

- `data/agent-registry/agents.json`
- `data/agent-registry/agent_capabilities.json`
- `data/agent-registry/agent_relationships.json`
- `data/agent-registry/agent_tags.json`
- `data/agent-registry/registry_summary.json`
- `data/agent-registry/schema.sql`

## Import API

- Endpoint: `POST /api/agent-registry/import/snapshot`
- Optional header: `x-admin-token` (validated when `AGENT_REGISTRY_IMPORT_TOKEN` is set)
- Body:
  - `snapshotPath` (repo-relative; defaults to `data/agent-registry/agents.json`)
  - `onlyType` (optional type filter)

## Safety Rules

- Keep all paths repo-relative in outputs and metadata.
- Do not write absolute local paths into registry artifacts.
- Treat malformed agent files as skippable records and continue.
- Prefer idempotent upsert behavior on imports.

## Validation

- Run `pnpm agents:registry:check` to regenerate and ensure zero diff for `data/agent-registry`.
- Confirm `registry_summary.json` totals are reasonable before import.

## References

- Load `references/tnf-agent-registry.md` for endpoint contracts and operational notes.
