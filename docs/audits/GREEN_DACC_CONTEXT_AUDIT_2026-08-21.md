# Green/DACC Context Reference Implementation Audit

Date: 2026-08-21

## Verdict

The Green/DACC-v1 context-reference architecture is **designed**, but only a
narrow producer-side subset is **implemented**. No end-to-end context-reference
route is currently **verified**.

## Status Matrix

| Capability | State | Source evidence |
| --- | --- | --- |
| Replace large compute replies with a lightweight reference | Implemented | `scripts/runtime/federation-channel-broker.cjs` stores replies above `TNF_CONTEXT_REF_THRESHOLD` and emits `metadata.contextRef` plus a short preview. |
| Strict TTL on referenced context | Partially implemented | The broker writes `tnf:context:<id>` with Redis `EX 3600`; TTL is fixed and there is no additional lifecycle or garbage-collection receipt. |
| Lazy hydration by the executing node | Designed only | No runtime consumer or resolver for `redis://tnf:context:*` was found. |
| Passive nodes do not hydrate | Designed only | No role-aware hydration policy was found because no hydration path exists. |
| Snapshot/version drift detection | Designed only | No context snapshot version, digest, or drift check was found. |
| Delta/write-behind updates | Designed only | An unrelated generic cache helper exposes `writeBehind`; no Green context update path uses it. |
| Merge-collision handling | Designed only | No context merge/version conflict implementation was found. |
| Context Efficiency Ratio telemetry | Designed only | `CER` appears in planning/status documentation, not runtime metrics or receipts. |
| Failure tests | Not implemented | No focused tests cover missing references, expiry, snapshot drift, merge collisions, passive hydration, or hydration timeout. |

## Verified Evidence

1. `node --check scripts/runtime/federation-channel-broker.cjs` passes.
2. The only runtime `contextRef` producer found is
   `FederationChannelBroker.mirrorComputeContent()`.
3. The Redis key is written with a one-hour expiry before the reference is
   broadcast.
4. No runtime resolver, hydrate operation, CER metric, or focused test was found
   under `packages/`, `apps/`, or `scripts/`.

This verification proves source presence and absence at canonical main plus the
current isolated patch. It does not prove a live end-to-end execution path.

## Required Implementation Order

1. Define a versioned `ContextReference` contract in the protocol-contracts
   package: URI, digest, byte count, created/expiry time, snapshot version, and
   authority scope.
2. Implement an executing-node resolver with bounded timeouts, digest/version
   validation, and explicit missing/expired reference errors.
3. Gate hydration by execution role; observers and passive channel members must
   forward references without loading payloads.
4. Add compare-and-set snapshot updates and deterministic merge-conflict
   receipts before adding write-behind behavior.
5. Emit CER from measured inline bytes, referenced bytes, hydrated bytes, and
   execution outcome.
6. Add Redis-backed integration tests for missing/expired references, snapshot
   drift, concurrent updates, passive-node behavior, and hydration timeout.

Until those steps pass, documentation and status reports must call the feature
`partial producer implementation`, not `Green context routing complete`.
