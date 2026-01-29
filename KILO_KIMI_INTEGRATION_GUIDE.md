# Kilo Code + KIMI k2.5 Integration Guide

## Complete Guide to Orchestrating 100 Parallel AI Agents

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation & Setup](#installation--setup)
4. [Configuration](#configuration)
5. [Usage Patterns](#usage-patterns)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)
8. [API Reference](#api-reference)

---

## Overview

The **Kilo Code + KIMI k2.5 Integration** enables orchestration of up to 100
parallel KIMI k2.5 AI agents within The New Fuse (TNF) ecosystem. This powerful
combination allows you to:

- **Scale Development**: Parallelize code reviews, testing, and refactoring
  across massive codebases
- **Optimize Architecture**: Use swarm intelligence to explore architectural
  solutions
- **Accelerate Delivery**: Distribute complex tasks across 100 specialized
  agents
- **Ensure Quality**: Implement consensus-based decision making for critical
  choices

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Kilo Code (Orchestrator)                    │
│                         MCP Client                              │
└─────────────────────┬───────────────────────────────────────────┘
                      │ MCP Protocol
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              KIMI Orchestrator (MCP Server)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Agent Pool  │  │  Task       │  │    Health Monitor       │  │
│  │  (0-100)    │  │ Distributor │  │                         │  │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────────┘  │
└─────────┼────────────────┼──────────────────────────────────────┘
          │                │
          │ WebSocket      │ Task Assignment
          ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TNF Relay Server                             │
│              (WebSocket Message Broker)                         │
└─────────────────────┬───────────────────────────────────────────┘
                      │ Relay Protocol
          ┌───────────┼───────────┐
          ▼           ▼           ▼
    ┌─────────┐ ┌─────────┐ ┌─────────┐
    │KIMI #1  │ │KIMI #2  │ │KIMI #N  │ ... up to 100
    │k2.5     │ │k2.5     │ │k2.5     │
    └─────────┘ └─────────┘ └─────────┘
```

---

## Prerequisites

### System Requirements

| Component  | Minimum | Recommended |
| ---------- | ------- | ----------- |
| Node.js    | 20.x    | 22.x LTS    |
| RAM        | 8 GB    | 32 GB       |
| CPU Cores  | 4       | 16+         |
| Redis      | 6.x     | 7.x         |
| PostgreSQL | 14.x    | 16.x        |

### Software Dependencies

```bash
# Required global tools
npm install -g pnpm@latest
npm install -g tsx

# Verify installations
node --version    # v20+ required
pnpm --version    # 9.x required
```

### Infrastructure Prerequisites

1. **TNF Relay Server** running on `ws://localhost:3000/ws`
2. **Redis** instance for state management (optional but recommended)
3. **PostgreSQL** database for persistence

---

## Installation & Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-org/the-new-fuse.git
cd the-new-fuse

# Install dependencies using pnpm (REQUIRED)
pnpm install

# Build the kimi-orchestrator package
pnpm build --filter @the-new-fuse/kimi-orchestrator
```

### 2. Environment Configuration

Create a `.env` file in your project root:

```bash
# Core TNF Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/tnf_db
REDIS_URL=redis://localhost:6379

# Relay Server
RELAY_URL=ws://localhost:3000/ws
RELAY_API_KEY=your_relay_api_key

# KIMI Orchestrator
KIMI_MAX_AGENTS=100
KIMI_HEARTBEAT_INTERVAL_MS=30000
KIMI_AGENT_TIMEOUT_MS=120000
KIMI_ENABLE_AUTO_RECOVERY=true
KIMI_LOG_LEVEL=info

# MCP Server Configuration
MCP_SERVER_PORT=3001
MCP_LOG_LEVEL=info
```

### 3. Configure Kilo Code MCP

Add the KIMI orchestrator to your `.kilocode/mcp.json`:

```json
{
  "mcpServers": {
    "kimi-orchestrator": {
      "command": "node",
      "args": [
        "${workspaceFolder}/packages/kimi-orchestrator/dist/mcp-server.js"
      ],
      "env": {
        "RELAY_URL": "ws://localhost:3000/ws",
        "REDIS_URL": "redis://localhost:6379",
        "KIMI_MAX_AGENTS": "100"
      },
      "disabled": false,
      "autoApprove": ["register_agent", "submit_task", "get_pool_stats"]
    }
  }
}
```

### 4. Start the Infrastructure

```bash
# Start the relay server
pnpm relay:start

# Start the MCP server (optional - can run via Kilo Code)
pnpm --filter @the-new-fuse/kimi-orchestrator mcp-server
```

---

## Configuration

### Orchestrator Configuration Options

```typescript
interface KimiOrchestratorConfig {
  /** Maximum number of parallel agents (default: 100, max: 100) */
  maxAgents: number;

  /** WebSocket URL for TNF relay server */
  relayUrl: string;

  /** Redis connection URL for distributed state */
  redisUrl?: string;

  /** Heartbeat interval in milliseconds (default: 30000) */
  heartbeatIntervalMs: number;

  /** Agent timeout in milliseconds (default: 120000) */
  agentTimeoutMs: number;

  /** Task distribution strategy */
  distributionStrategy: 'round-robin' | 'load-balanced' | 'capability-based';

  /** Enable automatic agent recovery */
  enableAutoRecovery: boolean;

  /** Maximum retries for failed tasks */
  maxRetries: number;

  /** Log level */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}
```

### Load Balancing Configuration

```typescript
interface LoadBalanceConfig {
  /** Load balancing strategy */
  strategy:
    | 'round-robin'
    | 'least-connections'
    | 'weighted-response-time'
    | 'capability-matching';

  /** Weight for response time in agent selection (0-1) */
  responseTimeWeight: number;

  /** Weight for current load in agent selection (0-1) */
  loadWeight: number;

  /** Weight for capability matching in agent selection (0-1) */
  capabilityWeight: number;

  /** Enable sticky sessions for related tasks */
  enableStickySessions: boolean;

  /** Maximum concurrent tasks per agent */
  maxTasksPerAgent: number;
}
```

### Configuration Examples

#### High-Performance Configuration

```typescript
const highPerfConfig: Partial<KimiOrchestratorConfig> = {
  maxAgents: 100,
  distributionStrategy: 'capability-based',
  heartbeatIntervalMs: 15000, // 15 seconds
  agentTimeoutMs: 60000, // 1 minute
  enableAutoRecovery: true,
  maxRetries: 5,
  logLevel: 'warn',
};
```

#### Development Configuration

```typescript
const devConfig: Partial<KimiOrchestratorConfig> = {
  maxAgents: 10,
  distributionStrategy: 'round-robin',
  heartbeatIntervalMs: 60000, // 1 minute
  agentTimeoutMs: 300000, // 5 minutes
  enableAutoRecovery: false,
  maxRetries: 1,
  logLevel: 'debug',
};
```

---

## Usage Patterns

### Pattern 1: Parallel Code Review

Review an entire codebase with 100 agents simultaneously:

```typescript
import { KimiOrchestrator } from '@the-new-fuse/kimi-orchestrator';
import { glob } from 'glob';

async function parallelCodeReview() {
  const orchestrator = new KimiOrchestrator({
    maxAgents: 100,
    distributionStrategy: 'capability-based',
  });

  await orchestrator.start();

  // Get all source files
  const files = await glob('src/**/*.{ts,tsx,js,jsx}');

  // Distribute files across agents
  const tasks = files.map((file) => ({
    type: 'code-review',
    payload: { file, checks: ['security', 'performance', 'style'] },
    requiredCapabilities: ['code-review', 'typescript'],
  }));

  // Submit all tasks in parallel
  const results = await Promise.all(
    tasks.map((task) =>
      orchestrator.submitTask(task.type, task.payload, {
        requiredCapabilities: task.requiredCapabilities,
        priority: 8,
      })
    )
  );

  // Aggregate results
  const reviewReport = aggregateReviews(results);
  return reviewReport;
}
```

### Pattern 2: Swarm Architecture Optimization

Use swarm intelligence to explore architectural solutions:

```typescript
async function swarmArchitectureOptimization() {
  const orchestrator = new KimiOrchestrator({
    maxAgents: 50,
    distributionStrategy: 'capability-based',
  });

  await orchestrator.start();

  // Define the architecture problem
  const architectureProblem = {
    constraints: ['scalability', 'latency < 100ms', 'cost < $1000/mo'],
    requirements: ['handle 10k req/s', '99.99% uptime'],
    currentDesign: loadCurrentDesign(),
  };

  // Create diverse agent configurations for exploration
  const agentConfigs = [
    { capabilities: ['architecture-design', 'microservices'], priority: 10 },
    { capabilities: ['architecture-design', 'serverless'], priority: 10 },
    { capabilities: ['architecture-design', 'event-driven'], priority: 10 },
    // ... more configurations
  ];

  // Register agents with different specialties
  for (let i = 0; i < 50; i++) {
    const config = agentConfigs[i % agentConfigs.length];
    await orchestrator.registerAgent(`architect-${i}`, config.capabilities);
  }

  // Run swarm optimization
  const swarmResults = await runSwarmOptimization(
    orchestrator,
    architectureProblem
  );

  // Select best solution via voting
  const bestSolution = await consensusVote(swarmResults);
  return bestSolution;
}
```

### Pattern 3: Distributed Testing

Run tests across 100 parallel agents:

```typescript
async function distributedTesting() {
  const orchestrator = new KimiOrchestrator({
    maxAgents: 100,
    distributionStrategy: 'load-balanced',
  });

  await orchestrator.start();

  // Split test suite into chunks
  const testFiles = await glob('**/*.test.ts');
  const chunks = chunkArray(testFiles, Math.ceil(testFiles.length / 100));

  // Assign each chunk to a different agent
  const testPromises = chunks.map((chunk, index) =>
    orchestrator.submitTask(
      'run-tests',
      { files: chunk, coverage: true },
      {
        requiredCapabilities: ['testing', 'typescript'],
        priority: 10,
        timeoutMs: 600000, // 10 minutes
      }
    )
  );

  // Collect all test results
  const results = await Promise.all(testPromises);

  // Merge coverage reports
  const coverage = mergeCoverage(results.map((r) => r.coverage));

  return { results, coverage };
}
```

### Pattern 4: Multi-Modal Refactoring

Refactor a large codebase with parallel agents:

```typescript
async function multiModalRefactoring() {
  const orchestrator = new KimiOrchestrator({
    maxAgents: 100,
    distributionStrategy: 'capability-based',
  });

  await orchestrator.start();

  // Analyze codebase structure
  const analysis = await analyzeCodebase();

  // Create refactoring tasks for different aspects
  const refactoringTasks = [
    { type: 'typescript-migration', files: analysis.jsFiles },
    { type: 'dependency-cleanup', files: analysis.packageFiles },
    { type: 'api-migration', files: analysis.apiFiles },
    { type: 'test-update', files: analysis.testFiles },
  ];

  // Submit tasks with dependencies
  const taskIds = [];
  for (const task of refactoringTasks) {
    const result = await orchestrator.submitTask(
      task.type,
      { files: task.files, analysis },
      {
        requiredCapabilities: ['refactoring', 'typescript'],
        priority: 9,
      }
    );
    taskIds.push(result.taskId);
  }

  // Wait for all tasks with progress tracking
  const results = await orchestrator.waitForTasks(taskIds, {
    onProgress: (completed, total) => {
      console.log(`Progress: ${completed}/${total} tasks completed`);
    },
  });

  return results;
}
```

### Pattern 5: Consensus-Based Decision Making

Make architectural decisions using agent consensus:

```typescript
async function consensusDecision(proposal: string) {
  const orchestrator = new KimiOrchestrator({
    maxAgents: 100,
    distributionStrategy: 'capability-based',
  });

  await orchestrator.start();

  // Register agents with different perspectives
  const perspectives = [
    'security-expert',
    'performance-expert',
    'scalability-expert',
    'maintainability-expert',
    'cost-expert',
  ];

  for (let i = 0; i < 100; i++) {
    const perspective = perspectives[i % perspectives.length];
    await orchestrator.registerAgent(`voter-${i}`, [
      'analysis',
      'architecture-design',
      perspective as any,
    ]);
  }

  // Each agent evaluates the proposal
  const votes = await Promise.all(
    Array.from({ length: 100 }, (_, i) =>
      orchestrator.submitTask(
        'evaluate-proposal',
        { proposal, perspective: perspectives[i % perspectives.length] },
        {
          requiredCapabilities: ['analysis', 'architecture-design'],
          priority: 10,
        }
      )
    )
  );

  // Calculate consensus
  const decision = calculateConsensus(votes);

  return {
    approved: decision.approvalRate > 0.7,
    approvalRate: decision.approvalRate,
    concerns: decision.concerns,
    recommendations: decision.recommendations,
  };
}
```

---

## Best Practices

### 1. Agent Lifecycle Management

```typescript
// Always properly clean up agents
async function managedAgentSession() {
  const orchestrator = new KimiOrchestrator();

  try {
    await orchestrator.start();

    // Register agents
    const agentIds = [];
    for (let i = 0; i < 50; i++) {
      const id = `agent-${i}`;
      await orchestrator.registerAgent(id, ['code-generation']);
      agentIds.push(id);
    }

    // Do work...
  } finally {
    // Always stop the orchestrator
    await orchestrator.stop();
  }
}
```

### 2. Task Prioritization

```typescript
// Use appropriate priority levels
const PRIORITIES = {
  CRITICAL: 10, // Production issues, security fixes
  HIGH: 8, // Feature work, important refactors
  MEDIUM: 5, // Regular development
  LOW: 3, // Documentation, cleanup
  BACKGROUND: 1, // Analysis, metrics
};

await orchestrator.submitTask('security-audit', payload, {
  priority: PRIORITIES.CRITICAL,
});
```

### 3. Error Handling

```typescript
// Implement proper error handling
async function resilientTaskExecution() {
  const results = await Promise.allSettled(
    tasks.map((task) =>
      orchestrator.submitTask(task.type, task.payload).catch((error) => ({
        success: false,
        error: error.message,
        task: task.id,
      }))
    )
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled');
  const failed = results.filter((r) => r.status === 'rejected');

  console.log(`Completed: ${succeeded.length}, Failed: ${failed.length}`);

  // Retry failed tasks
  for (const failure of failed) {
    await retryWithBackoff(failure);
  }
}
```

### 4. Monitoring and Observability

```typescript
// Set up monitoring
orchestrator.on('agent:registered', (data) => {
  metrics.increment('agent.registered', { agentId: data.agentId });
});

orchestrator.on('task:completed', (data) => {
  metrics.timing('task.duration', data.duration);
  metrics.increment('task.completed', { type: data.taskType });
});

orchestrator.on('agent:failed', (data) => {
  metrics.increment('agent.failed', { agentId: data.agentId });
  alertOpsTeam(data);
});

// Health checks
setInterval(async () => {
  const stats = orchestrator.getStats();
  if (stats.utilizationPercent > 90) {
    console.warn('High agent utilization - consider scaling');
  }
}, 60000);
```

### 5. Resource Management

```typescript
// Implement circuit breakers for external calls
class CircuitBreaker {
  private failures = 0;
  private threshold = 5;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker open');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}

// Rate limiting for task submission
class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private maxTokens: number,
    private refillRate: number
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refill();
    if (this.tokens > 0) {
      this.tokens--;
      return;
    }
    await new Promise((r) => setTimeout(r, 1000 / this.refillRate));
    return this.acquire();
  }
}
```

---

## Troubleshooting

### Common Issues

#### Issue: Agents Not Registering

**Symptoms**: No agents appear in pool stats

**Solutions**:

```bash
# 1. Check relay server connectivity
curl http://localhost:3000/health

# 2. Verify WebSocket connection
pnpm --filter @the-new-fuse/kimi-orchestrator test:ws

# 3. Check logs
pnpm logs --filter @the-new-fuse/kimi-orchestrator

# 4. Restart relay
pnpm relay:restart
```

#### Issue: High Task Failure Rate

**Symptoms**: >20% of tasks failing

**Solutions**:

```typescript
// Increase timeout
const orchestrator = new KimiOrchestrator({
  agentTimeoutMs: 300000, // 5 minutes
  maxRetries: 5,
});

// Check agent health
const stats = orchestrator.getStats();
console.log('Healthy agents:', stats.healthyAgents);
console.log('Unhealthy agents:', stats.unhealthyAgents);

// Enable debug logging
const orchestrator = new KimiOrchestrator({
  logLevel: 'debug',
});
```

#### Issue: Memory Leaks

**Symptoms**: Memory usage growing over time

**Solutions**:

```bash
# Monitor memory usage
node --inspect packages/kimi-orchestrator/dist/index.js

# Enable garbage collection logging
NODE_OPTIONS="--trace-gc" pnpm kimi-orchestrator

# Set memory limits
NODE_OPTIONS="--max-old-space-size=8192" pnpm kimi-orchestrator
```

#### Issue: Redis Connection Failures

**Symptoms**: "Redis connection refused" errors

**Solutions**:

```bash
# Check Redis status
redis-cli ping

# Verify connection URL
echo $REDIS_URL

# Test Redis connection
pnpm --filter @the-new-fuse/kimi-orchestrator test:redis
```

### Debugging Commands

```bash
# Get pool statistics
curl http://localhost:3001/stats | jq

# List all agents
curl http://localhost:3001/agents | jq

# Check task queue
curl http://localhost:3001/tasks/queue | jq

# View recent logs
pnpm logs --filter @the-new-fuse/kimi-orchestrator --tail 100

# Run diagnostics
pnpm --filter @the-new-fuse/kimi-orchestrator diagnose
```

### Performance Tuning

```typescript
// Optimize for your workload
const config: Partial<KimiOrchestratorConfig> = {
  // Reduce heartbeat for lower latency
  heartbeatIntervalMs: 15000,

  // Increase timeout for long-running tasks
  agentTimeoutMs: 600000,

  // Use capability-based routing for specialized tasks
  distributionStrategy: 'capability-based',

  // Enable auto-recovery
  enableAutoRecovery: true,
  maxRetries: 3,
};
```

---

## API Reference

### KimiOrchestrator Class

#### Constructor

```typescript
constructor(config?: Partial<KimiOrchestratorConfig>)
```

#### Methods

| Method                               | Description              | Returns                                    |
| ------------------------------------ | ------------------------ | ------------------------------------------ |
| `start()`                            | Start the orchestrator   | `Promise<void>`                            |
| `stop()`                             | Stop the orchestrator    | `Promise<void>`                            |
| `registerAgent(id, capabilities)`    | Register a new agent     | `Promise<boolean>`                         |
| `unregisterAgent(id)`                | Remove an agent          | `Promise<boolean>`                         |
| `submitTask(type, payload, options)` | Submit a task            | `Promise<OperationResult<TaskAssignment>>` |
| `getStats()`                         | Get pool statistics      | `AgentPoolStats`                           |
| `getAgent(id)`                       | Get agent details        | `KimiAgent \| undefined`                   |
| `waitForTasks(ids, options)`         | Wait for task completion | `Promise<TaskResult[]>`                    |

### Events

| Event                  | Payload                     | Description                 |
| ---------------------- | --------------------------- | --------------------------- |
| `agent:registered`     | `{ agentId, capabilities }` | Agent joined pool           |
| `agent:unregistered`   | `{ agentId }`               | Agent left pool             |
| `agent:health_changed` | `{ agentId, health }`       | Health status changed       |
| `task:assigned`        | `{ task, agentId }`         | Task assigned to agent      |
| `task:completed`       | `{ task, result }`          | Task completed successfully |
| `task:failed`          | `{ task, error }`           | Task failed                 |
| `pool:stats`           | `AgentPoolStats`            | Periodic stats update       |

### MCP Tools

| Tool               | Description                  |
| ------------------ | ---------------------------- |
| `register_agent`   | Register a new KIMI agent    |
| `unregister_agent` | Unregister an agent          |
| `submit_task`      | Submit a task to the pool    |
| `get_pool_stats`   | Get current pool statistics  |
| `get_agent_status` | Get status of specific agent |
| `list_agents`      | List all registered agents   |
| `cancel_task`      | Cancel a pending task        |

---

## Additional Resources

- [Examples Directory](./examples/kimi-orchestration/)
- [KIMI Orchestrator Package](./packages/kimi-orchestrator/)
- [TNF Relay Documentation](./docs/relay/)
- [MCP Specification](https://modelcontextprotocol.io/)

## Support

For issues and questions:

- GitHub Issues:
  [the-new-fuse/issues](https://github.com/your-org/the-new-fuse/issues)
- Discord: [TNF Community](https://discord.gg/tnf)
- Documentation: [docs.thenewfuse.com](https://docs.thenewfuse.com)

---

_Last Updated: 2026-01-29_ _Version: 1.0.0_
