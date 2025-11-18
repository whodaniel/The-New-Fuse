# Multi-Agent Coordination Framework

A comprehensive coordination system for distributed multi-agent task execution with advanced patterns, orchestration, and monitoring capabilities.

## Overview

This framework extends the base agent coordination package with sophisticated multi-agent patterns and orchestration capabilities. It provides everything needed to build complex, distributed agent systems that can collaborate intelligently on large-scale tasks.

## Features

### 1. Task Distribution
- **Priority-based Task Queue** - Tasks organized by 5 priority levels (Critical, High, Normal, Low, Background)
- **Capability-based Assignment** - Automatic matching of tasks to agents based on required capabilities
- **Load Balancing** - Multiple strategies: round-robin, least-loaded, capability-based, random
- **Task Dependencies** - Support for task ordering and conditional execution
- **Task Decomposition** - Automatic breaking of large tasks into subtasks

### 2. Agent Orchestration
- **Master Coordinator** - Central orchestration of all agent activities
- **Worker Agent Pool** - Dynamic pool management with auto-scaling
- **Heartbeat Monitoring** - Automatic health checks and failover
- **Execution Modes** - Sequential, parallel, pipeline, and hybrid execution

### 3. Shared State Management
- **Distributed Locks** - Redis-based locking for critical sections
- **Shared Cache** - Collaborative data sharing between agents
- **Conflict Resolution** - Multiple strategies: last-write-wins, first-write-wins, merge, vote
- **State Synchronization** - Automatic version control and consistency

### 4. Coordination Patterns

#### Map-Reduce
Distribute data processing across agents and aggregate results.

```typescript
import { MapReducePattern } from '@the-new-fuse/agent-coordination';

const mapReduce = new MapReducePattern(coordinator);

const result = await mapReduce.execute(
  largeDataset,
  async (records, partition) => {
    return records.reduce((sum, r) => sum + r.value, 0);
  },
  async (partialSums) => {
    return partialSums.reduce((total, sum) => total + sum, 0);
  },
  { mapConcurrency: 5 }
);
```

#### Pipeline
Sequential processing through multiple stages (A → B → C).

```typescript
import { PipelinePattern } from '@the-new-fuse/agent-coordination';

const pipeline = new PipelinePattern(coordinator);

const result = await pipeline.execute(inputData, [
  {
    name: 'validate',
    type: 'validation',
    processFn: async (data) => ({ ...data, validated: true }),
    requiredCapabilities: ['validation'],
  },
  {
    name: 'transform',
    type: 'transformation',
    processFn: async (data) => ({ ...data, transformed: true }),
    requiredCapabilities: ['transformation'],
  },
  {
    name: 'persist',
    type: 'persistence',
    processFn: async (data) => ({ ...data, persisted: true }),
    requiredCapabilities: ['persistence'],
  },
]);
```

#### Consensus
Multi-agent voting and decision making.

```typescript
import { ConsensusPattern } from '@the-new-fuse/agent-coordination';

const consensus = new ConsensusPattern(coordinator, 'majority');

const result = await consensus.achieveConsensus(
  proposedValue,
  proposerId,
  agents,
  {
    maxRounds: 3,
    timeout: 30000,
  }
);

if (result.achieved) {
  console.log('Consensus achieved:', result.value);
  console.log('Approval rate:', (result.approvalRate * 100) + '%');
}
```

#### Swarm Intelligence
Self-organizing agents for optimization problems.

```typescript
import { SwarmPattern } from '@the-new-fuse/agent-coordination';

const swarm = new SwarmPattern(coordinator, sharedCache);

await swarm.initialize(agents, initialSolution, {
  explore: 0.4,
  exploit: 0.6,
  communicate: 0.8,
  adapt: 0.7,
});

const solution = await swarm.optimize(
  agents,
  async (solution) => {
    // Fitness function
    return -(solution.x ** 2 + solution.y ** 2) + 100;
  },
  { maxGenerations: 100 }
);

console.log('Best solution:', solution.value);
console.log('Fitness:', solution.fitness);
```

### 5. Monitoring & Control
- **Real-time Activity Dashboard** - Live view of agent activities
- **Performance Metrics** - Tasks/second, success rate, execution time
- **System Health Monitoring** - Automatic health checks and alerts
- **Emergency Controls** - Pause, resume, and emergency stop capabilities

## Quick Start

### Basic Setup

```typescript
import {
  Coordinator,
  AgentPool,
  TaskPriority,
  MetricsCollector,
  ActivityMonitor,
} from '@the-new-fuse/agent-coordination';

// Initialize agent pool
const agentPool = new AgentPool({
  minAgents: 3,
  maxAgents: 10,
  scaleUpThreshold: 0.8,
  scaleDownThreshold: 0.2,
  heartbeatInterval: 5000,
  heartbeatTimeout: 15000,
});

// Initialize coordinator
const coordinator = new Coordinator(
  'redis://localhost:6379',
  agentPool,
  {
    maxConcurrentTasks: 20,
    taskTimeout: 60000,
    loadBalancing: {
      strategy: 'least-loaded',
      considerCapabilities: true,
    },
  }
);

// Register agents
for (let i = 1; i <= 5; i++) {
  agentPool.registerAgent({
    name: `Worker-${i}`,
    type: 'worker',
    capabilities: [
      { name: 'data-processing', version: '1.0' },
      { name: 'analysis', version: '1.0' },
    ],
    maxConcurrentTasks: 5,
  });
}

// Start coordinator
await coordinator.start();

// Submit tasks
const task = await coordinator.submitTask(
  'process-data',
  { data: 'sample' },
  {
    priority: TaskPriority.HIGH,
    requiredCapabilities: ['data-processing'],
    timeout: 30000,
  }
);
```

### Complete Example: 5 Agents Collaborating

```typescript
import {
  Coordinator,
  AgentPool,
  MapReducePattern,
  SharedCache,
} from '@the-new-fuse/agent-coordination';

async function processLargeDataset() {
  const redisUrl = 'redis://localhost:6379';

  // Setup
  const agentPool = new AgentPool({
    minAgents: 5,
    maxAgents: 10,
    scaleUpThreshold: 0.8,
    scaleDownThreshold: 0.2,
    heartbeatInterval: 5000,
    heartbeatTimeout: 15000,
  });

  const coordinator = new Coordinator(redisUrl, agentPool);
  const sharedCache = new SharedCache(redisUrl);
  const mapReduce = new MapReducePattern(coordinator);

  // Register 5 agents
  const agents = [];
  for (let i = 1; i <= 5; i++) {
    const agent = agentPool.registerAgent({
      name: `DataProcessor-${i}`,
      type: 'data-processor',
      capabilities: [
        { name: 'data-processing', version: '1.0' },
      ],
      maxConcurrentTasks: 3,
    });
    agents.push(agent);
  }

  await coordinator.start();

  // Dataset to process
  const dataset = Array.from({ length: 1000 }, (_, i) => ({
    userId: `user-${i}`,
    purchases: Math.floor(Math.random() * 100),
    revenue: Math.random() * 1000,
  }));

  // Process with Map-Reduce
  const result = await mapReduce.execute(
    dataset,
    // Map: Each agent processes a partition
    async (records, partition) => {
      const totalPurchases = records.reduce((sum, r) => sum + r.purchases, 0);
      const totalRevenue = records.reduce((sum, r) => sum + r.revenue, 0);

      return {
        partition,
        totalPurchases,
        totalRevenue,
        recordCount: records.length,
      };
    },
    // Reduce: Aggregate all results
    async (results) => {
      return {
        totalUsers: results.reduce((sum, r) => sum + r.recordCount, 0),
        totalPurchases: results.reduce((sum, r) => sum + r.totalPurchases, 0),
        totalRevenue: results.reduce((sum, r) => sum + r.totalRevenue, 0),
        partitionsProcessed: results.length,
      };
    },
    { mapConcurrency: 5 }
  );

  console.log('Processing complete:', result);

  // Cleanup
  await coordinator.close();
  await sharedCache.close();

  return result;
}
```

## Examples

Complete working examples are available in [src/examples/multi-agent-examples.ts](./src/examples/multi-agent-examples.ts):

1. **Map-Reduce Data Processing** - 5 agents processing 1000 records in parallel
2. **Pipeline Data Transformation** - 5 agents processing data through sequential stages
3. **Consensus Decision Making** - 5 agents voting on deployment strategy
4. **Swarm Optimization** - 5 agents searching for optimal solution
5. **Complex Multi-Pattern Workflow** - Combining Pipeline → Map-Reduce → Consensus

Run examples:
```bash
cd packages/agent-coordination
pnpm run examples
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Coordinator                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Task Queue   │  │ Agent Pool   │  │ Task Assigner│     │
│  │ (Priority)   │  │ (Dynamic)    │  │ (Load Balance)│    │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Coordination Patterns                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Map-Reduce│  │ Pipeline │  │Consensus │  │  Swarm   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    State Management                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │Dist. Locks   │  │ Shared Cache │  │Conflict Res. │     │
│  │ (Redis)      │  │   (Redis)    │  │  (Versioned) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Monitoring & Metrics                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │Activity Mon. │  │  Metrics     │  │   Alerts     │     │
│  │  (Real-time) │  │ (Collector)  │  │  (Warnings)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## API Reference

### Core Classes

#### Coordinator
Main orchestration engine for multi-agent coordination.

```typescript
class Coordinator extends EventEmitter {
  constructor(
    redisUrl: string,
    agentPoolConfig: AgentPoolConfig,
    coordinationConfig?: CoordinationConfig
  )

  async start(): Promise<void>
  async stop(): Promise<void>
  async submitTask(type: string, payload: any, options?: TaskOptions): Promise<Task>
  async submitTasks(tasks: TaskSubmission[]): Promise<Task[]>
  async reportTaskResult(result: TaskResult): Promise<void>
  async getStatistics(): Promise<CoordinatorStatistics>
  async emergencyStop(): Promise<void>
  async close(): Promise<void>
}

// Events
coordinator.on('task:submitted', (task) => {})
coordinator.on('task:assigned', (task, assignment) => {})
coordinator.on('task:completed', (task) => {})
coordinator.on('task:failed', (task, error) => {})
```

#### AgentPool
Manages a dynamic pool of worker agents.

```typescript
class AgentPool extends EventEmitter {
  constructor(config: AgentPoolConfig)

  registerAgent(agent: Partial<AgentInfo>): AgentInfo
  unregisterAgent(agentId: string): boolean
  getAgent(agentId: string): AgentInfo | undefined
  getAllAgents(): AgentInfo[]
  getAvailableAgents(): AgentInfo[]
  updateAgentStatus(agentId: string, status: AgentStatus): boolean
  updateAgentLoad(agentId: string, load: number): boolean
  getStatistics(): AgentPoolStatistics
  autoScale(): { action: string; reason: string }
  close(): void
}

// Events
agentPool.on('agent:registered', (agent) => {})
agentPool.on('agent:unregistered', (agent) => {})
agentPool.on('agent:heartbeat:timeout', (agent) => {})
```

### Coordination Patterns

#### MapReducePattern

```typescript
class MapReducePattern<TInput, TMapOutput, TFinalOutput> {
  constructor(coordinator: Coordinator)

  async execute(
    input: TInput[],
    mapFn: MapFunction<TInput, TMapOutput>,
    reduceFn: ReduceFunction<TMapOutput, TFinalOutput>,
    options?: { mapConcurrency?: number; timeout?: number }
  ): Promise<TFinalOutput>
}
```

#### PipelinePattern

```typescript
class PipelinePattern {
  constructor(coordinator: Coordinator)

  async execute<TInput, TOutput>(
    input: TInput,
    stages: PipelineStage[],
    options?: { priority?: TaskPriority; timeout?: number }
  ): Promise<TOutput>

  async executeHybrid<TInput, TOutput>(
    input: TInput,
    stageGroups: PipelineStage[][],
    options?: { priority?: TaskPriority; timeout?: number }
  ): Promise<TOutput>
}
```

#### ConsensusPattern

```typescript
class ConsensusPattern<T> {
  constructor(coordinator: Coordinator, strategy: ConsensusStrategy)

  async propose(
    value: T,
    proposerId: string,
    metadata?: Record<string, any>
  ): Promise<ConsensusProposal<T>>

  async vote(
    proposalId: string,
    voterId: string,
    approve: boolean,
    alternativeValue?: T,
    reason?: string
  ): Promise<Vote<T>>

  async achieveConsensus(
    initialValue: T,
    proposerId: string,
    agents: AgentInfo[],
    options?: { maxRounds?: number; timeout?: number }
  ): Promise<ConsensusResult<T>>
}
```

#### SwarmPattern

```typescript
class SwarmPattern<T> {
  constructor(coordinator: Coordinator, sharedCache: SharedCache)

  async initialize(
    agents: AgentInfo[],
    initialSolution: T,
    behavior?: SwarmBehavior
  ): Promise<void>

  async optimize(
    agents: AgentInfo[],
    fitnessFn: (solution: T) => Promise<number>,
    options?: { maxGenerations?: number; convergenceThreshold?: number }
  ): Promise<SwarmSolution<T>>

  async search(
    agents: AgentInfo[],
    searchSpace: T[],
    evaluateFn: (solution: T) => Promise<number>,
    options?: { maxIterations?: number }
  ): Promise<SwarmSolution<T>[]>
}
```

### State Management

#### SharedCache

```typescript
class SharedCache {
  constructor(redisUrl: string, prefix?: string)

  async get<T>(key: string): Promise<T | null>
  async set(key: string, value: any, ttl?: number): Promise<void>
  async delete(key: string): Promise<boolean>
  async mget<T>(keys: string[]): Promise<(T | null)[]>
  async increment(key: string, amount?: number): Promise<number>
  async addToSet(key: string, ...members: string[]): Promise<number>
  async getHashField<T>(key: string, field: string): Promise<T | null>
  async setHashField(key: string, field: string, value: any): Promise<void>
}
```

#### DistributedLock

```typescript
class DistributedLock {
  constructor(redisUrl: string)

  async acquire(key: string, ttl?: number, retries?: number): Promise<string | null>
  async release(key: string, token: string): Promise<boolean>
  async extend(key: string, token: string, ttl: number): Promise<boolean>
  async withLock<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T>
}
```

### Monitoring

#### MetricsCollector

```typescript
class MetricsCollector {
  recordTaskStarted(task: Task, agentId?: string): void
  recordTaskCompleted(taskId: string): void
  recordTaskFailed(taskId: string): void

  getCurrentMetrics(agents: AgentInfo[], queueDepth: number): PerformanceMetrics
  getDetailedMetrics(start: Date, end: Date, agents: AgentInfo[]): DetailedMetrics
  getSummary(): MetricsSummary
}
```

#### ActivityMonitor

```typescript
class ActivityMonitor {
  start(intervalMs?: number): void
  stop(): void

  async getSystemHealth(): Promise<SystemHealth>
  async getDashboardData(): Promise<DashboardData>
  getRecentActivity(count?: number): ActivityEvent[]
  getActiveAlerts(): Alert[]
}
```

## Performance Benchmarks

Typical performance with 5 agents and Redis:

| Metric | Value |
|--------|-------|
| Task Throughput | 100-200 tasks/second |
| Map-Reduce (1000 records) | 2-3 seconds |
| Pipeline (5 stages) | 1-2 seconds |
| Consensus (5 agents, 3 rounds) | 0.5-1 second |
| Swarm Optimization (10 generations) | 3-5 seconds |
| Average Task Latency | 10-50ms |
| Success Rate | >99% |

## Best Practices

1. **Agent Pool Sizing**
   - Start with minAgents = expected_load / agent_capacity
   - Set maxAgents to 2-3x expected peak load
   - Use auto-scaling thresholds around 70-80%

2. **Task Timeouts**
   - Set task timeouts 2-3x expected execution time
   - Use exponential backoff for retries
   - Maximum 3-5 retry attempts

3. **Redis Configuration**
   - Use persistent Redis for production
   - Configure maxmemory-policy to `allkeys-lru`
   - Monitor Redis memory usage

4. **Monitoring**
   - Enable activity monitoring in production
   - Set up alerts for success rate < 90%
   - Monitor queue depth and agent health

## License

MIT
