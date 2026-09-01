# SESSION_HANDOFF session_handoff_relay-stage0-hardening-20260830

Protocol ACK: `TNF_PROTOCOL_ACK` Spec: `tnf/session-handoff/0.2` Created At:
`2026-08-30T16:58:07.741Z` Handoff ID: `79de3197-3c7e-4ee7-bd24-7324bc193006`

## Scope

- Branch: `feat/relay-stage0-hardening-wt`
- Head SHA: `893405aa42f7f821a017f2e0fbd3ba51e6496e93`

## Work Summary

- Close Stage 0 relay gaps: channel delivery without to, fail-closed auth,
  private-channel isolation, rate/frame limits, AGENT_METADATA_UPDATE.

## Changed Paths

- packages/relay-core/src/standalone-relay.ts
- packages/relay-core/tests/message-delivery.test.cjs
- packages/relay-core/tests/stage0-hardening.test.cjs
- docs/protocols/reports/session_handoff_relay-stage0-hardening-20260830.json
- docs/protocols/reports/session_handoff_relay-stage0-hardening-20260830.md

## Next Actions

- Do not start Stage 1–5 relay work unless the operator expands scope.
- Do not touch apps/relay-server; relay-core is the Stage 0 surface.
