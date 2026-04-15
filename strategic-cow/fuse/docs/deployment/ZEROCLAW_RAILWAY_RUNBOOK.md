# ZeroClaw Railway Runbook

## Scope

This runbook covers the two active Telegram-enabled ZeroClaw instances:

- `zeroclaw-sandbox`
- `picoclaw-tester-v2`

## Golden Rules

1. Treat Telegram bot tokens as compromised after exposure; rotate immediately.
2. After variable changes on `picoclaw-tester-v2`, force a Dockerfile deploy, or
   Railway may revert to the service's default `alpine:latest` source image.
3. Validate with `/health` and `/api/status` before testing in Telegram.

## Quick Health Check

```bash
bash scripts/railway/check-zeroclaw-instances.sh
```

## Deploy Without Drift

Use this command after any config/script changes:

```bash
railway up apps/zeroclaw-sandbox --path-as-root --ci --service zeroclaw-sandbox
railway up apps/zeroclaw-sandbox --path-as-root --ci --service picoclaw-tester-v2
```

## Required Runtime Shape

- Process mode: `zeroclaw daemon` (not `zeroclaw gateway`)
- Public proxy forwards to internal gateway
- Telegram configured in TOML under:
  - `[channels_config]`
  - `[channels_config.telegram]`
    - `bot_token`
    - `allowed_users`

## Routing Policy

- `zeroclaw-sandbox`
  - Primary: `openai-codex / gpt-5.3-codex`
  - Fallbacks: codex model fallbacks + Kilo gateway chain
- `picoclaw-tester-v2`
  - Primary: `kilocode / kilo/auto-free`
  - Fallbacks: Kilo free chain
  - Keep `TNF_LLM_ROUTING_API_BASE` and `TNF_LLM_TARGET` unset to avoid
    centralized override drift.

## Token Rotation Procedure (Telegram)

1. In `@BotFather`, run `/revoke` for the bot.
2. Generate a new token (`/token`).
3. Update Railway vars for the matching service:
   - `PICOCLAW_CHANNELS_TELEGRAM_TOKEN`
   - `OPENCLAW_CHANNELS_TELEGRAM_TOKEN`
4. Redeploy the service using the deploy command above.
5. Validate:
   - `/health` is JSON and `status=ok`
   - `/api/status` shows `channels.Telegram=true`
   - Send `/start` then `testing` to the bot.

## Fast Triage

### Symptom: `Application failed to respond` / edge `502`

- Check if latest deploy/source drifted to `alpine:latest`:
  - `railway status --json | jq ...`
- Fix by forcing Dockerfile deploy:
  - `railway up apps/zeroclaw-sandbox --path-as-root --ci --service <service>`

### Symptom: `No response from OpenAI Codex websocket stream`

- Ensure transport is forced to SSE:
  - `ZEROCLAW_PROVIDER_TRANSPORT=sse`
  - `ZEROCLAW_CODEX_TRANSPORT=sse`

### Symptom: `Missing Authentication header` (OpenRouter)

- Ensure the relevant API key var is set for that service:
  - `OPENROUTER_API_KEY` (or disable OpenRouter path)

### Symptom: `Custom API key not set` for Kilo fallback

- Ensure one of these is set on the service:
  - `API_KEY`
  - `ZEROCLAW_API_KEY`
  - `KILOCODE_API_KEY`

## Verification Commands

```bash
curl -sS https://zeroclaw-sandbox-production.up.railway.app/health | jq .
curl -sS https://zeroclaw-sandbox-production.up.railway.app/api/status | jq '.channels.Telegram,.provider,.model'

curl -sS https://picoclaw-tester-v2-production.up.railway.app/health | jq .
curl -sS https://picoclaw-tester-v2-production.up.railway.app/api/status | jq '.channels.Telegram,.provider,.model'
```
