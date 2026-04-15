# Cloudflare OpenClaw Runtime (Telegram-first)

Goal: run a **cloud OpenClaw instance** (Gateway + integrations) on Cloudflare
substrate, with **Telegram DM working first**, and with **TNF SharedState** as
canonical receipts/context.

This folder is the runtime plane (execution + messaging). SharedState already
lives at:

- https://tnf-sharedstate.bizsynth.workers.dev

## Phase plan

### Phase 1 (today): Telegram webhook → SharedState receipts (no container yet)

- Deploy a Worker that:
  - receives Telegram webhooks
  - emits receipts to TNF SharedState (`POST /deposit`)
  - (optionally) enqueues events to Cloudflare Queues for later processing

This proves:

- secure ingress works
- canonical logging works
- we can evolve towards full OpenClaw Gateway runtime

### Phase 2: Add runtime execution

- Attach a runtime executor:
  - Cloudflare Containers (preferred) or Sandboxes
  - persistent storage via R2 mount / sync
  - OpenClaw Gateway process runs inside executor
- Worker routes inbound messages → runtime → sends replies via Telegram Bot API

---

## Secrets (set via wrangler, never commit)

Recommended:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET_TOKEN` (Telegram header verification)
- `SHAREDSTATE_API_BASE` (default: https://tnf-sharedstate.bizsynth.workers.dev)

Optional later:

- `OPENCLAW_CONFIG_BLOB` (redacted)
- model provider keys (ideally via Cloudflare AI Gateway BYOK)

---

## Deploy

```bash
cd cloudflare-openclaw-runtime
npm i
npx wrangler login
npx wrangler deploy
```

Set secrets:

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET_TOKEN
```

---

## Endpoints

- `GET /health`
- `POST /webhooks/telegram`
