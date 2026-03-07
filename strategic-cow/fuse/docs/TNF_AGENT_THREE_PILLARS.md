# TNF Agent System: The Three Pillars

> The Central Heartbeat of The New Fuse Enterprise

## Overview

The TNF Agent System is built on **Three Pillars** that work together to provide
a complete agent orchestration and communication framework:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TNF AGENT SYSTEM                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   🏰 PILLAR 1         💓 PILLAR 2           📡 PILLAR 3            │
│   ORCHESTRATOR        HEARTBEAT             MESSAGE BROKER          │
│                                                                     │
│   ┌─────────────┐    ┌─────────────┐       ┌─────────────┐         │
│   │ Task Mgmt   │    │ Health Mon  │       │ Direct Msg  │         │
│   │ Swarm Coord │◄──►│ Agent Track │◄──────┤ Broadcast   │         │
│   │ Distribution│    │ Cleanup     │       │ Channels    │         │
│   └─────────────┘    └─────────────┘       └─────────────┘         │
│         │                  │                      │                 │
│         └──────────────────┼──────────────────────┘                 │
│                            ▼                                        │
│                   ┌─────────────┐                                   │
│                   │   REDIS     │                                   │
│                   │   A2A       │                                   │
│                   └─────────────┘                                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Pillar 1: Orchestrator (AgentSwarmOrchestrationService)

**Purpose:** Task management and multi-agent swarm coordination

**Location:**
`apps/api/src/modules/agency-hub/services/agent-swarm-orchestration.service.ts`

### Capabilities

| Feature                     | Description                                                        |
| --------------------------- | ------------------------------------------------------------------ |
| **Swarm Initialization**    | Initialize orchestration for an agency with configurable settings  |
| **Agent Registration**      | Register agents with capabilities, load limits, and quality scores |
| **Task Distribution**       | Submit tasks and automatically assign to suitable agents           |
| **Execution Management**    | Track execution progress, phases, and metrics                      |
| **Quality-Based Selection** | Select agents based on quality score and current load              |

### Key Methods

```typescript
initializeAgencySwarm(agencyId, config?)     // Initialize swarm
registerAgent(agencyId, agent)               // Register an agent
submitTask(agencyId, task)                   // Submit task for execution
getSwarmStatus(agencyId)                     // Get swarm health status
getExecutionMetrics(agencyId)                // Get execution metrics
```

### Configuration

```typescript
interface SwarmConfiguration {
  maxConcurrentExecutions: number; // Default: 10
  defaultQualityThreshold: number; // Default: 0.8
  enableAutoScaling: boolean; // Default: true
  agentSelectionStrategy: 'round_robin' | 'quality_based' | 'load_balanced';
  coordinationMode: 'centralized' | 'distributed' | 'hybrid';
}
```

---

## Pillar 2: Heartbeat (Integrated into Orchestrator)

**Purpose:** Chronological health monitoring and agent lifecycle management

**Mechanism:** `setInterval` with 30-second check intervals

### Capabilities

| Feature                  | Description                                               |
| ------------------------ | --------------------------------------------------------- |
| **Heartbeat Monitoring** | Track agent last-seen timestamps                          |
| **Timeout Detection**    | Mark agents as offline after 60 seconds of inactivity     |
| **Health Metrics**       | Calculate overall swarm health (excellent/good/fair/poor) |
| **System Load**          | Monitor agent utilization across the swarm                |

### Health Calculation

```typescript
// Overall Health Determination
if (connectivity > 0.9 && systemLoad < 0.7) return 'excellent';
if (connectivity > 0.7 && systemLoad < 0.8) return 'good';
if (connectivity > 0.5 && systemLoad < 0.9) return 'fair';
return 'poor';
```

---

## Pillar 3: Message Broker (A2AMessageBrokerService)

**Purpose:** Inter-agent communication and real-time messaging

**Location:**
`apps/api/src/modules/agency-hub/services/a2a-message-broker.service.ts`

### Capabilities

| Feature                   | Description                             |
| ------------------------- | --------------------------------------- |
| **Direct Messaging**      | Point-to-point agent communication      |
| **Broadcast Messaging**   | Send messages to all online agents      |
| **Channel-Based Pub/Sub** | Create channels for group communication |
| **Conversations**         | Multi-agent conversation management     |
| **Presence Management**   | Track online/offline agent status       |

### Message Types

```typescript
enum A2AMessageType {
  // Agent Communication
  DIRECT_MESSAGE = 'DIRECT_MESSAGE',
  BROADCAST = 'BROADCAST',

  // Task Coordination
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_FAILED = 'TASK_FAILED',
  TASK_PROGRESS = 'TASK_PROGRESS',

  // System Events
  AGENT_ONLINE = 'AGENT_ONLINE',
  AGENT_OFFLINE = 'AGENT_OFFLINE',
  HEARTBEAT = 'HEARTBEAT',

  // Conversation
  CONVERSATION_START = 'CONVERSATION_START',
  CONVERSATION_MESSAGE = 'CONVERSATION_MESSAGE',
  CONVERSATION_END = 'CONVERSATION_END',

  // Self-Improvement
  PROMPT_UPDATE_REQUEST = 'PROMPT_UPDATE_REQUEST',
  PROMPT_UPDATED = 'PROMPT_UPDATED',
  CAPABILITY_ANNOUNCEMENT = 'CAPABILITY_ANNOUNCEMENT',
}
```

### Key Methods

```typescript
sendMessage(message); // Send direct/broadcast message
subscribe(subscription); // Subscribe to receive messages
createChannel(name, participants); // Create communication channel
sendToChannel(channelName, message); // Send to channel
startConversation(initiator, participants, topic); // Start conversation
registerPresence(agentId); // Mark agent online
getOnlineAgents(); // List online agents
getMetrics(); // Get broker metrics
```

---

## API Endpoints

### Swarm Controller (`/api/swarm`)

| Method | Endpoint                   | Description                |
| ------ | -------------------------- | -------------------------- |
| POST   | `/:agencyId/executions`    | Create new swarm execution |
| GET    | `/:agencyId/executions`    | Get agency executions      |
| GET    | `/executions/:executionId` | Get execution details      |
| POST   | `/:agencyId/health-check`  | Perform health check       |
| GET    | `/:agencyId/metrics`       | Get performance metrics    |

### A2A Broker Controller (`/api/a2a`)

| Method | Endpoint               | Description          |
| ------ | ---------------------- | -------------------- |
| POST   | `/messages/send`       | Send direct message  |
| POST   | `/messages/broadcast`  | Broadcast message    |
| GET    | `/messages/:agentId`   | Get pending messages |
| POST   | `/channels`            | Create channel       |
| POST   | `/channels/:name/join` | Join channel         |
| POST   | `/channels/:name/send` | Send to channel      |
| POST   | `/conversations`       | Start conversation   |
| POST   | `/presence/online`     | Register online      |
| GET    | `/presence/online`     | Get online agents    |
| GET    | `/status`              | Get broker status    |
| GET    | `/metrics`             | Get broker metrics   |

### System Verification (`/system`)

| Method | Endpoint                | Description                        |
| ------ | ----------------------- | ---------------------------------- |
| POST   | `/verify-three-pillars` | Verify complete system integration |

---

## Usage Example

```typescript
// 1. Initialize Orchestrator
await swarmService.initializeAgencySwarm('my-agency');

// 2. Register Agents
const agent1 = await swarmService.registerAgent('my-agency', {
  name: 'Coordinator',
  type: 'coordinator',
  capabilities: ['planning', 'delegation'],
  currentLoad: 0,
  maxLoad: 10,
  qualityScore: 0.95,
  status: 'active',
});

// 3. Register with Broker
await brokerService.registerPresence(agent1);

// 4. Send Messages
await brokerService.sendMessage({
  type: A2AMessageType.TASK_ASSIGNED,
  from: agent1,
  to: 'worker-agent',
  payload: { task: 'Analyze codebase' },
  priority: A2APriority.HIGH,
});

// 5. Submit Tasks
await swarmService.submitTask('my-agency', {
  type: 'analysis',
  priority: 'high',
  payload: { target: 'codebase' },
  requirements: ['analysis'],
});
```

---

## Architecture Benefits

1. **Decoupled Communication** - Agents don't need to know about each other
   directly
2. **Scalable Task Distribution** - Quality-based selection ensures optimal
   assignment
3. **Health Monitoring** - Automatic detection and handling of failed agents
4. **Real-time Events** - Instant notification of system changes
5. **Self-Improvement Ready** - Built-in message types for prompt/capability
   updates

---

## Next Steps

1. **Redis Integration** - Connect to production Redis for distributed
   operations
2. **Persistent Queues** - Add BullMQ for durable task queues
3. **WebSocket Bridge** - Real-time push to frontend clients
4. **Metrics Dashboard** - Visualize system health and performance
5. **Self-Improving Agents** - Implement agents that modify their own prompts

---

_Last Updated: December 16, 2024_
