# Refactoring Plan: TNF Master Clock Decomposition

## Objective

The primary objective of this refactoring is to decompose the monolithic
`MasterClock` class in `packages/relay-core/src/master-clock.ts` into smaller,
more focused, and maintainable services. This aligns with the "Consensus round
for refactoring" and "RELAY-delegated directive" by improving:

- **Maintainability:** Easier to understand, test, and debug individual
  components.
- **Scalability:** Better separation of concerns allows for independent scaling
  of services if needed.
- **Testability:** Individual services can be unit-tested in isolation.
- **Readability:** Reduces cognitive load by breaking down complex logic.

## Current State Analysis (master-clock.ts)

The existing `MasterClock` class handles a broad range of responsibilities,
including:

- WebSocket connection management
- Redis interaction for state persistence and messaging
- Agent registration and lifecycle management
- Channel creation and management
- Task polling and queuing from a unified ledger
- Chronological process scheduling (Super-Cycles)
- Logging and error handling
- Self-prompting mechanisms

## Proposed Decomposition Strategy

We will extract distinct functionalities into new, dedicated classes/modules.
The `MasterClock` will then primarily act as an orchestrator, coordinating
interactions between these new services.

### 1. `AgentRegistryService`

**Responsibility:** Manage all aspects of agent registration, identity, status,
heartbeats, and activity. **Extracted from `MasterClock`:**

- `AgentRegistry` class and its methods (`assignAgentId`, `recordHeartbeat`,
  `recordActivity`, `getStaleAgents`, `markOffline`, `getStats`, `getAgent`,
  `getAgentBySource`).
- Related interfaces and types (`Agent`, `TnfAgentIdentityRecord`,
  `TnfAgentLifecycleStatus`).
- `createMasterClockAgentIdentity`, `createOrchestratorIdentity`.
- Agent-related message handling in `processMessage` (`handleAgentHeartbeat`,
  `handleAgentRegistration`, `handleAgentJoined`).

### 2. `ChannelManagerService`

**Responsibility:** Manage channel creation, membership, and broadcasting within
channels. **Extracted from `MasterClock`:**

- `channels` Map and its manipulation.
- `joinAllChannels`, `handleChannelCreate`, `handleAgentJoined`
  (channel-specific parts).
- `broadcastToChannel`, `broadcastDiscovery`.
- Related interfaces (`ChannelData`).

### 3. `TaskSchedulerService`

**Responsibility:** Handle polling for tasks from the ledger, prioritizing them,
and queuing them to Redis. **Extracted from `MasterClock`:**

- `startTaskPolling`, `pollAndQueueTasks`.
- Task prioritization logic (`taskPriorityWeight`, `itineraryLaneWeight`,
  `horizonWeight`, `taskDispatchScore`, `targetQueueForTask`,
  `isRealtimeDispatchCandidate`).
- `fetchLedgerTasks`.
- Related configuration (`TASK_POLL_INTERVAL_MS`, `TASK_QUEUE_COOLDOWN_MS`,
  `TASK_QUEUE_BATCH_SIZE`, `REDIS_KEYS` related to tasks).
- `recentQueuedTasks` map.

### 4. `SuperCycleSchedulerService`

**Responsibility:** Manage the registration, heartbeats, unregistration, and
execution of chronological processes (Super-Cycles). This includes cron
expression parsing. **Extracted from `MasterClock`:**

- `scheduledProcesses` Map.
- `startChronologicalPolling`, `pollAndRunChronologicalProcesses`,
  `loadChronologicalProcessSnapshots`, `shouldRunChronologicalProcess`,
  `executeChronologicalProcess`.
- Cron parsing and scheduling utilities (`normalizeCronExpression`,
  `getScheduleSlot`, `matchesCronField`, `matchesCronSegment`, `parseCronToken`,
  `getZonedDateParts`, `getNextRunAt`, `monthNameMap`, `weekdayNameMap`,
  `deriveCadenceIntervalMs`).
- `handleSuperCycleRegistration`, `handleSuperCycleHeartbeat`,
  `handleSuperCycleUnregister`.
- `checkForStaleScheduledProcesses`, `getSuperCycleStats`,
  `persistSuperCycleState`.
- Related interfaces (`ScheduledProcess`, `ChronologicalCatalogEntry`,
  `ChronologicalProcessSnapshot`).
- `SUPER_CYCLE_STALE_THRESHOLD`.

### 5. `RedisClientManager` (or `DataStoreService`)

**Responsibility:** Encapsulate all direct interactions with Redis/Upstash,
providing a unified interface for data storage and retrieval. **Extracted from
`MasterClock`:**

- `connectRedis` logic.
- All `this.redis` and `this.upstash` calls (e.g., `hset`, `smembers`, `lpush`,
  `ltrim`, `publish`, `del`).
- `handleRedisMessage`, `handleRelayAgentRegisterRequest`.
- Management of `redis` and `redisSub` instances.
- `REDIS_KEYS` configuration.

### 6. `RelayConnectionManager`

**Responsibility:** Handle the WebSocket connection to the TNF Relay, sending
and receiving messages. **Extracted from `MasterClock`:**

- `ws` instance and its lifecycle (`connectRelay`, `scheduleReconnect`).
- `send` method.
- `handleRelayMessage`.
- `RELAY_URL` configuration.

### 7. `SelfPromptService`

**Responsibility:** Manage the logic for issuing self-prompts to agents or
processes. **Extracted from `MasterClock`:**

- `emitSelfPrompt` method.
- `selfPromptCooldowns` map.
- `SELF_PROMPT_ENABLED`, `SELF_PROMPT_COOLDOWN_MS` configuration.

### Updated `MasterClock` Role

The refactored `MasterClock` will become much leaner, primarily focusing on:

- Initializing and orchestrating the new services.
- Managing its own session identity.
- Central heartbeat and stall detection (coordinating with
  `AgentRegistryService` and `SuperCycleSchedulerService`).
- Top-level message processing and routing to the appropriate service handlers.
- Graceful shutdown coordination.

## Implementation Steps (High-Level)

1.  **Create new files** for each extracted service (e.g.,
    `agent-registry.service.ts`, `channel-manager.service.ts`, etc. within
    `packages/relay-core/src/services/`).
2.  **Move relevant code** (classes, interfaces, methods, configuration) into
    these new files.
3.  **Update imports** in `master-clock.ts` and other affected files to use the
    new service modules.
4.  **Inject dependencies:** The `MasterClock` constructor will be updated to
    receive instances of these new services (or create them internally if their
    dependencies are simple).
5.  **Refactor `MasterClock` methods** to delegate calls to the appropriate
    service instances. For example,
    `MasterClock.prototype.handleAgentRegistration` would call
    `this.agentRegistryService.assignAgentId(...)`.
6.  **Ensure consistent error handling and logging** across new services.

## Consensus Round Discussion Points

- Are there any critical interdependencies between the proposed services that
  might complicate this decomposition?
- Are the proposed service boundaries clear and appropriate?
- Should any other responsibilities be extracted or combined differently?
- What are the immediate risks of this refactoring, and how can we mitigate them
  (e.g., extensive testing plan)?
- Consider the impact on performance and potential for new bottlenecks.

This plan aims to significantly improve the architecture of the TNF Master
Clock, making it more modular, robust, and easier to evolve.
