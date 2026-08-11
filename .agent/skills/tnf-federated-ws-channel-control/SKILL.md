# TNF Federated WS Channel Control

Use this skill when acting as Local Subdirector for TNF relay channels, web AI
agents, or live multi-agent channel checks.

## Purpose

Verify and coordinate the federated WebSocket relay at `ws://127.0.0.1:3000/ws`
without assuming the relay, Redis bridge, or master-clock consumers are healthy.

## Operating Loop

1. Inspect live relay state first.
   - `curl -fsS http://127.0.0.1:3000/health`
   - `lsof -nP -iTCP:3000 -sTCP:LISTEN`
   - `pnpm run tnf:live:agents:write`
2. Check for duplicate `master-clock` processes before restarting relay.
   - More than one `dist/master-clock.js` can reconnect and flood channels.
3. Probe channel behavior with the canonical script.
   - `pnpm run tnf:ws:channels:check`
   - JSON mode: `pnpm run tnf:ws:channels:check:json`
   - Live-check integration:
     `node scripts/protocols/live-agent-work-check.cjs --write --ws-channels`
4. Treat delivery and isolation as separate requirements.
   - Green/Gemini must receive the Green onboarding token.
   - Blue/Kimi must receive the Blue onboarding token.
   - Neither side may receive the other channel's token.
5. Use bridge identities for existing terminal/runtime agents.
   - Do not register a WS socket directly as an existing terminal agent ID.
   - Use a `*-bridge` agent ID and include `metadata.representedAgentId`.
6. Verify V7 federation identity, not only channel delivery.
   - Browser/page agents must expose `operationalHandle`, `runtimeSessionId`,
     `canonicalEntityId`, `idNumber`, `aliases`, `daccRole`, `correlationId`,
     and `mcid`.
   - Kimi/Moonshot is a first-class provider (`MOONSHOT_KIMI`), same as Gemini
     maps to `GOOGLE_GEMINI`.
   - Delivered channel messages must include the sender `ID#` and operational
     handle in metadata.

## Web Agent Onboarding Pattern

Register fresh web AI agents with explicit channel assignment:

- `web-gemini-green-agent` on `Green`
- `web-kimi-k3-blue-agent` on `Blue`

Prompt content should say:

- execute TNF Turn Zero;
- treat the context as fresh;
- stay on the assigned channel;
- report status and blockers;
- do not assume prior TNF context.

## Failure Interpretation

- `REGISTRATION_ERROR` with `RELAY_BRIDGE_ERROR`: relay cannot register local
  agents when the Redis bridge is unavailable; local fallback must be fixed.
- Registration timeout with no `WELCOME`: relay event loop is saturated or the
  listener is unhealthy.
- Many repeated `MESSAGE_SEND from ORCHESTRATOR-*`: duplicate or looping
  master-clock/orchestrator clients are flooding the relay.
- `Failed to persist activity event: The client is closed`: activity persistence
  is unhealthy; do not let logging loops mask channel delivery results.
- In Fuse Connect V7 content pages,
  `Could not establish connection. Receiving end does not exist` usually means
  the MV3 background listener was unavailable for that send. Treat it as
  transient and retry state; only `Extension context invalidated` should force a
  page refresh warning.
- If Green works and Blue/Kimi does not, inspect both Kimi selectors and Kimi
  identity registration. A relay-level Blue pass with Kimi token delivery means
  the remaining failure is likely content-script/page injection or extension
  lifecycle, not channel isolation.

## Success Evidence

The canonical check writes:

- `docs/protocols/reports/FEDERATED_WS_CHANNEL_CHECK_LATEST.json`

A valid pass has:

- `ok: true`
- all probe identities confirmed;
- `greenDelivery.gemini: true`;
- `blueDelivery.kimi: true`;
- all cross-channel leak fields false.
- `identityDelivery.greenHasSubdirectorId: true`;
- `identityDelivery.blueHasSubdirectorId: true`.
