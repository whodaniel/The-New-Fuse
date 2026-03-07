# Cloudflare ZeroClaw Relay

Cloudflare Worker relay for ZeroClaw with primary + failover routing.

## Endpoints

- `GET /health` - relay health/config status
- `POST /webhook` - forwards payload to `/api/chat` on primary then secondary

## Payload shape

```json
{
  "message": "Summarize latest deployment health in one line.",
  "conversation_id": "optional",
  "user_id": "optional"
}
```

## Security

If `TNF_WEBHOOK_SECRET` is configured as a Worker secret, callers must send:

- header: `X-TNF-Webhook-Secret: <secret>`

## Deploy

```bash
cd cloudflare-zeroclaw-relay
pnpm install
wrangler login
wrangler secret put TNF_WEBHOOK_SECRET
wrangler deploy
```

## Test

```bash
curl -sS -X POST "https://<worker-subdomain>.workers.dev/webhook" \
  -H "Content-Type: application/json" \
  -H "X-TNF-Webhook-Secret: <secret>" \
  -d '{"message":"health summary"}'
```
