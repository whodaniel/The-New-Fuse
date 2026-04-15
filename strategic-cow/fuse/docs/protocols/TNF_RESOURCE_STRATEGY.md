# TNF Resource Strategy Protocol

**Maximize Leverage of Free LLM Accounts**

## Overview

The TNF Resource Strategy protocol is a new primitive designed to handle the
intelligent selection, rotation, and management of LLM resources across The New
Fuse ecosystem.

With the release of **Claude 4.6 (Sonnet) as a free default model**, agents can
now scale horizontally by "multiplexing" across multiple free accounts without
incurring costs. This protocol defines how messages and tasks signal their
resource requirements and how gateways should handle account rotation.

## Primitives

### 1. `ResourceTier`

Defines the economic level of the required resource:

- `free`: Standard free-tier accounts (e.g., Claude 4.6 Free, Gemini Flash
  Free).
- `pro`: Premium individual accounts.
- `enterprise`: High-throughput corporate resources.
- `shared`: Pooled community resources.

### 2. `ResourceStrategy`

Allows an agent to define exactly how it wants its request handled:

```typescript
{
  tier: 'free',
  selection: 'least-used', // Selection algorithm for account pools
  onQuotaExhausted: 'switch-account', // Action to take on rate limits
  maxRetries: 5
}
```

### 3. `resource-negotiate` Message

A new TNF message type that allows agents and gateways to coordinate on pool
status:

- `request-access`: Ask for a credential from a specific pool.
- `pool-status`: Broadcast the remaining quota for a set of accounts.

## Usage Scenarios

### Scenario A: Scaling Claude 4.6 Free

An agent performing a large-scale codebase analysis can set its strategy to:

- `tier: 'free'`
- `onQuotaExhausted: 'switch-account'`
- `poolId: 'my-claude-free-clones'`

The TNF gateway will automatically rotate through the available Free account
credentials until the task is complete, effectively circumventing single-account
message caps.

### Scenario B: Smart Hybrid Budgeting

A budget-conscious agent can use `selection: 'priority-pro'`:

1. Use the **Pro** account for high-complexity planning steps.
2. Automatically switch to **Free** accounts for repetitive implementation
   tasks.
3. If all Free accounts are exhausted, fallback to `wait` or `upgrade` based on
   instruction.

## Implementation Details

The primitives are located in:

- `packages/relay-core/src/protocol/resource-protocol.ts`
- `packages/relay-core/src/protocol/tnf-envelope.ts` (Integrated into the
  envelope)
- `packages/relay-core/src/protocol/task-protocol.ts` (Integrated into
  orchestration tasks)

## Example TNF Envelope

```json
{
  "id": "...",
  "type": "task",
  "resource": {
    "tier": "free",
    "poolId": "universal-free-bridge",
    "selection": "round-robin",
    "onQuotaExhausted": "switch-account"
  },
  "payload": {
    "action": "code-generation",
    "content": "..."
  }
}
```
