# TNF Cloud Launch Gates (Go/No-Go)

Date: 2026-02-11 Owner: Daniel Goldberg

Use this checklist before each staging/prod rollout.

## Critical Gates (must pass)

### Gate 1 — Ingress Authenticity

- [ ] Telegram webhook secret verification is enforced (or explicitly
      risk-accepted)
- [ ] Invalid/missing secret attempts are logged with receipt evidence
- [ ] No token values are written to logs/receipts

### Gate 2 — End-to-End Message Loop (No Echo Stub)

- [ ] `POST /webhooks/telegram` routes to real gateway execution path
- [ ] User response is gateway/model output (not temporary echo)
- [ ] Failure path returns graceful fallback and records stall receipt

### Gate 3 — Receipt Canonical Integrity

- [ ] Every inbound message creates a deposit receipt
- [ ] Every outbound message creates a corresponding receipt
- [ ] Receipt append path is concurrency-safe (serialized writer / DO-backed
      append)
- [ ] Receipt chain continuity can be validated for current day log

### Gate 4 — Idempotency & Replay Safety

- [ ] Gateway calls include deterministic request IDs
- [ ] Duplicate webhook deliveries do not create duplicate side effects
- [ ] Replay of same update is detected and handled safely

### Gate 5 — Security Envelope

- [ ] Cloudflare Access protects non-public/admin routes
- [ ] Secrets only in Wrangler secrets (not committed)
- [ ] Redaction policy enforced server-side for mirror/mirrorfs
- [ ] No raw sensitive chat/session dumps mirrored by default

## Supporting Gates (recommended)

### Gate 6 — SharedState Reliability

- [ ] `/deposit`, `/withdraw`, `/mirror/:runtime`, `/context/:runtime` pass
      smoke tests
- [ ] D1 pointer writes + R2 writes are validated
- [ ] Durable Object sequencer responds with monotonic sequencing

### Gate 7 — Observability & Incident Response

- [ ] Alerting exists for webhook failures, receipt failures, gateway timeouts
- [ ] Runbook includes exact recovery commands
- [ ] Stall/fallback behavior is tested and emits receipts

### Gate 8 — Repo/Release Hygiene

- [ ] Cloudflare-related changes committed in reviewable commits
- [ ] `.wrangler/` and transient artifacts are ignored
- [ ] Release note includes architecture + known limits
- [ ] Rollback steps tested once

### Gate 9 — Demo Proof Paths

- [ ] Happy path demo: inbound → receipt → gateway response → outbound receipt
- [ ] Failure path demo: gateway down → graceful fallback → stall receipt

## Decision Rule

- **GO**: All critical gates pass; only explicitly risk-accepted non-critical
  gaps remain.
- **NO-GO**: Any failure in Gates 1–5.

## Current Known Gaps (as of 2026-02-11)

- Runtime still contains temporary echo block in
  `cloudflare-openclaw-runtime/src/index.ts`.
- SharedState receipt append is currently naive get+put (needs serialized append
  path).
