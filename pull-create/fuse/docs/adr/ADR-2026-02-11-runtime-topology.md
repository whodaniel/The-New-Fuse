# ADR-2026-02-11: TNF Cloud Runtime Topology (Production)

## Status

Accepted (v1)

## Context

We need a long-term production architecture for:

- Telegram/other channel ingress
- orchestration and model execution
- auditability via TNF receipts
- operator visibility in thenewfuse.com backend/UI

Current state proves transport + receipt logging + gateway contract, but gateway
inference path is still stub-level.

## Decision

Adopt a 4-plane topology:

1. **Ingress Plane (Cloudflare Runtime Worker)**
   - Webhook verification and normalization
   - Request ID generation + idempotency key propagation
   - Canonical inbound receipt deposit to SharedState

2. **Execution Plane (OpenClaw Gateway Runtime in Container/Sandbox)**
   - Real LLM/tool execution
   - TNF protocol directives for task delegation/orchestration
   - Emits structured execution receipts/events

3. **Control Plane (TNF SharedState Worker)**
   - Canonical append-only receipts
   - Context/mirror/withdraw APIs
   - Projections for UI and backend APIs

4. **Application Plane (thenewfuse.com backend + UI)**
   - Backend APIs for session/task/receipt queries and control actions
   - UI for live traces, state, errors, orchestration controls, and swarm
     operations

## Consequences

### Positive

- Clear separation of concerns
- Deterministic message lifecycle and audit trail
- Easier horizontal scaling and failure isolation
- Native path to operator dashboards and swarm supervision

### Trade-offs

- More contracts to maintain
- Requires strict versioning between planes

## Non-negotiables

- Every inbound/outbound message has receipts.
- Idempotency is enforced end-to-end.
- No secret values in receipts/logs.
- Gateway failures produce explicit stall receipts.

## Implementation Milestones

1. Replace gateway stub with real execution adapter (Execution Plane).
2. Add backend API module for runtime sessions + receipt timelines.
3. Add UI ops page for live orchestration and replay.
4. Add canary + rollback + SLO alerts.
