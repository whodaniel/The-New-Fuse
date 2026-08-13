# WhatsApp Bridge Vulnerability Remediation Plan (2026-04-27)

## Status

This is a zero-risk planning document only. No runtime bridge changes were
applied.

## Verified Current State

Live runtime observed on this machine:

- Hermes gateway process running
- Managed WhatsApp bridge process running:
  - `node /Users/<owner>/.hermes/hermes-agent/scripts/whatsapp-bridge/bridge.js --port 3000 --session /Users/<owner>/.hermes/whatsapp/session --mode self-chat`

Current bridge package:

- Path:
  `/Users/<owner>/.hermes/hermes-agent/scripts/whatsapp-bridge/package.json`
- Direct dependency pin:
  - `@whiskeysockets/baileys`:
    `WhiskeySockets/Baileys#01047debd81beb20da7b7779b08edcb06aa03770`

Installed dependency chain observed:

- `@whiskeysockets/baileys@7.0.0-rc.9`
- `libsignal@npm:@whiskeysockets/libsignal-node@2.0.1`
- `protobufjs@7.5.4`
- `protobufjs@6.8.8` under `libsignal`

## Verified Vulnerability Findings

`npm audit` reported 3 critical vulnerabilities in the WhatsApp bridge
dependency graph.

Primary advisory:

- Package: `protobufjs`
- Advisory: `GHSA-xq3m-2v4x-88gg`
- Title: `Arbitrary code execution in protobufjs`
- Severity: critical
- Affected range: `<7.5.5`

Audit path:

- `baileys` -> `@whiskeysockets/libsignal-node` -> `protobufjs`

Important constraint:

- `npm audit` reports `fixAvailable: false`
- This is not safely repairable via `npm audit fix`

## Why In-Place Mutation Is Unsafe

The WhatsApp bridge is not an isolated helper; it is a live transport component
with several active contracts:

1. Hermes gateway contract
   - Python adapter polls `GET /messages`
   - Sends text via `POST /send`
   - Sends media via `POST /send-media`
   - Checks `GET /health`

2. Media ingest contract
   - Incoming image/audio/video/document media are downloaded locally by the
     Node bridge
   - Files are cached under Hermes cache dirs for later agent processing
   - Voice messages are surfaced as local `.ogg` paths to the gateway

3. Voice path contract
   - TNF voice workflow depends on stable incoming audio capture
   - Current TNF operational guidance prefers native voice-bridge / mini-omni
     handling rather than external Whisper CLI

4. Session/auth contract
   - Bridge uses persisted multi-file WhatsApp auth state
   - Regressions here would force re-pairing or break the live account session

Because of these contracts, a blind Baileys or libsignal upgrade could break:

- QR/session restore
- message receive
- message send/edit
- media upload/download
- voice note ingest
- self-chat mode filtering
- allowlist / mention behavior

## Blast Radius Assessment

Affected if bridge breaks:

- Hermes WhatsApp transport entirely
- TNF voice ingress on WhatsApp
- Any workflows depending on cached WhatsApp audio/image/document artifacts
- Self-chat testing lane currently active on this machine

Not directly affected by leaving current bridge in place short-term:

- Telegram
- core Hermes CLI
- non-WhatsApp TNF voice loop components
- TNF handoff matrix / stall defense

## Safest Remediation Strategy

### Phase 0 — Preserve Current Working Lane

Do not touch the live bridge used by Hermes gateway.

Preserve:

- current running process
- current session directory
- current bridge package-lock
- current self-chat validation lane

### Phase 1 — Side-by-Side Clone

Create an isolated remediation workspace separate from the live bridge:

- duplicate `scripts/whatsapp-bridge` into a TNF-controlled sandbox path
- do not point Hermes gateway at it
- do not reuse the live session path during early dependency trials

Goal:

- dependency experimentation without risking the active bridge

### Phase 2 — Candidate Dependency Matrix

Test candidate recovery paths in isolation:

1. Newer Baileys release/commit with patched protobuf chain
2. Newer `@whiskeysockets/libsignal-node` if available
3. Override/resolution strategy only if proven compatible
4. If upstream remains blocked, pin to a known-good fork with patched transitive
   deps

Hard rule:

- no candidate is promotable unless audit severity improves and runtime behavior
  remains intact

### Phase 3 — Contract Regression Test Suite

Before any promotion, verify all of these against the isolated bridge:

Transport:

- bridge boots and exposes `/health`
- saved session reconnects cleanly
- QR pairing still works if session is reset

Inbound:

- DM text receipt
- self-chat receipt
- group receipt if enabled
- image receipt and local cache path generation
- voice note receipt and local `.ogg` cache path generation
- document receipt and local file path generation

Outbound:

- text send
- streaming/edit behavior
- image send
- document send
- voice/audio send

Policy:

- allowlist still enforced
- self-chat loop suppression still works
- mention / free-response policy still works

### Phase 4 — Promotion Gate

Promote only if all of the following are true:

- vulnerability posture is strictly improved
- no regression in text transport
- no regression in media transport
- no regression in voice note ingest
- no regression in existing TNF/Hermes behavior

## Recommended Immediate Next Action

Build a dedicated TNF-side validation harness that hits the same bridge HTTP
contract Hermes uses:

- `/health`
- `/messages`
- `/send`
- `/send-media`

This should be additive only and should not replace the existing Hermes bridge.

Why this is the best next step:

- it reduces unknowns before touching dependencies
- it gives TNF its own bridge verification logic
- it supports the broader TNF feature-parity mission without breaking current
  functionality

## Notes Relevant to TNF Parity Mission

The live Hermes bridge exposes a simple local HTTP contract. TNF can augment
parity by implementing a supplemental verifier/adapter around the same contract
instead of replacing it.

Useful observed contract details:

- Bridge binds localhost on port 3000
- Session path currently in use:
  `/Users/<owner>/.hermes/whatsapp/session`
- Hermes Python adapter starts the bridge subprocess and polls readiness via
  `/health`
- Outbound voice is sent through `/send-media` with `mediaType: audio`

This makes a TNF-side bridge health verifier or compatibility shim a safe
additive enhancement.
