# ADR-2026-05-17: Hook Orchestrator Runtime Alignment

## Status

Proposed (v1)

## Context

The TNF Hook Orchestrator specification introduces event-driven Hook Chains for
validation, governance gates, frontloading, delegation, and error remediation.

A naive implementation would add a second orchestration runtime. TNF already has
an existing workflow runtime with execution queueing, branching, retries, state,
and telemetry.

Running two orchestration runtimes for overlapping responsibilities creates:

- split reliability behavior
- duplicate execution semantics
- drift in policy enforcement
- fragmented observability and audit trails

## Decision

Adopt a **single-runtime** architecture:

1. Hook Orchestrator is a **control-plane layer** (registry, router, compiler,
   gate service, approval adapter).
2. Hook chains compile and dispatch into `@the-new-fuse/workflow-engine` for
   execution.
3. Synchronous `pre_exec` decisions (`ALLOW | DENY | REQUIRE_APPROVAL`) use a
   bounded request/response contract, not async Pub/Sub.
4. Async chain execution uses durable transport and queue semantics (Redis
   Streams + BullMQ), with idempotency and DLQ.

## Consequences

### Positive

- One execution plane for retries, timeout semantics, and telemetry
- No duplicated DAG logic or drift between runtimes
- Cleaner policy governance and auditing for high-risk actions
- Faster implementation by reusing existing workflow infrastructure

### Trade-offs

- Hook compiler/router must remain compatible with workflow-engine graph model
- Runtime limitations in workflow-engine become Hook Orchestrator limitations
- Requires strict contract versioning between gate API, chain schema, and
  runtime adapters

## Non-negotiables

- No second workflow runtime for hook-chain execution.
- `pre_exec` gate path has deterministic timeout behavior and explicit fail
  mode by environment tier.
- Every chain run is trace-correlated and replay-safe.
- Parallel branches require deterministic merge semantics.

## Implementation Milestones

1. Finalize HookChain schema and gate API contracts.
2. Implement synchronous gate service with policy packs and approval tickets.
3. Implement hook compiler + router that emits workflow-engine jobs.
4. Add idempotency, DLQ replay, and full audit tracing.

