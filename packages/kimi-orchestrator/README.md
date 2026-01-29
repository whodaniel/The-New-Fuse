# @the-new-fuse/kimi-orchestrator

Orchestrator for managing 100 parallel KIMI k2.5 agents in The New Fuse
ecosystem.

## Overview

The KIMI Orchestrator provides a robust infrastructure for managing a fleet of
up to 100 parallel KIMI k2.5 AI agents. It handles agent lifecycle, task
distribution, health monitoring, and seamless integration with the TNF relay
server.

## Features

- **Agent Pool Management**: Manage up to 100 concurrent KIMI k2.5 agents
- **Intelligent Task Distribution**: Multiple load balancing strategies
  (round-robin, least-connections, weighted-response-time, capability-matching)
- **Health Monitoring**: Automatic health checks with configurable thresholds
  and auto-recovery
- **Task Decomposition**: Break complex tasks into parallel, sequential, or
  DAG-based subtasks
- **MCP Server Integration**: Full Model Context Protocol support for Kilo Code
  integration
- **WebSocket Relay**: Real-time communication via TNF relay server
- **Redis State Management**: Optional Redis backend for distributed state

## Installation

```bash
pnpm add @the-new-fuse/kimi-orchestrator
```

## Usage

### Basic Usage

```typescript
import { KimiOrchestrator } from '@the-new-fuse/kimi-orchestrator';

// Create orchestrator instance
const orchestrator = new KimiOrchestrator({
  maxAgents: 100,
  relayUrl: 'ws://localhost:3000/ws',
  redisUrl: 'redis://localhost:6379',
  heartbeatIntervalMs: 30000,
  agentTimeoutMs: 120000,
  distributionStrategy: 'load-balanced',
  enableAutoRecovery: true,
  maxRetries: 3,
});

// Start the orchestrator
await orchestrator.start();

// Register agents
await orchestrator.registerAgent('agent-001', [
  'code-generation',
  'typescript',
  'react',
]);

// Submit tasks
const result = await orchestrator.submitTask(
  'code-review',
  { files: ['src/app.ts'] },
  {
    requiredCapabilities: ['code-review', 'typescript'],
    priority: 8,
    timeoutMs: 300000,
  }
);

// Get statistics
const stats = orchestrator.getStats();
console.log(`Pool utilization: ${stats.utilizationPercent}%`);
```

### As MCP Server

```bash
# Run as standalone MCP server
pnpm kimi-orchestrator
```

Or programmatically:

```typescript
import { KimiMcpServer } from '@the-new-fuse/kimi-orchestrator';

const server = new KimiMcpServer();
await server.start();
```

## Architecture

### Components

- **KimiOrchestrator**: Main orchestrator class coordinating all components
- **AgentPool**: Manages the pool of KIMI agents with lifecycle management
- **TaskDistributor**: Intelligent task distribution with multiple strategies
- **HealthMonitor**: Monitors agent health and handles recovery
- **KimiMcpServer**: MCP server for Kilo Code integration

### Load Balancing Strategies

1. **Round-Robin**: Evenly distributes tasks across all available agents
2. **Least-Connections**: Assigns tasks to agents with fewest active connections
3. **Weighted-Response-Time**: Prefers agents with faster historical response
   times
4. **Capability-Matching**: Matches tasks to agents with required capabilities

### Task Decomposition

The orchestrator supports decomposing complex tasks into subtasks:

```typescript
const decomposition = await orchestrator.decomposeTask(
  'refactor-project',
  { files: ['file1.ts', 'file2.ts', 'file3.ts'] },
  'parallel' // or 'sequential', 'dag'
);

// decomposition.subtasks contains individual subtasks
// decomposition.dependencies maps task dependencies
```

## MCP Tools

When running as an MCP server, the following tools are available:

### kimi_register_agent

Register a new KIMI agent with specific capabilities.

### kimi_unregister_agent

Remove an agent from the orchestrator.

### kimi_assign_task

Submit a task for execution by the agent fleet.

### kimi_get_agent_status

Get detailed status of a specific agent.

### kimi_get_pool_stats

Get statistics about the entire agent pool.

### kimi_list_agents

List all registered agents, optionally filtered by capability.

### kimi_cancel_task

Cancel a pending task that hasn't started yet.

### kimi_decompose_task

Decompose a complex task into subtasks for parallel execution.

## Configuration

```typescript
interface KimiOrchestratorConfig {
  maxAgents: number; // Maximum agents (default: 100)
  relayUrl: string; // WebSocket URL for relay
  redisUrl?: string; // Optional Redis URL
  heartbeatIntervalMs: number; // Health check interval (default: 30000)
  agentTimeoutMs: number; // Agent timeout (default: 120000)
  distributionStrategy: 'round-robin' | 'load-balanced' | 'capability-based';
  enableAutoRecovery: boolean; // Auto-recovery on failure (default: true)
  maxRetries: number; // Max task retries (default: 3)
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}
```

## Agent Capabilities

Agents can have the following capabilities:

- `code-generation` - Generate new code
- `code-review` - Review existing code
- `debugging` - Debug issues
- `architecture-design` - Design system architecture
- `documentation` - Create documentation
- `testing` - Write and run tests
- `refactoring` - Refactor existing code
- `analysis` - Analyze code or requirements
- `typescript`, `javascript`, `python` - Language-specific
- `react`, `nodejs` - Framework-specific
- `database`, `api-design` - Infrastructure
- `security-audit`, `performance-optimization` - Specialized

## Events

The orchestrator emits events for integration:

```typescript
orchestrator.on('agent:registered', ({ agent }) => {
  console.log(`Agent ${agent.id} registered`);
});

orchestrator.on('task:completed', ({ task, result }) => {
  console.log(`Task ${task.id} completed`);
});

orchestrator.on('agent:health-changed', ({ agentId, health }) => {
  console.log(`Agent ${agentId} health: ${health.status}`);
});
```

## Health Monitoring

The health monitor provides:

- Periodic health checks (configurable interval)
- Automatic agent recovery on transient failures
- Health status tracking (healthy, degraded, unhealthy, offline)
- Response time monitoring
- Error rate tracking

```typescript
// Get health summary
const summary = orchestrator.getHealthSummary();
console.log(`${summary.healthy} healthy, ${summary.unhealthy} unhealthy`);
```

## Testing

```bash
# Run tests
pnpm test

# Run with coverage
pnpm test:coverage
```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Watch mode
pnpm dev

# Type check
pnpm type-check

# Lint
pnpm lint

# Format
pnpm format
```

## Integration with TNF

The orchestrator integrates seamlessly with The New Fuse relay server:

```typescript
// Connect to relay
const orchestrator = new KimiOrchestrator({
  relayUrl: 'ws://localhost:3000/ws',
});

// Agents register via relay
// Tasks are distributed automatically
// Heartbeats keep agents alive
```

## License

MIT

## Contributing

Contributions are welcome! Please see the main TNF repository for contribution
guidelines.

## Support

For issues and feature requests, please use the GitHub issue tracker in the main
TNF repository.
