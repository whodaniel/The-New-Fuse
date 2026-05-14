# Hybrid Registry Doc Import Runbook

## What this does

This pipeline keeps TNF retrieval hybrid and local-first:

- Vector index: `pgvector` table (`tnf_agent_profile_vectors`) in Postgres.
- Knowledge graph signal: built at query time from agent trait overlaps (skills,
  capabilities, tags, MCP IDs, type).

No outside vector database is required.

## When to run

Run this after any meaningful update to:

- `.agent/agents/*.md`
- `.claude/agents/*.md`
- `config/ai-agents/*.json`
- `config/agents/*.json`

Also run it before release/deploy so hybrid retrieval reflects current docs.

## One-command refresh

From repo root:

```bash
pnpm agents:registry:refresh-hybrid
```

Remote target example:

```bash
AGENT_REGISTRY_API_BASE=https://api-production-48f1.thenewfuse.com \
AGENT_REGISTRY_IMPORT_TOKEN=your-token-if-required \
pnpm agents:registry:refresh-hybrid
```

Optional full rebuild:

```bash
pnpm agents:registry:refresh-hybrid --reindex-all
```

## Scheduled refresh + alerting (recommended)

Install an idempotent cron loop (with lock + backoff) that runs hybrid refresh
on a cadence:

```bash
pnpm agents:registry:cron:install
```

Recommended production install with explicit target + alerts:

```bash
AGENT_REGISTRY_API_BASE=https://backend-production-5c20.thenewfuse.com \
AGENT_REGISTRY_IMPORT_TOKEN=your-token-if-required \
AGENT_REGISTRY_ALERT_WEBHOOK_URL=https://hooks.slack.com/services/... \
AGENT_REGISTRY_HYBRID_CRON_SCHEDULE="17 */4 * * *" \
pnpm agents:registry:cron:install
```

Inspect cron + runtime state:

```bash
pnpm agents:registry:cron:status
```

Run once immediately (same config contract):

```bash
pnpm agents:registry:cron:run
```

Remove cron automation:

```bash
pnpm agents:registry:cron:uninstall
```

Alert contract:

- `AGENT_REGISTRY_ALERT_WEBHOOK_URL`: HTTP webhook endpoint for failure alerts.
- `AGENT_REGISTRY_ALERT_COOLDOWN_SEC`: alert cooldown per severity (default
  `1800`).
- `AGENT_REGISTRY_ALERT_ON_SUCCESS=true`: optional success notifications.
- Local alert log is always written to:
  - `~/.tnf/agent-registry-hybrid-refresh/alerts.jsonl`

## Troubleshooting

- `POST /api/agent-registry/import/snapshot` returns `500` with:
  - `ENOENT: no such file or directory, open '/data/agent-registry/agents.json'`
  - Cause: backend running an older import service build with incorrect
    repo-root resolution.
  - Fix: deploy backend containing the updated import service path logic in
    `agent-registry-import.service.ts`, then rerun refresh.

## Local-only operation (no external embedding API)

Set:

```bash
AGENT_PROFILE_EMBEDDING_ALLOW_LOCAL_FALLBACK=true
```

If no OpenAI/OpenRouter/Gemini key is configured, embeddings fall back to
deterministic local hashing so indexing still completes.

## Detailed Handoff Prompt (for the other terminal agent)

Copy/paste this prompt to the other agent:

```text
You are updating TNF’s hybrid retrieval corpus so the system uses the latest codebase documentation.

Goal:
1) Enrich agent definitions from existing TNF docs (no fabricated capabilities).
2) Rebuild/import registry snapshot.
3) Reindex/verify hybrid vector + knowledge-graph retrieval.
4) Return a concise audit report with evidence.

Repository:
/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse

Hard constraints:
- Keep all existing features and routes; do not remove behavior.
- Keep edits scoped to agent-definition/registry ingestion surfaces.
- Do not add any external hosted vector DB dependency.
- Prefer deterministic, repeatable commands.

Execution steps:
1. Read and use these source-of-truth paths:
   - `.agent/agents/*.md`
   - `.claude/agents/*.md`
   - `config/ai-agents/*.json`
   - `config/agents/*.json`
   - relevant docs under `docs/` that clarify each agent’s true role/capabilities.
2. For each impacted agent definition, improve metadata quality:
   - tighten `description`
   - add/normalize `skills`
   - add/normalize `capabilities`
   - add/normalize `tags`
   Keep current intent and naming stable.
3. Run hybrid refresh from repo root:
   - `pnpm agents:registry:refresh-hybrid`
   If needed for remote:
   - `AGENT_REGISTRY_API_BASE=<base-url> AGENT_REGISTRY_IMPORT_TOKEN=<token> pnpm agents:registry:refresh-hybrid`
4. If partial indexing is suspected, force full rebuild:
   - `pnpm agents:registry:refresh-hybrid --reindex-all`
5. Verify success with evidence:
   - import step returns ok
   - `/api/agent-registry/traits/stats` shows non-zero vectors and indexed agents
   - `/api/agent-registry/traits/screen` returns candidates and includes `knowledgeGraph` summary
6. Produce final report:
   - files changed
   - command outputs summary
   - before/after counts if available
   - any remaining blockers with exact endpoint/error

Acceptance criteria:
- Hybrid retrieval is operational (vector + graph).
- Agent metadata quality is meaningfully improved from docs.
- No external vector service is required to run.
```
