# Agent Targeted Handoff V1

## Why

Local files such as `.agent/handoff_notes.txt` are useful for single-machine continuity, but they do not satisfy cloud-first requirements:

- no target scoping to specific agents
- no delivery acknowledgement
- no expiration/retention boundaries
- no multi-tenant session isolation

`HandoffPacket v1` adds an explicit cloud contract for targeted handoffs.

## Protocol Surface

Source files:

- `packages/relay-core/src/protocol/handoff-protocol.ts`
- `packages/relay-core/src/services/HandoffStoreService.ts`

Core entities:

- `HandoffPacketInput`
- `HandoffPacket`
- `HandoffAckInput`
- `HandoffAck`

Key fields:

- `targets.agentIds`: explicit recipient list
- `scope.tenantId`: tenant isolation boundary
- `scope.sessionKey` / `scope.workflowId`: replay and audit correlation
- `payload.prompt`: actionable prompt for the target agent
- `expiresAt`: lifecycle bound for cloud retention

## Storage Model (Redis)

Namespace prefix: `tnf:handoff:v1`

- `packet:{packetId}` -> packet JSON
- `inbox:agent:{agentId}` -> list of packet IDs for each target agent
- `ack:{packetId}` -> hash of `agentId -> ack JSON`
- `index:session:{sessionKey}` -> packet IDs by session

Delivery semantics:

- at-least-once delivery via inbox lists
- idempotent acknowledgement by `packetId + agentId`

## API Usage Example

```ts
import { HandoffStoreService } from '@the-new-fuse/relay-core';

const handoffs = new HandoffStoreService({ redisUrl: process.env.REDIS_URL });

const packet = await handoffs.publish({
  fromAgentId: 'orchestrator-main',
  targets: { agentIds: ['AGENT-07'] },
  scope: { tenantId: 'tnf-prod', sessionKey: 'agent:main:telegram:dm:7030202773' },
  payload: {
    title: 'Resume migration verification',
    summary: 'Continue the deployment verification sequence.',
    prompt: 'Validate API deployment and publish final status report.',
    acceptanceCriteria: ['API 200 healthcheck', 'routing verification passed'],
    nextActions: ['Check deployment', 'Run verify script', 'Post report'],
  },
});

const inbox = await handoffs.listForAgent('AGENT-07', { limit: 20 });
await handoffs.acknowledge({
  packetId: packet.id,
  agentId: 'AGENT-07',
  status: 'claimed',
  note: 'Picking this up now',
});
```

## Migration Plan

1. Keep `.agent/handoff_notes.txt` as optional local fallback.
2. Write all cloud handoffs as `HandoffPacket`.
3. Route retrieval by `agentId + tenantId + sessionKey`.
4. Require `handoff-ack` before re-assigning the same work.
5. Add periodic cleanup metrics by `expiresAt` and stale ack states.

## Production Controls (Required)

- AuthN/AuthZ: only trusted orchestrators can publish handoff packets.
- Tenant checks: reject publishes and reads missing `scope.tenantId`.
- Audit logs: persist `publish`, `read`, `ack`, `reassign`.
- PII controls: never store secrets inside `payload.prompt`.
- SLA: monitor `pending -> claimed` and `claimed -> completed` latency.
