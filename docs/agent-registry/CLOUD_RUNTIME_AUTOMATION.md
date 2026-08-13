> **⚠️ CLOUD_RUNTIME IS NO LONGER USED.** TNF has migrated to GCP (Cloud Run) +
> Cloudflare (Pages/Workers) + Supabase (PostgreSQL) + Upstash (Redis). See
> `/CLOUD_MIGRATION_BLUEPRINT.md` for current infrastructure. This document is
> preserved for historical reference only.

# Agent Registry CloudRuntime Automation

## Command

Run from repo root:

```
pnpm agents:registry:cloud_runtime
```

## Requirements

- CloudRuntime CLI installed and logged in.
- Backend service reachable with `/health`.
- `AGENT_REGISTRY_IMPORT_TOKEN` set if the API requires an admin token.

## Configuration (optional)

```
AGENT_REGISTRY_SERVICE=backend
AGENT_REGISTRY_ENVIRONMENT=production
AGENT_REGISTRY_API_BASE=https://backend-production-xxxx.thenewfuse.com
AGENT_REGISTRY_HEALTH_PATH=/health
AGENT_REGISTRY_AUTO_COMMIT=1
AGENT_REGISTRY_AUTO_PUSH=1
AGENT_REGISTRY_IMPORT_TOKEN=your-token
```

## CloudRuntime cron

`cloud_runtime.toml` includes a backend cron that calls:

```
POST /api/agent-registry/import/snapshot?token=${AGENT_REGISTRY_IMPORT_TOKEN}
```

Set `AGENT_REGISTRY_IMPORT_TOKEN` in CloudRuntime so the cron call is authorized.

## Notes

- The import endpoint reads `data/agent-registry/agents.json` from the deployed
  container. If you update the snapshot locally, deploy the change before
  running the import.
- The import token can be sent as `x-admin-token` header or `token` query param.
