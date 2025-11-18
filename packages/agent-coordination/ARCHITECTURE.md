# Agent Coordination System Architecture

## Overview

The Agent Coordination System provides a comprehensive Redis-based infrastructure for robust agent-to-agent communication, task distribution, and collaborative state management in The New Fuse framework.

## System Components

### 1. RedisCoordinator (Core)
**Location**: `src/redis-coordinator.ts`

The main orchestrator that integrates all subsystems:
- Agent registration and lifecycle management
- Message routing and delivery
- Task creation and monitoring
- Event system coordination
- Metrics collection

**Key Responsibilities**:
- Initialize and manage all subsystems
- Provide unified API for agent coordination
- Handle module lifecycle (init/destroy)
- Aggregate metrics from all components

### 2. Message Serializer
**Location**: `src/serializers/message-serializer.ts`

Handles efficient data serialization and deserialization:
- JSON (default): Human-readable, debugging-friendly
- MessagePack: Binary format, ~30% size reduction

**Features**:
- Format detection and conversion
- Size calculation and validation
- Error handling for corrupt data

### 3. Presence Tracker
**Location**: `src/presence/presence-tracker.ts`

Monitors agent availability and health:
- Heartbeat system (30s intervals, configurable)
- Automatic stale agent detection (90s timeout)
- Status tracking (online/offline/busy)
- Active agent registry

**Heartbeat Mechanism**:
```
Agent registers -> Start heartbeat timer
    |
    v
Every 30s: Update presence in Redis
    |
    v
Monitor checks every 30s for stale agents
    |
    v
If no heartbeat for 90s -> Mark offline
```

### 4. Task Queue Manager
**Location**: `src/queues/task-queue-manager.ts`

Manages distributed task processing using BullMQ:
- Priority-based task queues (1-5 priority levels)
- Automatic retry with exponential backoff
- Concurrent task processing
- Task lifecycle management (pending -> assigned -> in_progress -> completed/failed)

**Queue Architecture**:
```
Create Task -> Add to Queue (sorted by priority)
    |
    v
Worker picks task (FIFO within priority)
    |
    v
Process task -> Success/Failure
    |
    v
Success: Mark completed
Failure: Retry (up to maxRetries) or mark failed
```

### 5. Broadcast Manager
**Location**: `src/broadcast/broadcast-manager.ts`

Handles multi-agent communication:
- Topic-based broadcasting
- Pattern matching for subscriptions
- TTL-based message expiration
- Handler registration and management

**Channel Structure**:
```
agent-coord:agent-broadcast           # Global broadcasts
agent-coord:agent-broadcast:topic     # Topic-specific
agent-coord:agent-broadcast:*         # Pattern matching
```

### 6. Shared State Manager
**Location**: `src/coordination/shared-state-manager.ts`

Manages distributed state with concurrency control:
- Optimistic locking with versioning
- Distributed locks (30s TTL, renewable)
- Atomic state updates
- TTL-based state expiration

**Lock Mechanism**:
```
Acquire Lock (agentId, key)
    |
    v
Check if locked -> If yes, return null
                 -> If no, create lock with TTL
    |
    v
Perform operations
    |
    v
Release Lock or Auto-expire (30s)
```

## Data Flow

### Message Flow
```
Agent A -> RedisCoordinator.sendDirectMessage()
    |
    v
Serialize message (JSON/MessagePack)
    |
    v
Publish to Redis channel (agent-direct-message:agentB)
    |
    v
Redis pub/sub delivers to subscribers
    |
    v
Agent B's subscription handler receives
    |
    v
Deserialize and process message
```

### Task Flow
```
Coordinator -> createTask()
    |
    v
TaskQueueManager.addTask()
    |
    v
BullMQ Queue (priority sorted)
    |
    v
Worker picks task (based on availability)
    |
    v
TaskProcessor executes
    |
    v
Result stored, event published
    |
    v
Metrics updated
```

### State Synchronization Flow
```
Agent A -> acquireStateLock(key)
    |
    v
Lock acquired (30s TTL)
    |
    v
getSharedState(key)
    |
    v
Modify state locally
    |
    v
updateSharedState(key, newValue)
    |
    v
Version check (optimistic locking)
    |
    v
releaseStateLock(key, lockId)
    |
    v
Broadcast state change event
```

## Redis Key Structure

```
agent-coord:presence:{agentId}              # Agent presence data
agent-coord:presence:lock:{key}             # State locks
agent-coord:state:{key}                     # Shared state
agent-coord:agents:active                   # Set of active agent IDs
```

## Redis Channels

```
agent-coord:agent-broadcast                 # Global broadcasts
agent-coord:agent-broadcast:{topic}         # Topic broadcasts
agent-coord:agent-direct-message:{agentId}  # Direct messages
agent-coord:agent-events                    # Coordination events
agent-coord:agent-presence                  # Presence updates
```

## BullMQ Queues

```
agent-tasks                                 # Main task distribution queue
```

## Error Handling Strategy

### Retry Logic
- Exponential backoff: 1s, 2s, 4s, 8s...
- Maximum retries: 3 (configurable)
- Failed task preservation for debugging

### Circuit Breaker Pattern
- Track consecutive failures
- Open circuit after threshold (5 failures)
- Auto-reset after cooldown period (60s)

### Graceful Degradation
- Continue with reduced functionality if subsystems fail
- Log errors with context for debugging
- Metrics tracking for monitoring

## Performance Characteristics

### Throughput
- Messages: 10,000+ messages/second
- Tasks: 1,000+ tasks/second (depends on processor)
- State operations: 5,000+ ops/second

### Latency
- Local Redis: <10ms average
- Remote Redis: <50ms average (network dependent)
- Task processing: Variable (depends on processor)

### Scalability
- Horizontal: Multiple coordinator instances
- Vertical: Redis Cluster support
- Queue workers: Auto-scaling based on load

## Monitoring and Observability

### Built-in Metrics
```typescript
{
  messagesPublished: number,
  messagesReceived: number,
  tasksCreated: number,
  tasksCompleted: number,
  tasksFailed: number,
  activeAgents: number,
  totalAgents: number,
  averageTaskDuration: number,
  averageMessageLatency: number,
}
```

### Queue Statistics
```typescript
{
  waiting: number,      // Tasks waiting to be processed
  active: number,       // Tasks currently being processed
  completed: number,    // Successfully completed tasks
  failed: number,       // Failed tasks
  delayed: number,      // Delayed/scheduled tasks
}
```

### Event System
All major operations emit events for monitoring:
- `agent:registered`
- `agent:unregistered`
- `task:created`
- `task:completed`
- `task:failed`
- `state:updated`
- `lock:acquired`
- `lock:released`

## Integration Points

### With @the-new-fuse/a2a-core
- Uses same agent types and message formats
- Extends A2A protocol with advanced coordination
- Compatible with existing A2A services

### With @the-new-fuse/infrastructure
- Uses UnifiedRedisService for all Redis operations
- Inherits connection pooling and cluster support
- Shared Redis configuration

### With BullMQ
- Task queue implementation
- Job scheduling and processing
- Built-in retry and error handling

## Security Considerations

### Message Authentication
- Agent ID verification
- Message signature support (future)

### State Access Control
- Lock-based exclusive access
- Owner-based permissions
- TTL-based automatic cleanup

### Network Security
- Redis authentication support
- TLS/SSL for Redis connections
- Channel-based isolation

## Future Enhancements

1. **Message Encryption**: End-to-end encryption for sensitive data
2. **Distributed Tracing**: OpenTelemetry integration
3. **Advanced Routing**: Content-based routing, load balancing
4. **Saga Pattern**: Long-running distributed transactions
5. **Event Sourcing**: Complete event history and replay
6. **GraphQL Subscriptions**: Real-time coordination via GraphQL
7. **WebSocket Integration**: Browser-based agent support

## Testing Strategy

### Unit Tests
- Individual component testing
- Mock Redis service
- Edge case coverage

### Integration Tests
- Multi-component workflows
- Real Redis instance
- Performance benchmarks

### Load Tests
- Concurrent agent simulation
- High-throughput scenarios
- Resource usage monitoring

## Deployment Considerations

### Redis Configuration
- Persistence: AOF or RDB based on requirements
- Memory: Size based on agent count and state size
- Cluster: For high availability and scalability

### Monitoring
- Redis metrics: Memory, connections, operations/sec
- Queue metrics: Waiting jobs, processing time
- Application metrics: Custom coordination metrics

### Scaling
- Horizontal: Multiple coordinator instances (stateless)
- Vertical: Increase Redis resources
- Queue workers: Auto-scale based on queue depth
