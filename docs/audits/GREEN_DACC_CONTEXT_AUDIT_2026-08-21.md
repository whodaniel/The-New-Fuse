# Green/DACC Context Reference Implementation Audit

Date: 2026-08-21

## Verdict

The Green/DACC-v1 context-reference route is now **implemented and verified**
for the federation broker execution path. The shared contract, Redis lifecycle,
executor-only hydration, integrity checks, compare-and-set updates, CER receipts,
and required failure tests are present. Adoption by runtime consumers outside
the federation broker remains pending.

## Status Matrix

| Capability | State | Source evidence |
| --- | --- | --- |
| Replace large compute replies with a lightweight reference | Implemented | `scripts/runtime/federation-channel-broker.cjs` stores replies above `TNF_CONTEXT_REF_THRESHOLD` and emits `metadata.contextRef` plus a short preview. |
| Strict TTL on referenced context | Verified | `storeContextReference()` writes a versioned record with configurable Redis `EX`, matching `expiresAt`, and CER lifecycle receipts; Redis expiry is the garbage collector. |
| Lazy hydration by the executing node | Verified for federation broker | `forwardToCompute()` hydrates only immediately before dispatch to the selected compute worker, with a bounded timeout. |
| Passive nodes do not hydrate | Verified | The resolver returns `forwarded-passive` without a Redis read for roles outside the executing-role allowlist. |
| Snapshot/version drift detection | Verified | References carry snapshot version, SHA-256 digest, byte count, and expiry; the resolver rejects drift, tampering, and expired records. |
| Delta/write-behind updates | Designed only | An unrelated generic cache helper exposes `writeBehind`; no Green context update path uses it. |
| Merge-collision handling | Verified | `updateContextReference()` uses an atomic Redis Lua compare-and-set and emits `CONTEXT_MERGE_COLLISION` on stale snapshots. |
| Context Efficiency Ratio telemetry | Verified for federation broker | Versioned `cer/1.0` receipts measure original, inline, saved, and hydrated bytes plus the execution outcome. |
| Failure tests | Verified | Live-Redis tests cover missing/expired references, drift, digest tampering, merge collisions, passive behavior, timeout, and broker producer-to-consumer hydration. |

## Verified Evidence

1. `node --check` passes for the broker and context-reference runtime.
2. `pnpm --filter @the-new-fuse/protocol-contracts type-check` passes.
3. `pnpm --filter @the-new-fuse/protocol-contracts generate:jsonschema` passes.
4. `pnpm run test:green-context` passes seven tests against local Redis.
5. The broker test proves producer storage, reference broadcast, CER metadata,
   and execution-time hydration back into the full compute prompt.

This verification proves the broker route in the isolated upstream branch. It
does not claim that every TNF transport or runtime consumer has adopted context
references.

## Remaining Work

1. Adopt the shared resolver in additional execution surfaces that accept
   `contextRef`; passive transports should continue forwarding the envelope.
2. Define application-specific delta semantics before enabling write-behind.
3. Export CER receipts to the canonical telemetry backend rather than only
   carrying them in message metadata and structured broker logs.
4. Add a production load test for high-concurrency compare-and-set updates and
   Redis failover behavior.
