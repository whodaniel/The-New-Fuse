# ZeroClaw Additional Integrations

## 1) CloudRuntime Webhook Relay (Primary + Failover)

Run a relay process that accepts automation webhooks and forwards to ZeroClaw.

```bash
ZEROCLAW_PRIMARY_URL="https://zeroclaw-sandbox-production.thenewfuse.com" \
ZEROCLAW_SECONDARY_URL="https://picoclaw-tester-v2-production.thenewfuse.com" \
TNF_WEBHOOK_SECRET="set-a-shared-secret" \
pnpm cloud_runtime:zeroclaw:webhook-relay
```

Test it:

```bash
curl -sS -X POST http://127.0.0.1:8788/webhook \
  -H "Content-Type: application/json" \
  -H "X-TNF-Webhook-Secret: set-a-shared-secret" \
  -d '{"message":"Summarize latest deployment health in one line."}'
```

## 2) Cloudflare Worker Relay (Global Edge)

Use Worker-based relay for low-latency global ingress.

```bash
cd cloudflare-zeroclaw-relay
pnpm install
wrangler login
wrangler secret put TNF_WEBHOOK_SECRET
wrangler deploy
```

Endpoints after deploy:

- `GET /health`
- `POST /webhook`

## 3) Discord Integration (Operator-Led Browser Setup)

Configuration for each instance:

- `ZEROCLAW_CHANNELS_DISCORD_TOKEN`
- `ZEROCLAW_CHANNELS_DISCORD_ALLOW_FROM` (comma-separated user IDs, optional)

After vars are set, redeploy target service and validate `/api/status`.

### Fast setup command

```bash
pnpm cloud_runtime:zeroclaw:discord:setup <service> <discord_bot_token> [allow_from_csv] [enabled=true]
```

### Discord Portal steps

1. Open `https://discord.com/developers/applications`
2. `New Application` -> name it by instance (example: `tnf-zeroclaw-sandbox`)
3. `Bot` -> `Add Bot`
4. Under privileged intents, enable `MESSAGE CONTENT INTENT`
5. Copy the Bot token
6. `OAuth2` -> `URL Generator` -> scopes: `bot`, `applications.commands`
7. Grant bot permissions:
   - View Channels
   - Send Messages
   - Read Message History
   - Embed Links
   - Attach Files
8. Open generated invite URL and add bot to your server

### Validation

```bash
curl -sS https://<service>-production.thenewfuse.com/api/status | jq '.channels,.provider,.model'
```

## 4) Email Integration (Multi-Tenant Scale)

For tenant-safe scale (thousands to millions), prefer API-first providers over
shared SMTP:

- Primary recommendation: Resend or SendGrid (per-tenant API keys/domains)
- Queue and fanout: Cloudflare Queues or SQS + worker consumers
- Tenant isolation: separate sender identities, rate limits, and audit logs by
  tenant
- Inbound routing: provider webhook -> verified tenant mapping -> ZeroClaw tool
  action

## Safety Note

Any token pasted into chat should be treated as compromised and rotated later.
