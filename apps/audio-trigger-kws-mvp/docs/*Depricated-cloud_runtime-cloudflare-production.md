# CloudRuntime + Cloudflare Production Deployment

This document makes `audio-trigger-kws-mvp` deployable in production with your
current stack.

## Run Now

```bash
EDGE='https://tnf-audio-trigger-kws-gateway.bizsynth.workers.dev'
KEY='REPLACE_WITH_EDGE_API_KEY'
SID="run_$(date +%s)"

curl -sS "$EDGE/healthz" | jq .

curl -sS -X POST "$EDGE/v1/ingest/text" \
  -H 'content-type: application/json' \
  -H "x-edge-api-key: $KEY" \
  -d "{\"streamId\":\"$SID\",\"utterance\":\"aspirin 200 mg refill please\"}" | jq .

sleep 4
curl -sS -X POST "$EDGE/v1/flush" \
  -H "x-edge-api-key: $KEY" | jq .

sleep 8
curl -sS "$EDGE/v1/events/rules?limit=10" \
  -H "x-edge-api-key: $KEY" | jq .

curl -sS "$EDGE/v1/events/llm-results?limit=10" \
  -H "x-edge-api-key: $KEY" | jq .
```

## Voice Test UI

Open:

- `https://tnf-audio-trigger-kws-gateway.bizsynth.workers.dev/voice-test`

Then:

1. Paste your `x-edge-api-key`.
2. Click `Start Listening` and speak.
3. Click `Send To Pipeline`.
4. Review `rules` and `llm` output on the page.

## Topology

1. `mini-omni-inference` (CloudRuntime service)

- Runs mini-omni server (`/chat`).
- Internal/private endpoint preferred.

2. `kws-api` (CloudRuntime service)

- Runs this app (`src/server.ts`).
- Calls mini-omni via `MINI_OMNI_API_URL`.

3. `edge-gateway` (Cloudflare Worker)

- Public endpoint for clients.
- Authn/Authz, rate limiting, optional bot controls.
- Proxies to CloudRuntime `kws-api`.

## Service Contracts

### Client -> Cloudflare Worker

- `POST /v1/ingest/text`
- `GET /healthz`
- Optional `GET /v1/events/*` for operations/debug access.

### Worker -> CloudRuntime `kws-api`

Same routes as above.

### `kws-api` -> mini-omni

- `POST /chat`
- JSON body includes base64 WAV and generation controls.

## CloudRuntime: `kws-api` Environment

Set these in CloudRuntime service variables:

- `APP_HOST=0.0.0.0`
- `MINI_OMNI_MODE=native_chat`
- `MINI_OMNI_API_URL=https://mini-omni-inference-production.thenewfuse.com/chat`
- `MINI_OMNI_TIMEOUT_MS=180000`
- `MINI_OMNI_MAX_TOKENS=256`
- `MINI_OMNI_STREAM_STRIDE=8`
- `MINI_OMNI_OUTPUT_WAV_DIR=/tmp/mini-omni-kws-mvp`
- `BATCH_FLUSH_INTERVAL_MS=2000`
- `BATCH_MAX_ITEMS=20`
- `MAX_RECENT_RULE_FIRES=500`
- `MAX_RECENT_PACKAGES=500`
- `MAX_RECENT_LLM_RESULTS=500`

Keep `MINI_OMNI_MAX_TOKENS <= 2048` for this mini-omni build.

## CloudRuntime CLI Commands (Exact Flow)

```bash
# From repo root
cd /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse

# Verify auth and project link
cloud_runtime whoami
cloud_runtime status

# Select or create target service for kws-api
# Create service if missing:
cloud_runtime add --service kws-api

# Link current directory to service:
cloud_runtime service kws-api

# Deploy using app-local cloud_runtime.toml + Dockerfile
cloud_runtime up apps/audio-trigger-kws-mvp --service kws-api --detach --path-as-root
```

Then set service vars in CloudRuntime dashboard (or CLI variables flow), matching the
list above.

### Current live services

- `kws-api`: `https://kws-api-production.thenewfuse.com`
- `mini-omni-inference`: `https://mini-omni-inference-production.thenewfuse.com`

## CloudRuntime: Process Commands

For `kws-api`:

- Build: `pnpm --filter @the-new-fuse/audio-trigger-kws-mvp build`
- Start: `pnpm --filter @the-new-fuse/audio-trigger-kws-mvp start`

For `mini-omni-inference`:

- Start:
  `OMNI_SKIP_WARMUP=1 python3 server.py --ip 0.0.0.0 --port 60808 --device cpu`

## Cloudflare Worker

Use the deployable worker files in this folder:

- `cloudflare/wrangler.toml`
- `cloudflare/src/index.ts`

- Configure:
  - `KWS_API_ORIGIN=https://kws-api-production.thenewfuse.com`
  - `EDGE_API_KEY=<secret>`
- Route your domain path (for example `audio-api.yourdomain.com/*`) to this
  Worker.

### Cloudflare Deploy Commands

```bash
cd /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/audio-trigger-kws-mvp/cloudflare
npx wrangler whoami
npx wrangler secret put EDGE_API_KEY --config /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/audio-trigger-kws-mvp/cloudflare/wrangler.toml --name tnf-audio-trigger-kws-gateway
npx wrangler deploy --config /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/audio-trigger-kws-mvp/cloudflare/wrangler.toml --name tnf-audio-trigger-kws-gateway
```

Current live worker:

- `https://tnf-audio-trigger-kws-gateway.bizsynth.workers.dev`

## Production Hardening Checklist

1. Add auth on all write routes (`/v1/ingest/text`, `/v1/flush`).
2. Persist events/packages/LLM results to a DB.
3. Move from in-memory queue to durable queue (Redis/stream).
4. Add structured logs + tracing + alerting.
5. Add autoscaling strategy and concurrency caps.
6. Add dead-letter handling for failed mini-omni calls.
7. Add PII policies and retention controls for audio artifacts.

## Smoke Test

After deploy:

1. `GET /healthz` should return `status=ok`.
2. `POST /v1/ingest/text` should return `accepted=true`.
3. `GET /v1/events/llm-results` should show `ok=true` entries.

## Runtime note

`kws-api` now synthesizes a short fallback WAV for mini-omni if no
`MINI_OMNI_SAMPLE_WAV` is present, so cloud deployments do not require local
sample files.
