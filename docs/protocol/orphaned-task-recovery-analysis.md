# Orphaned Task Recovery Analysis

**Date**: 2026-07-25T14:49:34-04:00  
**Status**: Documented

## Summary

Analysis of TNF's orphaned task recovery mechanism for tasks delivered to
`ORCHESTRATOR-{timestamp}` session inboxes.

## Recovery Mechanisms

### 1. Master Clock Startup Migration

- **Location**: `packages/relay-core/src/master-clock.ts:356-379`
- **Trigger**: Runs at startup, before claiming baton ownership
- **Function**: `migrateOrphanedHandoffInboxes()`

### 2. Broker Background Migration

- **Location**: `packages/relay-core/src/broker-agent.ts:318-361`
- **Trigger**: Runs every 60 seconds (configurable via
  `CONFIG.ORPHAN_INBOX_MIGRATE_MS`)
- **Function**: `migrateOrphanedOrchestratorInboxes()`

### Migration Service

- **Location**:
  `packages/relay-core/src/services/orchestrator-inbox-migration.service.ts`
- **Redis Keys Scanned**:
  - `tnf:handoff:v1:inbox:ORCHESTRATOR-*`
  - `tnf:handoff:v1:inbox:agent:ORCHESTRATOR-*`
- **Max Moves Per Call**: 5000 (configurable via
  `ORCHESTRATOR_INBOX_MIGRATE_MAX`)
- **Algorithm**: `rpop` → `lpush` (or `rpoplpush` if available)

## Protocol Gap

**Root Cause**: Migration requires Redis availability. When Redis is
unavailable:

1. Master clock cannot write active session to `tnf:master:state`
2. Broker cannot read active session or migrate inboxes
3. Tasks continue to be delivered to orphaned inboxes
4. No recovery until Redis is restored

**Current State**:

- Redis connection errors to Upstash (`ENOTFOUND key-shark-87762.upstash.io`)
- Broker using remote Redis while local Redis has active pubsub channels
- Master clock shut down due to Redis connection errors
- Planning queue has 2 critical tasks awaiting recovery

## Resolution Path

1. Restore Redis connectivity (local or remote)
2. Broker's 60-second interval will automatically migrate orphaned packets
3. Master clock's startup migration will run on next restart

## Files Analyzed

- `packages/relay-core/src/master-clock.ts`
- `packages/relay-core/src/broker-agent.ts`
- `packages/relay-core/src/services/orchestrator-inbox-migration.service.ts`
- `packages/relay-core/src/protocol/handoff-protocol.ts`
- `packages/protocol-contracts/src/handoff.ts`
- `packages/workflow-engine/src/orchestrator/tnf-router.ts`
