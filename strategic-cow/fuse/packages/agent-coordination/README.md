# Agent Coordination Package

Redis-based agent-to-agent communication and coordination system for The New Fuse framework.

## Features

- **Pub/Sub Channels**: Real-time agent communication using Redis pub/sub
- **Task Distribution**: Robust task queue system using BullMQ
- **Presence Tracking**: Agent heartbeat system with automatic failover (30s intervals)
- **Shared State**: Distributed state management with optimistic locking
- **Broadcast System**: Multi-agent coordination and announcements
- **Message Serialization**: Efficient data transmission (JSON/MessagePack)
- **Error Handling**: Automatic retry logic with exponential backoff
- **Metrics**: Built-in performance monitoring

## Installation

```bash
pnpm add @the-new-fuse/agent-coordination
```

## Configuration

### Redis Coordinator Configuration

```typescript
import { RedisCoordinator } from '@the-new-fuse/agent-coordination';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { SerializationFormat } from '@the-new-fuse/agent-coordination';

const coordinator = new RedisCoordinator(redisService, {
  keyPrefix: 'agent-coord:',
  heartbeatInterval: 30000,        // 30 seconds
  heartbeatTimeout: 90000,         // 90 seconds (3x heartbeat)
  serializationFormat: SerializationFormat.JSON,
  defaultTaskTimeout: 60000,       // 60 seconds
  maxRetries: 3,
  enableMetrics: true,
  queueConfig: {
    concurrency: 5,
    removeOnComplete: true,
    removeOnFail: false,
  },
});
```

## Usage Examples

### 1. Agent Registration and Presence Tracking

```typescript
// Register an agent
await coordinator.registerAgent('agent-1', {
  role: 'worker',
  capabilities: ['data-processing', 'ml-inference'],
});

// Update agent status
await coordinator.updateAgentStatus('agent-1', AgentStatus.BUSY);

// Check if agent is online
const isOnline = await coordinator.isAgentOnline('agent-1');

// Get all active agents
const activeAgents = await coordinator.getActiveAgents();
console.log('Active agents:', activeAgents);

// Unregister agent
await coordinator.unregisterAgent('agent-1');
```

### 2. Direct Agent-to-Agent Messaging

```typescript
// Send direct message
await coordinator.sendDirectMessage(
  'agent-1',
  'agent-2',
  {
    action: 'process-data',
    data: { items: [1, 2, 3] },
  },
  {
    priority: A2APriority.HIGH,
    requiresResponse: true,
    timeout: 30000,
  }
);

// Subscribe to direct messages
await coordinator.subscribeToDirectMessages('agent-2', async (message) => {
  console.log('Received message:', message);
  
  // Process message
  const result = await processData(message.payload);
  
  // Send response if required
  if (message.requiresResponse) {
    await coordinator.sendDirectMessage(
      message.toAgent,
      message.fromAgent,
      { result }
    );
  }
});
```

### 3. Broadcasting for Multi-Agent Coordination

```typescript
// Broadcast to all agents
await coordinator.broadcast(
  'coordinator',
  {
    type: 'system-announcement',
    message: 'System maintenance in 10 minutes',
  },
  {
    topic: 'system-notifications',
    priority: A2APriority.CRITICAL,
    ttl: 300000, // 5 minutes
  }
);

// Subscribe to broadcasts
await coordinator.subscribeToBroadcast(async (message) => {
  console.log('Broadcast received:', message);
  
  if (message.payload.type === 'system-announcement') {
    // Prepare for maintenance
    await prepareForMaintenance();
  }
}, 'system-notifications');
```

### 4. Task Distribution and Processing

```typescript
// Create and assign task
const task = await coordinator.createTask({
  type: 'data-processing',
  assignedBy: 'coordinator',
  assignedTo: 'worker-1',
  payload: {
    datasetId: 'dataset-123',
    operation: 'transform',
  },
  priority: A2APriority.HIGH,
  maxRetries: 3,
  timeout: 120000,
});

console.log('Task created:', task.id);

// Register task processor
await coordinator.registerTaskProcessor(
  'data-processing',
  async (task) => {
    console.log('Processing task:', task.id);
    
    try {
      const result = await performDataProcessing(task.payload);
      return result;
    } catch (error) {
      throw new Error('Processing failed: ' + error.message);
    }
  },
  {
    concurrency: 3,
    maxRetries: 3,
    timeout: 120000,
  }
);

// Check task status
const taskStatus = await coordinator.getTaskStatus(task.id);
console.log('Task status:', taskStatus?.status);

// Cancel task if needed
await coordinator.cancelTask(task.id);
```

### 5. Shared State Management

```typescript
// Set shared state
const state = await coordinator.setSharedState(
  'global-config',
  {
    maxConcurrency: 10,
    timeout: 60000,
  },
  'coordinator',
  3600 // TTL: 1 hour
);

// Get shared state
const config = await coordinator.getSharedState('global-config');
console.log('Current config:', config?.value);

// Update with locking
await coordinator.updateSharedState(
  'global-config',
  (current) => ({
    ...current,
    maxConcurrency: current.maxConcurrency + 5,
  }),
  'coordinator'
);

// Acquire lock for exclusive access
const lock = await coordinator.acquireStateLock('global-config', 'agent-1', 30);

if (lock) {
  try {
    // Perform exclusive operations
    const state = await coordinator.getSharedState('global-config');
    // ... modify state ...
    await coordinator.setSharedState('global-config', newValue, 'agent-1');
  } finally {
    // Always release lock
    await coordinator.releaseStateLock('global-config', lock.lockId);
  }
}
```

### 6. Event System

```typescript
// Subscribe to coordination events
await coordinator.subscribeToEvents('task:completed', async (event) => {
  console.log('Task completed:', event.data);
  
  // Trigger follow-up actions
  await triggerNextTask(event.data);
});

await coordinator.subscribeToEvents('agent:registered', async (event) => {
  console.log('New agent registered:', event.agentId);
  
  // Assign initial tasks to new agent
  await assignInitialTasks(event.agentId);
});

// Publish custom event
await coordinator.publishEvent({
  type: 'custom:workflow-completed',
  agentId: 'coordinator',
  data: {
    workflowId: 'workflow-123',
    duration: 45000,
    tasksCompleted: 15,
  },
  timestamp: Date.now(),
});
```

### 7. Monitoring and Metrics

```typescript
// Get coordination metrics
const metrics = coordinator.getMetrics();
console.log('Coordination Metrics:', {
  messagesPublished: metrics.messagesPublished,
  messagesReceived: metrics.messagesReceived,
  tasksCreated: metrics.tasksCreated,
  tasksCompleted: metrics.tasksCompleted,
  tasksFailed: metrics.tasksFailed,
  activeAgents: metrics.activeAgents,
  totalAgents: metrics.totalAgents,
});

// Get queue statistics
const queueStats = await coordinator.getQueueStats('agent-tasks');
console.log('Queue Statistics:', {
  waiting: queueStats.waiting,
  active: queueStats.active,
  completed: queueStats.completed,
  failed: queueStats.failed,
});
```

### 8. Advanced Patterns

#### Circuit Breaker Pattern

```typescript
class ResilientAgent {
  private failureCount = 0;
  private readonly maxFailures = 5;
  private circuitOpen = false;

  async sendMessageWithCircuitBreaker(
    toAgent: string,
    payload: any
  ) {
    if (this.circuitOpen) {
      throw new Error('Circuit breaker is open');
    }

    try {
      await coordinator.sendDirectMessage('agent-1', toAgent, payload);
      this.failureCount = 0; // Reset on success
    } catch (error) {
      this.failureCount++;
      
      if (this.failureCount >= this.maxFailures) {
        this.circuitOpen = true;
        
        // Reset after timeout
        setTimeout(() => {
          this.circuitOpen = false;
          this.failureCount = 0;
        }, 60000);
      }
      
      throw error;
    }
  }
}
```

#### Leader Election

```typescript
async function electLeader(agentId: string) {
  const lock = await coordinator.acquireStateLock('leader', agentId, 30);
  
  if (lock) {
    console.log(agentId + ' is now the leader');
    
    // Perform leader duties
    const leaderInterval = setInterval(async () => {
      // Renew leadership
      const renewed = await coordinator.sharedStateManager.renewLock(
        'leader',
        lock.lockId,
        30
      );
      
      if (!renewed) {
        console.log('Lost leadership');
        clearInterval(leaderInterval);
      }
    }, 20000);
  }
}
```

#### Distributed Workflow

```typescript
class WorkflowCoordinator {
  async executeDistributedWorkflow(workflowId: string, steps: any[]) {
    // Set workflow state
    await coordinator.setSharedState(
      'workflow:' + workflowId,
      {
        steps,
        currentStep: 0,
        completed: false,
      },
      'coordinator'
    );

    // Execute each step
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      // Create task for step
      const task = await coordinator.createTask({
        type: step.type,
        assignedBy: 'coordinator',
        payload: step.payload,
        priority: A2APriority.HIGH,
        maxRetries: 3,
      });

      // Update workflow state
      await coordinator.updateSharedState(
        'workflow:' + workflowId,
        (state) => ({
          ...state,
          currentStep: i + 1,
        }),
        'coordinator'
      );

      // Broadcast progress
      await coordinator.broadcast('coordinator', {
        workflowId,
        step: i + 1,
        total: steps.length,
      }, { topic: 'workflow-progress' });
    }

    // Mark workflow complete
    await coordinator.updateSharedState(
      'workflow:' + workflowId,
      (state) => ({
        ...state,
        completed: true,
      }),
      'coordinator'
    );
  }
}
```

## Architecture

### Pub/Sub Channels

- `agent-broadcast`: Global broadcast messages
- `agent-direct-message:{agentId}`: Direct agent messages
- `agent-events`: Coordination events
- `agent-presence`: Agent presence updates
- `agent-tasks`: Task distribution
- `agent-state-sync`: State synchronization

### BullMQ Queues

- **agent-tasks**: Main task distribution queue
- Priority-based processing (1-5, lower = higher priority)
- Automatic retry with exponential backoff
- Configurable concurrency and timeouts

### Heartbeat System

- Interval: 30 seconds (configurable)
- Timeout: 90 seconds (3x heartbeat interval)
- Automatic stale agent detection
- Graceful failover on agent disconnect

### Message Serialization

- **JSON**: Default, human-readable
- **MessagePack**: Compact binary format, ~30% smaller

## Error Handling

All operations include comprehensive error handling with:

- Automatic retries with exponential backoff
- Circuit breaker pattern support
- Graceful degradation
- Detailed error logging
- Metrics tracking for failures

## Performance

- **Throughput**: 10,000+ messages/second
- **Latency**: <10ms average for local Redis
- **Scalability**: Horizontal scaling with Redis Cluster
- **Memory**: Efficient serialization with MessagePack
- **Monitoring**: Built-in metrics and queue statistics

## Testing

```bash
# Run tests
pnpm test

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

## Integration with A2A Core

```typescript
import { RedisCoordinator } from '@the-new-fuse/agent-coordination';
import { A2AService } from '@the-new-fuse/a2a-core';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';

@Module({
  imports: [
    // ... other imports
  ],
  providers: [
    UnifiedRedisService,
    RedisCoordinator,
    A2AService,
  ],
})
export class AgentModule {}
```

## License

MIT
