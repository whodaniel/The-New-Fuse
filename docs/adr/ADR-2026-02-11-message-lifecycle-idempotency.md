# ADR-2026-02-11: Message Lifecycle + Idempotency Contract

## Status

Accepted (v1)

## Context

We need guaranteed, replay-safe behavior from channel ingress to model response.

## Decision

Standardize lifecycle stages and IDs:

- `requestId`: deterministic ID per inbound update (`channel:update_id`
  preferred)
- `idempotencyKey`: hash(requestId + channel + tenant)
- `sessionId`: logical conversation/session key

### Lifecycle

1. Inbound webhook accepted
2. Inbound receipt deposited
3. Execution request sent to gateway with `requestId` + `idempotencyKey`
4. Gateway executes or returns typed failure
5. Outbound send attempted
6. Outbound receipt deposited
7. If failure: stall receipt deposited with retry classification

## Error Taxonomy

- `INGRESS_AUTH_FAILED`
- `INGRESS_BAD_PAYLOAD`
- `EXECUTION_UNAVAILABLE`
- `EXECUTION_TIMEOUT`
- `EXECUTION_MODEL_ERROR`
- `OUTBOUND_SEND_FAILED`
- `RETRY_EXHAUSTED`

## Retry Rules

- Safe retries only when idempotent and outbound not confirmed.
- Duplicate webhook deliveries should resolve to same `requestId` and no
  duplicate side effects.

## Observability Requirements

- p95 latency per stage
- success/failure by error taxonomy
- duplicate suppression count
- fallback/stall frequency

## Acceptance Criteria

- Replaying identical webhook payload does not produce duplicate outbound
  replies.
- All state transitions are traceable via receipts.
