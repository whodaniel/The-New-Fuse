# TWIP Federation + MCID State (2026-03-18)

Status: Active assessment  
Audience: TNF protocol owners, orchestrator maintainers

## Summary

TNF already has strong building blocks for terminal identity and orchestration
safety. The remaining gap is end-to-end cumulative lineage enforcement across
all handoff and channel boundaries.

## State Matrix

1. Canonical terminal identity (`twid`, scope, provenance)
   - State: Strong
   - Source: `docs/protocols/schemas/twip-identity.schema.json`
2. Envelope trace (`correlation_id`, `causation_id`) + tenant policy checks
   - State: Strong
   - Source: `docs/protocols/schemas/twip-envelope.schema.json`
3. Terminal macro observability (active/idle/risk telemetry)
   - State: Strong
   - Source: `scripts/protocols/twip-macro-board.cjs`
4. Targeted handoff cloud contract (tenant/session/workflow/channel)
   - State: Partial
   - Source: `docs/protocols/AGENT_TARGETED_HANDOFF_V1.md`
   - Gap: No mandatory cumulative lineage object in packet contract
5. Federation channel gate chain
   - State: Implemented at protocol-doc layer
   - Source: `docs/protocols/bridges/twip-federation-orchestration-gates.yml`
6. Master cumulative ID schema
   - State: Implemented at schema layer
   - Source: `docs/protocols/schemas/tnf-master-cumulative-id.schema.json`
7. Runtime enforcement in publish/ack code paths
   - State: Pending
   - Gap: MCID validation not yet mandatory in handoff publish/ack services

## Required Next Runtime Enforcements

1. Enforce MCID schema validation in handoff publish path.
2. Require gate-decision append on each federation hop.
3. Persist gate chain + MCID into execution audit timeline.
4. Reject packets with tenant drift, trace breaks, or missing `twid` for
   terminal-bound tasks.
