> **⚠️ CLOUD_RUNTIME IS NO LONGER USED.** TNF has migrated to GCP (Cloud Run) +
> Cloudflare (Pages/Workers) + Supabase (PostgreSQL) + Upstash (Redis). See
> `/CLOUD_MIGRATION_BLUEPRINT.md` for current infrastructure. This document is
> preserved for historical reference only.

# TNF Live Swarm Setup (Redis + SearXNG)

This setup enables the no-mock swarm pipeline:

- `news-scout` pulls live results from SearXNG
- `llm-test-flywheel` auctions real tasks over Redis
- dashboard activity reads from `tnf:master:logs`

## One-Time Setup

```bash
pnpm run swarm:setup
```

What it does:

- Starts `redis-dev` and `searxng-dev` via `docker-compose.dev-simple.yml`
- Creates `.env.local` if missing
- Adds missing keys (without overwriting existing values):
  - `REDIS_URL=redis://127.0.0.1:6380`
  - `REDIS_HOST=127.0.0.1`
  - `REDIS_PORT=6380`
  - `SEARXNG_BASE_URL=http://127.0.0.1:8080`
  - `SEARXNG_NEWS_ENGINES=google,bing,duckduckgo`

## Run Live Supercycle

```bash
pnpm run swarm:supercycle:live
```

## No-Docker Setup

Use this when Redis and SearXNG already run outside Docker.

```bash
export REDIS_URL=redis://127.0.0.1:6379
export SEARXNG_BASE_URL=http://127.0.0.1:8080
pnpm run swarm:setup:nodocker
pnpm run swarm:supercycle:live
```

## Guided API Key Setup (Recommended)

This opens Tavily + Exa key pages, prompts for keys, writes `.env.local`, and
attempts to sync vars to CloudRuntime runner services.

```bash
pnpm run swarm:keys:setup
```

If you want Exa as the primary scout provider, use:

```bash
export SCOUT_PROVIDER=exa
export EXA_API_KEY=<your_exa_key>
pnpm run swarm:setup:nodocker
pnpm run swarm:supercycle:live
```

If you want Tavily instead:

```bash
export SCOUT_PROVIDER=tavily
export TAVILY_API_KEY=<your_tavily_api_key>
pnpm run swarm:setup:nodocker
pnpm run swarm:supercycle:live
```

Provider behavior:

- `SCOUT_PROVIDER=exa`: Exa only
- `SCOUT_PROVIDER=tavily`: Tavily only
- `SCOUT_PROVIDER=searxng`: SearXNG only
- `SCOUT_PROVIDER=auto`: Exa -> Tavily -> SearXNG fallback

### Crawl4AI Enrichment (Optional)

Scout can enrich result details by crawling the returned URLs with Crawl4AI.
This does not replace provider search; it post-processes fetched links.

1. Install dependency in the runtime where `news-scout.cjs` executes:

```bash
python3 -m pip install crawl4ai
```

2. Enable env vars:

```bash
export CRAWL4AI_ENABLED=true
export CRAWL4AI_MAX_URLS=5
export CRAWL4AI_MAX_CHARS=2000
export CRAWL4AI_TIMEOUT_MS=25000
```

3. For CloudRuntime setup propagation, export the same vars before:

```bash
pnpm run swarm:setup
```

Preflight provider test:

```bash
pnpm run swarm:provider:test
```

## CloudRuntime-Native Setup

Use this to run everything online from CloudRuntime (recommended for CloudRuntime Redis).

```bash
pnpm run swarm:setup:cloud_runtime
pnpm run swarm:supercycle:cloud_runtime
```

If CloudRuntime SSH is unavailable (sleeping/serverless), the runner automatically
falls back to local execution using:

- `Redis.REDIS_PUBLIC_URL`
- `SEARXNG_BASE_URL` (or `CLOUD_RUNTIME_SERVICE_SEARXNG_URL`)

Optional overrides:

```bash
export CLOUD_RUNTIME_ENVIRONMENT_NAME=production
export CLOUD_RUNTIME_SEARXNG_SERVICE=searxng
export CLOUD_RUNTIME_RUNNER_SERVICES=api3,api,backend
# Optional hard pin:
# export CLOUD_RUNTIME_RUNNER_SERVICE=api3
```

## Useful Commands

```bash
pnpm run searxng:health
pnpm run searxng:logs
pnpm run docker:status
pnpm run docker:stop
```

## Verify Activity Logs

```bash
redis-cli -p 6380 LRANGE tnf:master:logs 0 20
```

## Validation Snapshot (2026-02-22)

- `pnpm run swarm:provider:test` passed with `effective_provider=exa`.
- `pnpm run swarm:setup` completed and updated CloudRuntime runner service variables.
- `pnpm run swarm:supercycle:live` completed successfully:
  - SSH to serverless runners was unavailable/sleeping, then automatic local
    fallback was used.
  - Runtime used CloudRuntime public Redis endpoint and live SearXNG endpoint.
  - Full 3-phase flywheel completed with auctions emitted from Scout and LLM
    test phases.
- Perplexity paid API usage is disabled in swarm provider routing;
  browser-extension integration remains available.
