# SyncOrchestrator Service

The `SyncOrchestrator` is the central coordination service for multi-tenant synchronization in The New Fuse platform. It integrates with existing services including Redis, WebSocket, Drizzle database, and prompt templating to provide seamless real-time synchronization across all system components.

## Overview

The SyncOrchestrator manages synchronization operations across multiple tenants while maintaining strict data isolation and security. It handles:

- **Tenant-aware synchronization**: Ensures data is synchronized within tenant boundaries
- **Global data synchronization**: Manages system-wide data that needs to be available across all tenants
- **Agent state synchronization**: Real-time agent status and configuration updates
- **Prompt template synchronization**: Template versioning and distribution
- **Conflict resolution**: Automatic and manual conflict resolution strategies
- **Real-time notifications**: WebSocket-based updates to connected clients

## Architecture Integration

The SyncOrchestrator integrates with existing platform services:

```typescript
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Redis Pub/Sub │◄──►│ SyncOrchestrator │◄──►│ WebSocket Service│
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Drizzle Database │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │PromptTemplate   │
                       │    Service      │
                       └─────────────────┘
```

## Key Features

### 1. Multi-Tenant Data Synchronization

```typescript
// Sync tenant-specific data
await syncOrchestrator.syncTenantData(
  'tenant-123',
  'agent',
  { id: 'agent-1', status: 'ACTIVE', metadata: {...} }
);

// Sync global data available to all tenants
await syncOrchestrator.syncGlobalData(
  'template',
  { id: 'template-1', name: 'Global Template', content: '...' }
);
```

### 2. Agent State Synchronization

```typescript
const agentState: AgentState = {
  id: 'agent-123',
  status: 'PROCESSING',
  metadata: { currentTask: 'document-analysis', progress: 45 },
  lastUpdate: new Date()
};

await syncOrchestrator.syncAgentState('agent-123', agentState);
```

### 3. Prompt Template Synchronization

```typescript
const templates = [
  {
    id: 'template-1',
    name: 'Code Review Template',
    content: 'Review the following code...',
    variables: { code_content: '', context: '' }
  }
];

await syncOrchestrator.syncPromptTemplates(templates);
```

### 4. Conflict Resolution

The service automatically detects and resolves synchronization conflicts using various strategies:

- **Latest Wins**: Uses timestamp-based resolution
- **Merge**: Combines non-conflicting changes
- **Manual**: Queues complex conflicts for human intervention
- **Rollback**: Reverts to a previous known good state

```typescript
const conflict: SyncConflictData = {
  id: 'conflict-1',
  resourceType: 'agent',
  resourceId: 'agent-1',
  conflictType: 'concurrent',
  localVersion: { status: 'IDLE' },
  remoteVersion: { status: 'PROCESSING' },
  createdAt: new Date()
};

const resolution = await syncOrchestrator.resolveConflict(conflict);
```

## Configuration

The SyncOrchestrator uses the following configuration:

```typescript
interface SyncOrchestratorConfig {
  syncChannelPrefix: string;      // 'sync:' - Redis channel prefix
  conflictChannelPrefix: string;  // 'conflict:' - Conflict channel prefix
  batchSize: number;              // 50 - Max operations per batch
  syncTimeout: number;            // 30000ms - Operation timeout
  retryAttempts: number;          // 3 - Max retry attempts
  tenantIsolationEnabled: boolean; // true - Enable tenant isolation
}
```

## Database Schema

The service extends the existing Drizzle schema with sync tracking tables:

```sql
-- Sync state tracking
CREATE TABLE sync_states (
  id VARCHAR PRIMARY KEY,
  resource_type VARCHAR NOT NULL,
  resource_id VARCHAR NOT NULL,
  tenant_id VARCHAR,
  version INTEGER DEFAULT 1,
  checksum VARCHAR NOT NULL,
  last_sync TIMESTAMP DEFAULT NOW(),
  synced_by VARCHAR NOT NULL,
  metadata JSONB,
  UNIQUE(resource_type, resource_id, tenant_id)
);

-- Conflict tracking
CREATE TABLE sync_conflicts (
  id VARCHAR PRIMARY KEY,
  resource_type VARCHAR NOT NULL,
  resource_id VARCHAR NOT NULL,
  tenant_id VARCHAR,
  conflict_type VARCHAR NOT NULL,
  local_version JSONB NOT NULL,
  remote_version JSONB NOT NULL,
  resolved_at TIMESTAMP,
  resolved_by VARCHAR,
  resolution JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Monitoring and Metrics

The service provides comprehensive metrics for monitoring:

```typescript
interface SyncMetrics {
  operations: {
    sync: number;           // Total sync operations
    conflicts: number;      // Conflicts resolved
    fileChanges: number;    // File change events
    clockSync: number;      // Clock sync operations
  };
  performance: {
    avgSyncLatency: number; // Average sync latency (ms)
    maxSyncLatency: number; // Maximum sync latency (ms)
    conflictRate: number;   // Conflict rate percentage
    successRate: number;    // Success rate percentage
  };
  resources: {
    activeTenants: number;     // Active tenant count
    watchedFiles: number;      // Watched file count
    syncedResources: number;   // Synced resource count
    pendingOperations: number; // Pending operations
  };
}
```

### Monitoring API

```typescript
// Get current metrics
const metrics = syncOrchestrator.getMetrics();

// Get active tenants
const tenants = syncOrchestrator.getActiveTenants();

// Get active operations
const operations = await syncOrchestrator.getActiveOperations();

// Get tenant context
const context = await syncOrchestrator.getTenantContext('tenant-123');
```

## Error Handling

The service implements comprehensive error handling:

1. **Redis Connection Errors**: Automatic retry with exponential backoff
2. **Database Errors**: Transaction rollback and retry logic
3. **WebSocket Errors**: Graceful degradation without failing sync operations
4. **Conflict Resolution Errors**: Fallback to manual resolution queue

## Security and Isolation

### Tenant Isolation

- **Database Level**: Uses existing Drizzle tenant isolation patterns
- **Redis Keyspace**: Tenant-specific Redis key prefixes
- **WebSocket**: Tenant-aware message routing
- **Access Control**: Integration with existing RBAC system

### Data Protection

- **Encryption**: Sensitive data encrypted in transit and at rest
- **Audit Logging**: All sync operations logged for compliance
- **Permission Validation**: Tenant permissions checked before sync operations

## Performance Optimization

### Batching and Debouncing

- Operations are batched to reduce Redis and database load
- Debouncing prevents excessive sync operations for rapid changes
- Priority-based operation queuing

### Horizontal Scaling

- Redis-based coordination for multi-instance deployments
- Stateless design allows for easy horizontal scaling
- Load balancing across sync instances

## Usage Examples

### Basic Setup

```typescript
import { SyncOrchestrator } from '@the-new-fuse/sync-core';

@Injectable()
export class MyService {
  constructor(
    private readonly syncOrchestrator: SyncOrchestrator
  ) {}

  async updateUserData(userId: string, data: any) {
    // Update in database
    await this.updateDatabase(data);
    
    // Sync across all user sessions
    await this.syncOrchestrator.syncTenantData(userId, 'user', data);
  }
}
```

### Bulk Operations

```typescript
// Sync multiple resources efficiently
const agents = [
  { id: 'agent-1', status: 'ACTIVE' },
  { id: 'agent-2', status: 'IDLE' },
  { id: 'agent-3', status: 'PROCESSING' }
];

const syncPromises = agents.map(agent =>
  syncOrchestrator.syncTenantData('tenant-123', 'agent', agent)
);

await Promise.all(syncPromises);
```

### Error Handling with Retry

```typescript
async function syncWithRetry<T>(operation: () => Promise<T>): Promise<T> {
  const maxRetries = 3;
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }
  
  throw lastError;
}
```

## Testing

The service includes comprehensive tests covering:

- **Unit Tests**: Individual method functionality
- **Integration Tests**: Service interaction testing
- **Error Handling Tests**: Failure scenario coverage
- **Performance Tests**: Load and stress testing

Run tests with:

```bash
pnpm test --cwd packages/sync-core SyncOrchestrator.test.ts
```

## Troubleshooting

### Common Issues

1. **Sync Operations Failing**
   - Check Redis connectivity
   - Verify database permissions
   - Review tenant context configuration

2. **High Conflict Rate**
   - Review concurrent access patterns
   - Consider adjusting sync timing
   - Implement application-level locking

3. **Performance Issues**
   - Monitor batch sizes
   - Check Redis memory usage
   - Review database query performance

### Debug Logging

Enable debug logging to troubleshoot issues:

```typescript
// Set log level to debug
process.env.LOG_LEVEL = 'debug';
```

### Health Checks

The service provides health check endpoints:

```typescript
const health = await syncOrchestrator.getHealth();
console.log('Sync service health:', health);
```

## Future Enhancements

Planned improvements include:

1. **Advanced Conflict Resolution**: ML-based conflict resolution
2. **Performance Optimization**: Improved batching algorithms
3. **Enhanced Monitoring**: Real-time dashboards
4. **Cross-Region Sync**: Multi-region synchronization support
5. **Event Sourcing**: Complete audit trail with event sourcing

## Contributing

When contributing to the SyncOrchestrator:

1. Follow existing code patterns and conventions
2. Add comprehensive tests for new functionality
3. Update documentation for API changes
4. Consider performance implications of changes
5. Ensure tenant isolation is maintained

## Related Documentation

- [MasterClockService](./MasterClockService.md) - Time synchronization
- [EnhancedFileSystemWatcher](./EnhancedFileSystemWatcher.md) - File monitoring
- [Multi-Tenant Architecture](../../../docs/MULTI_TENANT_ARCHITECTURE.md) - Platform architecture
- [Redis Integration](../../../docs/REDIS_INTEGRATION.md) - Redis usage patterns