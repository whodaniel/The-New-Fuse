# TNF Agent Registry Reference

## Purpose

Operate a repeatable pipeline from agent definition files to backend registry records.

## Source Files

- `.claude/agents/*.md`
- `config/ai-agents/*.json`

## Build Snapshot

```bash
pnpm agents:registry:build
```

Build artifacts:

- `data/agent-registry/agents.json`
- `data/agent-registry/agent_capabilities.json`
- `data/agent-registry/agent_relationships.json`
- `data/agent-registry/agent_tags.json`
- `data/agent-registry/registry_summary.json`
- `data/agent-registry/schema.sql`

## Import Snapshot

API endpoint:

```http
POST /api/agent-registry/import/snapshot
```

Headers:

- `x-admin-token` (optional; required when `AGENT_REGISTRY_IMPORT_TOKEN` is configured)

Body:

```json
{
  "snapshotPath": "data/agent-registry/agents.json",
  "onlyType": "external"
}
```

CLI wrapper:

```bash
pnpm agents:registry:import
```

## Drift Check (CI)

```bash
pnpm agents:registry:check
```

This command rebuilds the snapshot and fails on diff in `data/agent-registry`.

## Operational Constraints

- Keep snapshot paths repo-local.
- Avoid absolute host paths in generated JSON.
- Prefer idempotent import behavior (update existing, create missing).
