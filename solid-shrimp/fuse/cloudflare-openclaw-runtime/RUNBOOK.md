# OpenClaw Runtime (Cloudflare) — Runbook (Repeatable)

This runbook is written so we never have to rediscover the same steps.

## Components

### 1) SharedState (canonical truth)

- Worker: `tnf-sharedstate`
- Responsibilities: receipts, context packs, mirrors, D1 pointers, DO sequencing
- URL: https://tnf-sharedstate.bizsynth.workers.dev

### 2) Runtime ingress (Telegram-first)

- Worker: `openclaw-runtime`
- Responsibilities: Telegram webhook ingress, deposit canonical receipts to
  SharedState (via _service binding_), send replies.
- URL: https://openclaw-runtime.bizsynth.workers.dev

### 3) Gateway execution (next)

- OpenClaw Gateway runs in Cloudflare **Containers** (preferred) or
  **Sandboxes**.
- Runtime worker forwards inbound messages to gateway and sends gateway outputs
  back to Telegram.

---

## One-time setup (idempotent)

### A) Deploy SharedState

```bash
cd cloudflare-sharedstate
npx wrangler deploy
```

### B) Deploy Runtime (with SharedState service binding)

```bash
cd cloudflare-openclaw-runtime
npx wrangler deploy
```

### C) Secrets (never paste into chat)

```bash
cd cloudflare-openclaw-runtime
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET_TOKEN
npx wrangler deploy
```

### D) Telegram webhook

Telegram requires the `secret_token` to be **alphanumeric**.

```bash
curl -sS "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=https://openclaw-runtime.bizsynth.workers.dev/webhooks/telegram" \
  -d "secret_token=$TELEGRAM_WEBHOOK_SECRET_TOKEN"

curl -sS "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo"
```

---

## Verification (truth gates)

### 1) Tail runtime

```bash
cd cloudflare-openclaw-runtime
npx wrangler tail
```

### 2) Send DM to bot

DM @thenewfuse_bot.

### 3) Confirm receipt landed in R2

```bash
cd cloudflare-sharedstate
npx wrangler r2 object get --remote tnf-sharedstate/receipts/$(date +%F)/receipts.jsonl --pipe | tail -n 200
```

Look for `data.kind == "telegram.update"`.

---

## Known gotchas (do not repeat)

- **Do not rely on external fetch** between Workers for canonical logging; use
  **service binding**.
- `GET /deposit` returns 404; only `POST /deposit` is valid.
- Don’t paste tokens into chat; rotate leaked tokens.
- If you redeploy an older placeholder version of SharedState, `/deposit` will
  break.

---

## Next: replace echo with gateway container

See `../cloudflare-openclaw-gateway/`.
