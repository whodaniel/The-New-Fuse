# MCP-DRS Crawler vs Crawl4AI Workflow

## What is currently deployed (`mcp-drs-crawler`)
Service: `mcp-drs-crawler`  
Runtime: Python 3.12 (Nixpacks)  
Observed files in container:
- `/app/main.py`
- `/app/crawler/fetcher.py`
- `/app/crawler/scanner.py`
- `/app/crawler/queue.py`
- `/app/requirements.txt` (comment-only, no external deps)

Current behavior:
- `/health` returns a static healthy payload.
- `/crawl` returns a static simulated payload (`scan_status: simulated`).
- No real crawling runs in `main.py`.
- `scanner.py` and `fetcher.py` include partial logic (GitHub code search + mock capability fetch), but are not wired into live HTTP execution.

## What the new Crawl4AI workflow provides
Workflow files:
- `crawl4ai_research_pipeline.py`
- `migrate_to_cloud_runtime_postgres.py`

Capabilities:
- Real browser-assisted crawling via Crawl4AI + Playwright/Patchright.
- Seed + depth-1 internal expansion.
- Structured extraction into relational tables:
  - `categories`
  - `sources`
  - `source_links`
  - `prompts`
- Prompt extraction from markdown blocks and high-yield repository datasets.
- Cloud persistence in CloudRuntime Postgres schema: `ai_assets_marketplace`.

Current cloud dataset in CloudRuntime Postgres:
- `categories`: 10
- `sources`: 52
- `source_links`: 8,479
- `prompts`: 1,985
- `artifacts`: 5

## Head-to-head comparison

1. Execution model
- `mcp-drs-crawler`: mostly stub HTTP service, minimal operational crawler logic.
- Crawl4AI workflow: real crawl execution pipeline with extraction + persistence.

2. Data output quality
- `mcp-drs-crawler`: no production-grade extracted dataset currently emitted.
- Crawl4AI workflow: normalized, queryable corpus already in CloudRuntime Postgres.

3. Source coverage
- `mcp-drs-crawler`: appears oriented to GitHub MCP config scanning only.
- Crawl4AI workflow: multi-domain crawling across marketplaces, docs, repos, communities, benchmarks.

4. Operational readiness
- `mcp-drs-crawler`: suitable as a placeholder service endpoint.
- Crawl4AI workflow: suitable as ingestion backend for AI Assets marketplace search/index flows.

## Recommended migration strategy (keeping CloudRuntime DBs)

1. Keep `postgres-main` as system of record (already done).
2. Treat `mcp-drs-crawler` as upgrade target:
- Replace current `main.py` stub with:
  - `POST /crawl/run` to execute pipeline job (async/background)
  - `GET /crawl/status` for run metadata
  - `GET /crawl/counts` from `ai_assets_marketplace` tables
3. Move crawl orchestration code from local scripts into `mcp-drs-crawler` service codebase.
4. Add schedule support (CloudRuntime cron or external trigger) for recurring refreshes.
5. Add dedupe guards in depth-1 expansion (domain/path normalization) to reduce repeated GitHub/HuggingFace traversals.

## Immediate next implementation
- Port `crawl4ai_research_pipeline.py` into `mcp-drs-crawler` service repo.
- Add FastAPI API surface for trigger/status/counts.
- Persist run logs + run_id table in Postgres (`ai_assets_marketplace.crawl_runs`).
- Keep `ai-assets-marketplace-data` service as read API (or merge into crawler service later).
