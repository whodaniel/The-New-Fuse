# Sync-Core Architecture

## Purpose

**Sync-Core** is the central real-time synchronization and coordination
infrastructure for The New Fuse platform. It serves as the "nervous system"
connecting all components with real-time state synchronization, conflict
resolution, and event distribution.

## Core Responsibilities

### 1. **Multi-Tenant Real-Time Synchronization**

- Coordinate data across all system components
- Strict tenant isolation and data boundaries
- Global data distribution for system-wide resources
- Version tracking and checksum validation

### 2. **Agent State Management**

- Track agent status across distributed systems
- Synchronize agent configurations and metadata
- Real-time agent health monitoring
- Agent task assignment and load balancing

### 3. **Task Synchronization**

- Real-time task status updates
- Task execution tracking and progress
- Dependency management and workflow coordination
- Distributed task queue management

### 4. **Conflict Resolution**

- Detect concurrent modification conflicts
- Intelligent resolution strategies (latest-wins, merge, manual)
- Audit trail for all resolutions
- Rollback capabilities

### 5. **File System Monitoring**

- Watch configuration and data files
- Trigger synchronization on file changes
- CMS integration for content updates
- Project configuration synchronization

### 6. **Real-Time Notifications**

- WebSocket-based event delivery
- Multi-channel notification support
- Priority-based message routing
- Delivery tracking and acknowledgment

### 7. **Distributed Time Synchronization**

- Logical clock for distributed ordering
- Event timestamp coordination
- Causality tracking across services

### 8. **Performance Monitoring**

- Comprehensive metrics collection
- Health checks and alerting
- Performance optimization insights
- Resource utilization tracking

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Sync-Core Layer                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ SyncOrchestrator │  │ ConflictManager  │  │ MasterClock  │ │
│  │  - Coordination  │  │ - Detection      │  │ - Timestamps │ │
│  │  - Tenant mgmt   │  │ - Resolution     │  │ - Ordering   │ │
│  │  - Global sync   │  │ - Audit trail    │  │ - Causality  │ │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘ │
│           │                     │                    │         │
│  ┌────────┴──────────┬──────────┴────────┬───────────┴──────┐  │
│  │                   │                   │                  │  │
│  │ TaskSync         │ FileWatcher       │ Notifications    │  │
│  │ - Execution      │ - CMS sync        │ - WebSocket      │  │
│  │ - Dependencies   │ - Config watch    │ - Multi-channel  │  │
│  │ - Workflows      │ - Auto-reload     │ - Priority queue │  │
│  │                  │                   │                  │  │
│  └──────────────────┴───────────────────┴──────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌────────────────┐    ┌──────────────┐
│ Redis Pub/Sub │    │   WebSocket    │    │   Database   │
│ - Channels    │    │   - Real-time  │    │   - Drizzle   │
│ - Clustering  │    │   - Events     │    │   - Sync log │
│ - TTL keys    │    │   - Broadcast  │    │   - Conflicts│
└───────────────┘    └────────────────┘    └──────────────┘
```

## Component Details

### SyncOrchestrator

**Role**: Central coordinator for all synchronization operations

**Responsibilities**:

- Tenant-aware data synchronization
- Global resource distribution
- Agent state coordination
- Prompt template synchronization
- Event routing and broadcasting

**Key Features**:

- Batching for performance
- Retry logic with exponential backoff
- Graceful degradation
- Horizontal scaling support

### ConflictManager

**Role**: Intelligent conflict detection and resolution

**Responsibilities**:

- Detect concurrent modifications
- Apply resolution strategies
- Maintain conflict audit trail
- Support manual resolution workflows

**Resolution Strategies**:

1. **Latest Wins** - Timestamp-based (default)
2. **Merge** - Combine non-conflicting fields
3. **Manual** - Queue for admin review
4. **Rollback** - Revert to previous state

### MasterClockService

**Role**: Distributed logical clock for event ordering

**Responsibilities**:

- Generate monotonic timestamps
- Maintain causality relationships
- Coordinate event ordering across nodes
- Provide clock synchronization API

**Implementation**: Hybrid Logical Clock (HLC) algorithm

### TaskSynchronizationService

**Role**: Real-time task coordination and execution tracking

**Responsibilities**:

- Task state synchronization
- Execution progress updates
- Dependency management
- Workflow integration

**Features**:

- Real-time progress tracking
- Automatic dependency resolution
- Distributed task queues
- Performance metrics

### EnhancedFileSystemWatcher

**Role**: Monitor configuration and data files for changes

**Responsibilities**:

- Watch file system for changes
- Trigger synchronization on updates
- CMS integration
- Configuration reload

**Features**:

- Debouncing for rapid changes
- Tenant-specific watch paths
- Selective file filtering
- Error recovery

### NotificationService

**Role**: Real-time event delivery to clients

**Responsibilities**:

- WebSocket message delivery
- Multi-channel support (email, push, webhook)
- Priority-based routing
- Delivery tracking

**Features**:

- Notification rules engine
- Template support
- Batch delivery
- Acknowledgment tracking

## Data Flow

### 1. Sync Operation Flow

```
Client/Service
    │
    ▼
[State Change]
    │
    ▼
SyncOrchestrator
    ├─► [Tenant Validation]
    ├─► [Version Check]
    ├─► [Conflict Detection] ──► ConflictManager
    │
    ▼
[Update Database]
    │
    ▼
[Publish to Redis]
    │
    ▼
WebSocket Gateway
    │
    ▼
Connected Clients
```

### 2. Conflict Resolution Flow

```
[Concurrent Updates Detected]
    │
    ▼
ConflictManager.detectConflict()
    │
    ▼
[Apply Resolution Strategy]
    ├─► Latest Wins → Use most recent
    ├─► Merge → Combine changes
    ├─► Manual → Queue for review
    └─► Rollback → Revert
    │
    ▼
[Log to Audit Trail]
    │
    ▼
[Broadcast Resolution]
```

### 3. Task Synchronization Flow

```
[Task Created/Updated]
    │
    ▼
TaskSyncService
    ├─► [Check Dependencies]
    ├─► [Update State]
    └─► [Sync to Orchestrator]
    │
    ▼
[Notify Watchers]
    │
    ▼
[Update UI/Dashboard]
```

## Database Schema

### Sync State Tracking

```drizzle
model SyncState {
  id           String   @id @default(uuid())
  resourceType String
  resourceId   String
  tenantId     String?
  version      Int      @default(1)
  checksum     String
  lastSync     DateTime @default(now())
  syncedBy     String
  metadata     Json?

  @@unique([resourceType, resourceId, tenantId])
  @@map("sync_states")
}

model SyncConflict {
  id            String   @id @default(uuid())
  resourceType  String
  resourceId    String
  tenantId      String?
  conflictType  String
  localVersion  Json
  remoteVersion Json
  resolvedAt    DateTime?
  resolvedBy    String?
  resolution    Json?
  createdAt     DateTime @default(now())

  @@map("sync_conflicts")
}

model SyncMetrics {
  id          String   @id @default(uuid())
  timestamp   DateTime @default(now())
  metricType  String
  value       Float
  tenantId    String?
  metadata    Json?

  @@index([timestamp, metricType])
  @@map("sync_metrics")
}
```

## Redis Data Structures

### Channels

```
# Sync channels (pub/sub)
sync:{tenantId}:{resourceType}         # Tenant-specific sync events
sync:global:{resourceType}             # Global sync events
conflict:{tenantId}                    # Conflict notifications
task_sync:{tenantId}                   # Task updates
notification:{userId}                  # User notifications

# Keys (with TTL)
sync:state:{resourceType}:{resourceId} # Cached state
sync:lock:{resourceType}:{resourceId}  # Distributed locks
clock:vector:{nodeId}                  # Vector clock state
metrics:buffer:{timestamp}             # Metrics buffer
```

## Performance Optimizations

### 1. Batching

- Sync operations batched (default: 50 ops)
- Notifications batched (default: 100 msgs)
- Database writes grouped
- Redis pipelining for bulk ops

### 2. Caching

- In-memory state cache (LRU)
- Redis caching layer
- Version-aware cache invalidation
- Tenant-specific cache isolation

### 3. Debouncing

- File change events debounced (500ms)
- Rapid state updates coalesced
- Notification throttling by priority

### 4. Connection Pooling

- Redis connection pooling
- Database connection reuse
- WebSocket connection management

### 5. Horizontal Scaling

- Stateless service design
- Redis-based coordination
- Load balancing support
- Multi-instance deployments

## Security

### Tenant Isolation

- Database-level separation
- Redis keyspace prefixes
- WebSocket room isolation
- Access control validation

### Data Protection

- Encryption in transit (TLS)
- Encryption at rest (AES-256)
- Audit logging (all operations)
- Compliance tracking

### Access Control

- RBAC integration
- Permission validation
- API key authentication
- Rate limiting

## Monitoring

### Metrics

```typescript
interface SyncMetrics {
  operations: {
    sync: number; // Total sync operations
    conflicts: number; // Conflicts resolved
    fileChanges: number; // File change events
    notifications: number; // Notifications sent
  };

  performance: {
    avgSyncLatency: number; // ms
    maxSyncLatency: number; // ms
    conflictRate: number; // percentage
    successRate: number; // percentage
  };

  resources: {
    activeTenants: number;
    syncedResources: number;
    pendingOperations: number;
    cacheHitRate: number; // percentage
  };

  health: {
    redisConnected: boolean;
    databaseConnected: boolean;
    websocketConnected: boolean;
    clockSynced: boolean;
  };
}
```

### Health Checks

- Redis connectivity
- Database connectivity
- WebSocket gateway health
- Clock drift monitoring
- Memory usage
- CPU utilization

### Alerting

- High conflict rate
- Sync failures
- Clock drift detected
- Resource exhaustion
- Performance degradation

## Deployment

### Development

```bash
pnpm --filter @the-new-fuse/sync-core dev
```

### Production

```bash
# Docker
docker build -t tnf-sync-core .
docker run -d --name sync-core tnf-sync-core

# Kubernetes
kubectl apply -f deployment/k8s/
```

### Environment Variables

```bash
# Redis
REDIS_URL=redis://default:mDNmtwseaVHcQsCHaIoZapjlWrvAjtot@tramway.proxy.rlwy.net:13570
REDIS_CLUSTER_ENABLED=false

# Database
DATABASE_URL=postgresql://...

# WebSocket
WEBSOCKET_PORT=3001

# Sync Configuration
SYNC_BATCH_SIZE=50
SYNC_TIMEOUT=30000
CONFLICT_STRATEGY=latest_wins
TENANT_ISOLATION=true

# Performance
CACHE_SIZE_MB=256
MAX_CONNECTIONS=100
```

## Integration Guide

### Basic Usage

```typescript
import { SyncOrchestrator } from '@the-new-fuse/sync-core';

@Injectable()
export class MyService {
  constructor(private readonly syncOrchestrator: SyncOrchestrator) {}

  async updateData(data: any, tenantId: string) {
    // Update database
    await this.database.update(data);

    // Sync across all instances
    await this.syncOrchestrator.syncTenantData(tenantId, 'myResource', data);
  }
}
```

### Advanced Usage

```typescript
// Custom conflict resolution
await syncOrchestrator.registerConflictResolver(
  'myResource',
  async (local, remote) => {
    // Custom merge logic
    return { ...local, ...remote, merged: true };
  }
);

// File watching
await fileWatcher.watchPath('/config', (event) => {
  console.log('File changed:', event.path);
  await syncOrchestrator.syncGlobalData('config', event.data);
});

// Task synchronization
await taskSync.syncTaskData(
  {
    id: 'task-123',
    status: 'RUNNING',
    progress: 50,
  },
  'tenant-abc'
);
```

## Testing

### Unit Tests

```bash
pnpm test --filter @the-new-fuse/sync-core
```

### Integration Tests

```bash
pnpm test:integration --filter @the-new-fuse/sync-core
```

### Performance Tests

```bash
pnpm test:performance --filter @the-new-fuse/sync-core
```

## Troubleshooting

### High Sync Latency

- Check Redis connectivity
- Monitor network latency
- Review batch sizes
- Check database performance

### Frequent Conflicts

- Review concurrent access patterns
- Adjust debouncing settings
- Consider application-level locking
- Analyze conflict audit trail

### Memory Issues

- Adjust cache size limits
- Monitor cache hit rates
- Review resource cleanup
- Check for memory leaks

## Future Enhancements

1. **ML-Based Conflict Resolution** - Smart conflict prediction
2. **Multi-Region Sync** - Cross-region replication
3. **Event Sourcing** - Complete audit trail
4. **Enhanced Analytics** - Real-time dashboards
5. **Auto-Scaling** - Dynamic resource adjustment

## Related Documentation

- [SyncOrchestrator API](./docs/SyncOrchestrator.md)
- [Task Synchronization](./docs/TaskSynchronization.md)
- [Conflict Resolution](./docs/ConflictManager.md)
- [Deployment Guide](./docs/deployment/README.md)
