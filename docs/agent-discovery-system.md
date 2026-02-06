# Agent Discovery System

A comprehensive live agent discovery system with dynamic capability
registration, semantic search, and real-time health monitoring.

## Overview

The Agent Discovery System enables dynamic discovery and querying of distributed
agents in the FUSE platform. Agents can register their capabilities, send
heartbeats, and be discovered by clients based on various criteria including
semantic search, resource usage, and performance metrics.

## Architecture

### Components

1. **AgentDiscoveryRegistry** - Redis-based registry for agent management
2. **CapabilityMatcher** - Semantic search and fuzzy matching for capabilities
3. **Discovery API** - REST endpoints for registration and querying
4. **Agent Browser UI** - Real-time frontend for browsing agents
5. **Example Agents** - Reference implementations

### Key Features

- **Live Agent Registration** - Agents announce their presence and capabilities
- **Automatic Heartbeats** - Heartbeat every 30 seconds with health metrics
- **Auto-Deregistration** - Agents removed after 60s without heartbeat
- **Semantic Search** - Find agents using natural language queries
- **Capability Matching** - Fuzzy matching and relevance scoring
- **Load Balancing** - Automatic recommendations based on load and performance
- **Capability Composition** - Chain multiple agents for complex workflows
- **Real-time Updates** - Pub/sub for live agent status changes

## Getting Started

### Prerequisites

- Redis server running on localhost:6379 (or configure with environment
  variables)
- Node.js 16+
- TypeScript 4.5+

### Installation

```bash
# Install dependencies
npm install

# Start Redis (if not already running)
docker run -d -p 6379:6379 redis:latest

# Build the discovery system
npm run build
```

### Environment Variables

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password  # Optional
```

## Usage

### 1. Agent Registration

Agents register themselves with the discovery system on startup:

```typescript
import { AgentRegistration } from '@fuse/api/types/agent-discovery.types';
import axios from 'axios';

const registration: AgentRegistration = {
  agentId: 'code-reviewer-01',
  name: 'Code Review Agent',
  description: 'Expert code reviewer for multiple languages',
  type: 'code-analysis',
  groups: ['code-quality', 'security'],
  version: '1.2.0',
  capabilities: [
    {
      name: 'code-review',
      version: '1.2.0',
      description: 'Comprehensive code review with best practices',
      languages: ['python', 'typescript', 'javascript'],
      confidence: 0.95,
      pricing: {
        perInvocation: 0.01,
        currency: 'USD',
      },
    },
  ],
};

await axios.post(
  'http://localhost:3000/api/agents/discovery/register',
  registration
);
```

### 2. Sending Heartbeats

Agents send periodic heartbeats with current metrics:

```typescript
import {
  AgentHeartbeat,
  AgentStatus,
} from '@fuse/api/types/agent-discovery.types';

const heartbeat: AgentHeartbeat = {
  agentId: 'code-reviewer-01',
  timestamp: new Date(),
  status: AgentStatus.ONLINE,
  metrics: {
    isHealthy: true,
    uptime: 3600,
    successRate: 0.95,
    avgResponseTime: 1200,
    cpuUsage: 25.5,
    memoryUsage: 40.2,
    activeTasks: 2,
    totalTasks: 100,
    failedTasks: 5,
  },
};

// Send heartbeat every 30 seconds
setInterval(async () => {
  await axios.post(
    'http://localhost:3000/api/agents/discovery/heartbeat',
    heartbeat
  );
}, 30000);
```

### 3. Discovering Agents

Query agents based on various criteria:

#### Example: Find Python Code Reviewers

```typescript
import { DiscoveryQuery } from '@fuse/api/types/agent-discovery.types';

const query: DiscoveryQuery = {
  capability: 'code-review',
  languages: ['python'],
  minConfidence: 0.8,
  status: [AgentStatus.ONLINE, AgentStatus.IDLE],
  sortBy: 'successRate',
  limit: 5,
};

const response = await axios.post(
  'http://localhost:3000/api/agents/discover',
  query
);
console.log(response.data.agents);
```

#### Example: Find Agents with Low CPU Usage

```typescript
const query: DiscoveryQuery = {
  maxCpuUsage: 20,
  status: [AgentStatus.ONLINE],
  sortBy: 'load',
};

const response = await axios.post(
  'http://localhost:3000/api/agents/discover',
  query
);
```

#### Example: Semantic Search

```typescript
const response = await axios.post(
  'http://localhost:3000/api/agents/discovery/match',
  {
    query: 'analyze statistical data',
    minScore: 0.5,
    maxResults: 5,
    preferLowLoad: true,
  }
);

console.log(response.data.matches);
```

### 4. Capability Composition

Chain multiple agents for complex workflows:

```typescript
const response = await axios.post(
  'http://localhost:3000/api/agents/discovery/compose',
  {
    capabilities: [
      'data-cleaning',
      'statistical-analysis',
      'data-visualization',
    ],
    maxChainLength: 5,
    preferReliable: true,
    maxCost: 0.5,
  }
);

console.log(response.data.compositions);
```

## API Endpoints

### Registration & Heartbeat

| Endpoint                           | Method | Description                 |
| ---------------------------------- | ------ | --------------------------- |
| `/api/agents/discovery/register`   | POST   | Register or update an agent |
| `/api/agents/discovery/heartbeat`  | POST   | Send agent heartbeat        |
| `/api/agents/discovery/deregister` | POST   | Deregister an agent         |

### Discovery & Querying

| Endpoint                               | Method | Description                  |
| -------------------------------------- | ------ | ---------------------------- |
| `/api/agents/discover`                 | POST   | Discover agents with query   |
| `/api/agents/discovery`                | GET    | Get all registered agents    |
| `/api/agents/discovery/:agentId`       | GET    | Get specific agent details   |
| `/api/agents/discovery/match`          | POST   | Semantic capability matching |
| `/api/agents/discovery/compose`        | POST   | Compose capability chains    |
| `/api/agents/discovery/query/advanced` | POST   | Advanced query with filters  |
| `/api/agents/discovery/system/health`  | GET    | System health status         |

## Query Parameters

### DiscoveryQuery

```typescript
interface DiscoveryQuery {
  // Capability search
  capability?: string; // Semantic search term

  // Filters
  languages?: string[]; // Required languages
  frameworks?: string[]; // Required frameworks
  groups?: string[]; // Agent groups
  types?: string[]; // Agent types
  status?: AgentStatus[]; // Agent status filter

  // Performance filters
  maxCpuUsage?: number; // Max CPU % (0-100)
  maxMemoryUsage?: number; // Max memory % (0-100)
  maxLoad?: number; // Max load (0-1)
  minConfidence?: number; // Min capability confidence (0-1)
  minSuccessRate?: number; // Min success rate (0-1)
  maxCost?: number; // Max cost per invocation

  // Search options
  semanticSearch?: boolean; // Enable semantic search
  sortBy?: 'relevance' | 'load' | 'successRate' | 'responseTime' | 'uptime';
  sortDirection?: 'asc' | 'desc';
  limit?: number; // Max results
}
```

## Example Agents

### Code Review Agent

Located at: `/examples/agent-discovery/code-review-agent.ts`

Features:

- Code review capability for Python, TypeScript, JavaScript
- Security scanning
- Refactoring suggestions
- Automatic heartbeat management
- Graceful shutdown

Run:

```bash
cd examples/agent-discovery
ts-node code-review-agent.ts
```

### Data Analysis Agent

Located at: `/examples/agent-discovery/data-analysis-agent.ts`

Features:

- Statistical analysis
- Data visualization
- Data cleaning
- Machine learning
- Report generation

Run:

```bash
cd examples/agent-discovery
ts-node data-analysis-agent.ts
```

### Discovery Client

Located at: `/examples/agent-discovery/discovery-client-example.ts`

Demonstrates all query types and discovery patterns.

Run:

```bash
cd examples/agent-discovery
ts-node discovery-client-example.ts
```

## Frontend Agent Browser

A real-time React component for browsing and monitoring agents.

Location: `/apps/frontend/src/components/AgentDiscovery/AgentBrowser.tsx`

Features:

- Live agent list with search
- Semantic capability search
- Advanced filtering (CPU, load, success rate)
- Real-time metrics display
- Detailed agent view with all capabilities
- Load balancing recommendations

Usage in React:

```tsx
import { AgentBrowser } from '@/components/AgentDiscovery/AgentBrowser';

function App() {
  return <AgentBrowser />;
}
```

## Load Balancing

The system automatically generates load balancing recommendations based on:

1. **Agent Load** - CPU, memory, and active task count
2. **Success Rate** - Historical task success percentage
3. **Response Time** - Average response time
4. **Health Status** - Overall agent health

Example recommendation:

```json
{
  "agentId": "code-reviewer-01",
  "score": 0.87,
  "reason": "Low load (23.0%), high success rate (95.0%)",
  "estimatedWaitTime": 1476
}
```

## Capability Composition

Chain multiple agents to create complex workflows:

```typescript
// Request: data-cleaning → statistical-analysis → data-visualization
const compositions = await composeCapabilities(
  ['data-cleaning', 'statistical-analysis', 'data-visualization'],
  agents
);

// Returns:
{
  composition: {
    name: "Composed: data-cleaning → statistical-analysis → data-visualization",
    agentChain: ['cleaner-01', 'analyzer-01', 'visualizer-01'],
    capabilities: ['data-cleaning', 'statistical-analysis', 'data-visualization'],
    totalCost: 0.09,
    estimatedTime: 5200
  },
  score: 0.85,
  reliability: 0.82
}
```

## Semantic Search

The capability matcher uses multiple algorithms for semantic search:

1. **Exact Matching** - Direct capability name matches (score: 1.0)
2. **Substring Matching** - Partial name matches (score: 0.7-0.8)
3. **Description Matching** - Matches in capability descriptions (score: 0.6)
4. **Token Overlap** - Individual word matching (score: 0.3-0.5)
5. **Language/Framework Boost** - Boosts scores for matching tech stack

Example queries:

- "review Python code" → finds code-review capability with Python support
- "analyze statistical data" → finds statistical-analysis capability
- "clean and prepare data" → finds data-cleaning capability

## Metrics & Monitoring

### Agent Health Metrics

```typescript
interface AgentHealthMetrics {
  isHealthy: boolean; // Overall health status
  uptime: number; // Uptime in seconds
  successRate: number; // Task success rate (0-1)
  avgResponseTime: number; // Avg response time in ms
  cpuUsage: number; // CPU usage % (0-100)
  memoryUsage: number; // Memory usage % (0-100)
  activeTasks: number; // Current active tasks
  totalTasks: number; // Total tasks completed
  failedTasks: number; // Total failed tasks
  lastError?: string; // Last error message
  lastErrorTime?: Date; // Last error timestamp
}
```

### System Health Endpoint

```bash
GET /api/agents/discovery/system/health
```

Returns:

```json
{
  "system": {
    "healthy": true,
    "timestamp": "2025-11-18T10:30:00.000Z"
  },
  "agents": {
    "total": 12,
    "online": 10,
    "healthy": 11,
    "avgLoad": 0.234,
    "avgSuccessRate": 0.932
  }
}
```

## Testing

Run integration tests:

```bash
npm test -- agent-discovery.test.ts
```

Tests cover:

- Agent registration and deregistration
- Heartbeat management
- Discovery queries with various filters
- Capability matching and semantic search
- Capability composition
- Load balancing recommendations

## Production Deployment

### Redis Configuration

For production, use Redis Cluster or Redis Sentinel:

```typescript
const registry = new AgentDiscoveryRegistry({
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
  },
  heartbeatInterval: 30000,
  heartbeatTimeout: 60000,
  enablePubSub: true,
});
```

### Scaling Considerations

1. **Redis Persistence** - Enable RDB or AOF for agent data persistence
2. **Pub/Sub** - Use separate Redis instance for pub/sub to avoid blocking
3. **Heartbeat Cleanup** - Runs every 30s, ensure Redis can handle the load
4. **Index Size** - Monitor capability index size, cleanup stale entries
5. **WebSocket Updates** - Consider using Socket.IO or SSE for real-time
   frontend updates

### Security

1. **Authentication** - Add authentication middleware to registration endpoints
2. **Rate Limiting** - Limit registration and heartbeat frequency
3. **Validation** - Validate all agent data before storage
4. **RBAC** - Implement role-based access control for discovery queries
5. **Encryption** - Use TLS for Redis connections in production

## Troubleshooting

### Agents Not Appearing

1. Check Redis connection: `redis-cli ping`
2. Verify agent registration was successful
3. Check heartbeat is being sent every 30s
4. Ensure no errors in agent logs

### Stale Agents

Agents are auto-removed after 60s without heartbeat. To manually clean:

```bash
# Via API
POST /api/agents/discovery/deregister
{ "agentId": "stale-agent-01" }
```

### Performance Issues

1. Monitor Redis memory usage
2. Check capability index size
3. Optimize query filters
4. Use pagination with `limit` parameter
5. Consider caching frequent queries

## Future Enhancements

- [ ] Vector embeddings for advanced semantic search
- [ ] Agent reputation scoring
- [ ] Historical performance analytics
- [ ] Capability dependency resolution
- [ ] Multi-region agent discovery
- [ ] Agent marketplace with ratings
- [ ] Cost optimization recommendations
- [ ] A/B testing for agent selection

## License

MIT

## Contributing

See CONTRIBUTING.md for guidelines.

## Support

For issues and questions:

- GitHub Issues: https://github.com/your-org/fuse/issues
- Discord: https://discord.gg/fuse
- Email: support@fuse.ai
