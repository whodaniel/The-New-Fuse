# Orchestrator Presence

Use this reference when a local orchestration act should also become a durable
network-recognized event.

Related discovery rule:

1. newly discovered agent-like sessions should receive provisional TNF identity
   and baseline tags on first sight,
2. coordinating actors should then be enrolled into heartbeat and stall-defense
   as part of continuity substantiation.

## Core Rule

When `orchestrator-agent` is invoked, it should emit a presence beacon rather
than existing only as an internal thought.

That invocation should also enroll the actor into:

1. local heartbeat recipient coverage,
2. conversation stall-defense monitoring,
3. lease-based removal or downgrade on `HANDOFF`, `COMPLETE`, `ABANDON`, or
   lease expiry.

## Beacon Destination Order

1. local Sub-Director presence ledger,
2. TNF Central actor registry or shared-state presence channel,
3. durable local audit log.

This keeps orchestration locally resilient while still making it visible to the
collective.

Invocation is not fully substantiated until this local continuity enrollment is
active.

## Recommended Lifecycle Events

1. `ACTOR.INVOKE`
2. `ACTOR.HEARTBEAT`
3. `ACTOR.HANDOFF`
4. `ACTOR.STALL`
5. `ACTOR.COMPLETE`
6. `ACTOR.ABANDON`

## Recommended Fields

1. `actor_id`
2. `actor_role`
3. `session_id`
4. `invocation_id`
5. `node_id`
6. `tenant_id`
7. `workstream_id` or `correlation_id`
8. `started_at`
9. `heartbeat_due_at`
10. `parent_actor_id`
11. `capability_profile`
12. `trust_state`

## Classification

The current `orchestrator-agent` is best understood as a `Proto Director
Orchestrator`:

1. more than a pure scheduler,
2. less than the final Master Director,
3. already performing decomposition, delegation, continuity reasoning, and
   failure management.
