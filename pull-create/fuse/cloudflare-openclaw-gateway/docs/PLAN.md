# Cloud OpenClaw Gateway (Containers) — Plan

Goal: Replace the Telegram echo with a real OpenClaw Gateway runtime running in
Cloudflare Containers (or Sandboxes), while preserving:

- canonical receipts (SharedState)
- repeatable setup (runbook)
- minimal secret handling

## Phases

### Phase 1 (done)

- Telegram → openclaw-runtime Worker → SharedState deposit (service binding) ✅
- Temporary echo reply ✅

### Phase 2 (next): Gateway container minimal

- Run OpenClaw Gateway in a Cloudflare Container.
- Provide a private HTTP endpoint (or internal routing) that openclaw-runtime
  can call.
- Forward inbound Telegram updates → gateway → response text → Telegram
  sendMessage.

### Phase 3: Persistence

- Persist OpenClaw state to R2 (mount or periodic sync).
- Store config as redacted baseline + secrets via Wrangler.

### Phase 4: Tooling

- Browser Rendering integration for browser automation.
- AI Gateway integration for provider routing and BYOK.

## Non-negotiables

- All inbound/outbound messages create receipts.
- Gateway calls must be idempotent with request ids.
- If gateway is down, fall back to echo + record stall receipt.
