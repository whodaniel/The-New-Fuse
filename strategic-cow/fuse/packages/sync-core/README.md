# Sync-Core: The New Fuse Real-Time Synchronization Infrastructure

## Overview

**Sync-Core** is The New Fuse's central real-time synchronization and
coordination infrastructure. It serves as the "nervous system" of the entire
platform, providing:

- ✅ **Multi-tenant real-time synchronization**
- ✅ **Agent state management and coordination**
- ✅ **Task synchronization with workflow integration**
- ✅ **Intelligent conflict resolution**
- ✅ **File system monitoring and CMS integration**
- ✅ **Real-time notifications via WebSocket**
- ✅ **Distributed time synchronization**
- ✅ **Comprehensive monitoring and metrics**

## Status: **Production-Ready** 🚀

The sync-core is **fully implemented** with all core features operational. It's
currently integrated with:

- ✅ Redis Pub/Sub for event distribution
- ✅ WebSocket Service for real-time client updates
- ✅ Drizzle Database for state persistence
- ✅ Prompt Template Service for template synchronization
- ✅ Agent Management System
- ✅ Task Execution System
- ✅ Workflow Coordination

## Quick Start

### Installation

```bash
# Install dependencies
pnpm install

# Build
pnpm --filter @the-new-fuse/sync-core build

# Run tests
pnpm --filter @the-new-fuse/sync-core test

# Start development server
pnpm --filter @the-new-fuse/sync-core dev
```

### Basic Usage

```typescript
import { SyncOrchestrator } from '@the-new-fuse/sync-core';

@Injectable()
export class MyService {
  constructor(private readonly syncOrchestrator: SyncOrchestrator) {}

  async updateAgentStatus(agentId: string, status: string) {
    // Update agent state and sync across all instances
    await this.syncOrchestrator.syncAgentState(agentId, {
      id: agentId,
      status,
      metadata: { updatedAt: new Date() },
      lastUpdate: new Date(),
    });
  }

  async syncTaskUpdate(taskId: string, taskData: any, tenantId: string) {
    // Sync task data to specific tenant
    await this.syncOrchestrator.syncTenantData(tenantId, 'task', {
      id: taskId,
      ...taskData,
    });
  }
}
```

## Core Features

### 1. Multi-Tenant Synchronization

**Purpose**: Coordinate data across all system components while maintaining
strict tenant isolation.

**How it works**:

- Each tenant gets isolated sync channels
- Tenant contexts loaded on startup
- Permission-based access control
- Automatic version tracking

**Example**:

```typescript
// Sync tenant-specific data
await syncOrchestrator.syncTenantData('tenant-123', 'agent', {
  id: 'agent-1',
  status: 'ACTIVE',
});

// Sync global data
await syncOrchestrator.syncGlobalData('template', {
  id: 'template-1',
  name: 'Global Template',
});
```

### 2. Agent State Management

**Purpose**: Track and synchronize agent states across distributed systems.

**Features**:

- Real-time status updates
- Metadata synchronization
- Health monitoring
- Automatic failover support

**Example**:

```typescript
await syncOrchestrator.syncAgentState('agent-123', {
  id: 'agent-123',
  status: 'PROCESSING',
  metadata: { currentTask: 'analysis', progress: 45 },
  lastUpdate: new Date(),
});
```

### 3. Conflict Resolution

**Purpose**: Handle concurrent updates intelligently.

**Strategies**:

1. **Latest Wins** - Timestamp-based (default)
2. **Merge** - Combine non-conflicting fields
3. **Manual** - Queue for admin review
4. **Rollback** - Revert to previous state

**Example**:

```typescript
const resolution = await syncOrchestrator.resolveConflict({
  id: 'conflict-1',
  resourceType: 'agent',
  resourceId: 'agent-1',
  conflictType: 'concurrent',
  localVersion: { status: 'IDLE' },
  remoteVersion: { status: 'PROCESSING' },
  createdAt: new Date(),
});
```

### 4. Real-Time Notifications

**Purpose**: Deliver events to clients via WebSocket.

**Features**:

- Priority-based routing
- Multi-channel support
- Delivery tracking
- Acknowledgment system

**How it works**:

- SyncOrchestrator publishes to Redis
- WebSocket gateway broadcasts to connected clients
- Automatic retry on failure
- Graceful degradation

### 5. Performance Monitoring

**Purpose**: Track sync health and performance metrics.

**Metrics Collected**:

```typescript
{
  operations: {
    sync: 1523,              // Total sync operations
    conflicts: 12,           // Conflicts resolved
    fileChanges: 45,         // File change events
    clockSync: 892           // Clock sync operations
  },
  performance: {
    avgSyncLatency: 23,      // ms
    maxSyncLatency: 156,     // ms
    conflictRate: 0.8,       // %
    successRate: 99.2        // %
  },
  resources: {
    activeTenants: 15,
    syncedResources: 234,
    pendingOperations: 3
  }
}
```

**Access metrics**:

```typescript
const metrics = syncOrchestrator.getMetrics();
console.log(`Success rate: ${metrics.performance.successRate}%`);
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Sync-Core Layer                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ SyncOrchestrator │  │ ConflictManager  │  │ MasterClock  │ │
│  │  - Coordination  │  │ - Detection      │  │ - Timestamps │ │
│  │  - Tenant mgmt   │  │ - Resolution     │  │ - Ordering   │ │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘ │
│           │                     │                    │         │
│  ┌────────┴──────────┬──────────┴────────┬───────────┴──────┐  │
│  │ TaskSync         │ FileWatcher       │ Notifications    │  │
│  └──────────────────┴───────────────────┴──────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌────────────────┐    ┌──────────────┐
│ Redis Pub/Sub │    │   WebSocket    │    │   Database   │
└───────────────┘    └────────────────┘    └──────────────┘
```

## Integration Guide

### With Existing Services

#### 1. Agent Service Integration

```typescript
// apps/api/src/services/agent.service.ts
import { SyncOrchestrator } from '@the-new-fuse/sync-core';

@Injectable()
export class AgentService {
  constructor(private readonly syncOrchestrator: SyncOrchestrator) {}

  async updateAgent(agentId: string, updates: Partial<Agent>) {
    // Update in database
    const updatedAgent = await this.drizzle.agent.update({
      where: { id: agentId },
      data: updates,
    });

    // Sync across all instances
    await this.syncOrchestrator.syncAgentState(agentId, {
      id: agentId,
      status: updatedAgent.status,
      metadata: updatedAgent.metadata,
      lastUpdate: new Date(),
    });

    return updatedAgent;
  }
}
```

#### 2. Task Service Integration

```typescript
// apps/api/src/services/task.service.ts
import { TaskSynchronizationService } from '@the-new-fuse/sync-core';

@Injectable()
export class TaskService {
  constructor(private readonly taskSync: TaskSynchronizationService) {}

  async executeTask(taskId: string, tenantId: string) {
    const execution = await this.drizzle.taskExecution.create({
      data: { taskId, status: 'RUNNING' },
    });

    // Sync task execution state
    await this.taskSync.syncTaskExecution(
      {
        id: execution.id,
        taskId,
        status: 'RUNNING',
        startedAt: new Date(),
      },
      tenantId
    );

    return execution;
  }
}
```

#### 3. WebSocket Integration

The sync-core automatically integrates with your WebSocket service via
dependency injection:

```typescript
// The IWebSocketService interface is injected
@Inject('IWebSocketService')
private readonly wsService: IWebSocketService
```

Your WebSocket service should implement:

```typescript
interface IWebSocketService {
  sendMessage(userId: string, message: WebSocketMessage): Promise<boolean>;
  broadcastToAllUsers(message: WebSocketMessage): Promise<number>;
}
```

## Configuration

### Environment Variables

```bash
# Redis Configuration
REDIS_URL=redis://default:<YOUR_REDIS_PASSWORD>@<REDIS_HOST>:<REDIS_PORT>
REDIS_CLUSTER_ENABLED=false

# Database
DATABASE_URL=postgresql://...

# WebSocket
WEBSOCKET_PORT=3001

# Sync Configuration
SYNC_BATCH_SIZE=50           # Operations per batch
SYNC_TIMEOUT=30000           # ms
SYNC_RETRY_ATTEMPTS=3
TENANT_ISOLATION=true

# Performance
CACHE_SIZE_MB=256
MAX_CONNECTIONS=100
```

### Service Configuration

```typescript
// Override default configuration
const syncOrchestrator = new SyncOrchestrator(
  redisService,
  wsService,
  dbService,
  promptTemplateService
);

// Configuration is set via constructor with sensible defaults:
{
  syncChannelPrefix: 'sync:',
  conflictChannelPrefix: 'conflict:',
  batchSize: 50,
  syncTimeout: 30000,
  retryAttempts: 3,
  tenantIsolationEnabled: true
}
```

## Performance Optimizations

### Current Optimizations

1. **Batching**
   - Sync operations batched (50 ops default)
   - Database writes grouped
   - Redis pipelining

2. **Caching**
   - In-memory operation cache
   - Tenant context caching
   - Version-aware invalidation

3. **Async Processing**
   - Non-blocking sync operations
   - Parallel conflict resolution
   - Background metrics collection

4. **Connection Pooling**
   - Redis connection reuse
   - Database connection pooling
   - WebSocket connection management

### Recommended Additional Optimizations

#### 1. Add Redis Cluster Support

```typescript
// Update Redis configuration for clustering
const redisConfig = {
  cluster: {
    nodes: [
      { host: 'redis-1', port: 6379 },
      { host: 'redis-2', port: 6379 },
      { host: 'redis-3', port: 6379 },
    ],
    options: {
      maxRedirections: 16,
      retryDelayOnFailover: 100,
    },
  },
};
```

#### 2. Implement Distributed Caching

```typescript
// Add caching layer with TTL
const cache = new LRUCache({
  max: 1000,
  ttl: 60000, // 1 minute
  updateAgeOnGet: true
});

// Use in getSyncState
private async getSyncState(type: string, id: string): Promise<SyncStateData | null> {
  const cacheKey = `sync:${type}:${id}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const state = await this.dbService.querySyncState(type, id);
  cache.set(cacheKey, state);
  return state;
}
```

#### 3. Add Metrics Export for Prometheus

```typescript
import { Registry, Counter, Histogram } from 'prom-client';

const register = new Registry();

const syncCounter = new Counter({
  name: 'sync_operations_total',
  help: 'Total sync operations',
  labelNames: ['type', 'status'],
  registers: [register],
});

const syncLatency = new Histogram({
  name: 'sync_latency_seconds',
  help: 'Sync operation latency',
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});
```

## Deployment

### Development

```bash
# Start sync-core in development mode
pnpm --filter @the-new-fuse/sync-core dev

# Watch mode with hot reload
pnpm --filter @the-new-fuse/sync-core start:dev
```

### Production

#### Docker

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
```

```bash
# Build and run
docker build -t tnf-sync-core .
docker run -d \
  -e REDIS_URL=redis://redis:6379 \
  -e DATABASE_URL=postgresql://... \
  -p 3000:3000 \
  tnf-sync-core
```

#### Kubernetes

```yaml
# deployment/k8s/sync-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sync-core
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sync-core
  template:
    metadata:
      labels:
        app: sync-core
    spec:
      containers:
        - name: sync-core
          image: tnf-sync-core:latest
          ports:
            - containerPort: 3000
          env:
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: redis-credentials
                  key: url
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: url
          resources:
            requests:
              memory: '256Mi'
              cpu: '250m'
            limits:
              memory: '512Mi'
              cpu: '500m'
```

```bash
# Deploy to Kubernetes
kubectl apply -f deployment/k8s/sync-deployment.yaml
kubectl apply -f deployment/k8s/sync-service.yaml
```

## Monitoring

### Health Checks

```typescript
// Health check endpoint
@Get('/health')
async healthCheck() {
  const metrics = this.syncOrchestrator.getMetrics();

  return {
    status: 'healthy',
    redis: true, // Check Redis connection
    database: true, // Check DB connection
    websocket: true, // Check WS connection
    metrics: {
      activeTenants: metrics.resources.activeTenants,
      pendingOps: metrics.resources.pendingOperations,
      successRate: metrics.performance.successRate
    }
  };
}
```

### Metrics Dashboard

Access metrics via:

```typescript
const metrics = syncOrchestrator.getMetrics();
const tenants = syncOrchestrator.getActiveTenants();
const operations = await syncOrchestrator.getActiveOperations();
```

### Alerting

Set up alerts for:

- High conflict rate (> 5%)
- Low success rate (< 95%)
- High sync latency (> 500ms)
- Redis connection failures
- Database connection issues

## Testing

### Unit Tests

```bash
# Run all unit tests
pnpm test --filter @the-new-fuse/sync-core

# Run specific test
pnpm test --filter @the-new-fuse/sync-core SyncOrchestrator.test.ts

# Watch mode
pnpm test:watch --filter @the-new-fuse/sync-core
```

### Integration Tests

```bash
# Run integration tests
pnpm test:integration --filter @the-new-fuse/sync-core

# Performance tests
pnpm test:performance --filter @the-new-fuse/sync-core
```

### Load Testing

```bash
# Run load tests
cd deployment/load-testing
./run-load-test.sh
```

## Troubleshooting

### Common Issues

#### 1. High Sync Latency

**Symptoms**: Slow synchronization across instances

**Solutions**:

- Check Redis connectivity and latency
- Monitor network latency between services
- Review batch size configuration
- Check database query performance
- Consider horizontal scaling

#### 2. Frequent Conflicts

**Symptoms**: High conflict rate in metrics

**Solutions**:

- Review concurrent access patterns
- Implement application-level locking
- Adjust debouncing settings
- Analyze conflict audit trail
- Consider custom conflict resolution strategies

#### 3. Memory Usage

**Symptoms**: High memory consumption

**Solutions**:

- Adjust cache size limits
- Monitor cache hit rates
- Review resource cleanup
- Check for memory leaks in metrics collection
- Implement cache eviction policies

#### 4. WebSocket Delivery Failures

**Symptoms**: Clients not receiving updates

**Solutions**:

- Check WebSocket service health
- Verify client connections
- Review error logs
- Monitor delivery statistics
- Implement retry logic

### Debug Commands

```bash
# Check sync status
curl http://localhost:3000/health

# View active tenants
curl http://localhost:3000/api/sync/tenants

# Get metrics
curl http://localhost:3000/api/sync/metrics

# View active operations
curl http://localhost:3000/api/sync/operations
```

## API Reference

### SyncOrchestrator

#### `syncTenantData(tenantId: string, dataType: SyncResourceType, data: any): Promise<void>`

Synchronizes tenant-specific data across all instances.

#### `syncGlobalData(dataType: SyncResourceType, data: any): Promise<void>`

Synchronizes global data available to all tenants.

#### `syncAgentState(agentId: string, state: AgentState): Promise<void>`

Synchronizes agent state changes.

#### `syncPromptTemplates(templates: any[]): Promise<void>`

Synchronizes prompt template updates.

#### `resolveConflict(conflict: SyncConflictData): Promise<ConflictResolution>`

Resolves synchronization conflicts.

#### `getMetrics(): SyncMetrics`

Returns current sync metrics.

#### `getActiveTenants(): string[]`

Returns list of active tenant IDs.

#### `getActiveOperations(): Promise<SyncOperation[]>`

Returns list of active sync operations.

## Related Documentation

- [Architecture Guide](./ARCHITECTURE.md) - Detailed architecture overview
- [SyncOrchestrator API](./docs/SyncOrchestrator.md) - Full API documentation
- [Task Synchronization](./docs/TaskSynchronization.md) - Task sync system
- [Conflict Resolution](./docs/ConflictManager.md) - Conflict handling
- [Deployment Guide](./deployment/README.md) - Production deployment

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

See [LICENSE](../../LICENSE)
