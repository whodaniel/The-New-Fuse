# Cloudflare Edge Gateway

This Worker provides a public edge endpoint for `audio-trigger-kws-mvp` and
proxies requests to CloudRuntime.

## Files

- `wrangler.toml`: Worker deployment config
- `src/index.ts`: Auth + proxy logic

## Configure

1. Set the CloudRuntime API origin in `wrangler.toml`:
   - `KWS_API_ORIGIN=https://<your-kws-api>.thenewfuse.com`
2. Authenticate Wrangler:
   - `npx wrangler whoami`
3. Set edge secret:
   - `cd apps/audio-trigger-kws-mvp/cloudflare`
   - `npx wrangler secret put EDGE_API_KEY`

## Deploy

```bash
cd apps/audio-trigger-kws-mvp/cloudflare
npx wrangler deploy --config /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/audio-trigger-kws-mvp/cloudflare/wrangler.toml --name tnf-audio-trigger-kws-gateway
```

Current deployed worker URL:

- `https://tnf-audio-trigger-kws-gateway.bizsynth.workers.dev`

## Test

```bash
curl -sS "https://<worker-subdomain>.workers.dev/healthz"

curl -sS -X POST "https://<worker-subdomain>.workers.dev/v1/ingest/text" \
  -H "content-type: application/json" \
  -H "x-edge-api-key: <EDGE_API_KEY>" \
  -d '{"streamId":"cf_stream_01","utterance":"aspirin 200 mg please"}'
```
