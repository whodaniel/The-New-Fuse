# TNF Cloud App-Plane Integration Plan (Backend + UI)

Date: 2026-02-11 Status: In Progress

## Current Integration Status

### Live now

- `tnf-sharedstate` deployed (control plane)
- `openclaw-runtime` deployed (ingress plane)
- `openclaw-gateway` deployed (execution gateway contract)
- Runtime→Gateway routing verified

### Not complete yet

- Gateway→real executor/model path (`EXECUTOR_URL`) is not configured
- thenewfuse.com backend lacks finalized production adapter endpoint for gateway
  execution
- thenewfuse.com UI lacks live operations dashboard for receipt timelines +
  swarm control

## Target Production Flow

1. Channel ingress (runtime)
2. Canonical inbound receipt (sharedstate)
3. Gateway execution call (idempotent)
4. Backend/executor orchestrates TNF directives + model/tool calls
5. Outbound response via runtime
6. Outbound receipt + execution trace projection
7. UI displays session timeline and orchestrator state

## Week 1 (Hardening + Wiring)

- [ ] Implement backend endpoint: `POST /api/orchestrator/execute`
- [ ] Accept `requestId`, `idempotencyKey`, `sessionId`, message payload
- [ ] Return strict `{ ok, replyText, metadata }`
- [ ] Configure gateway `EXECUTOR_URL` + auth secret
- [ ] Add duplicate suppression storage keyed by idempotencyKey
- [ ] Emit execution receipts for each stage

## Week 2 (Operator UI + Swarm Controls)

- [ ] Add ops UI page: live sessions + receipt timeline
- [ ] Add controls: retry, replay, pause/resume, force handoff
- [ ] Add swarm launch panel with TNF directive templates
- [ ] Add service health cards (runtime/gateway/sharedstate/executor)
- [ ] Add error taxonomy visualization and fallback frequency metrics

## Go/No-Go Gates for Swarm Testing

- [ ] End-to-end real reply path works (no gateway fallback)
- [ ] Duplicate inbound events are idempotent
- [ ] Stall/fallback receipts visible in UI within 5s
- [ ] Can replay any failed request from UI with same requestId lineage
- [ ] p95 end-to-end latency target defined and measured

## First Mission Enablement

Mission: assess and improve TNF services/SaaS via orchestrated swarm deployment.

Prerequisites:

- [ ] Swarm directive pack templates in backend
- [ ] Task delegation policy matrix in UI
- [ ] Evidence receipts required for mission completion state
