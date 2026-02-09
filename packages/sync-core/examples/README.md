# Sync-Core Integration Examples

This directory contains comprehensive examples for integrating sync-core into your services and applications.

## Available Examples

### 1. Basic Integration (`basic-integration.ts`)

**What it covers**:
- Basic synchronization operations
- Subscribing to sync events
- Bulk updates with batching
- Cache management integration

**Best for**:
- Getting started with sync-core
- Simple CRUD operations with sync
- Single-resource synchronization

**Key features**:
```typescript
// Update with automatic sync
await userService.updateUser(userId, data, tenantId);

// Subscribe to changes
syncOrchestrator.subscribe('user', handleUserSync);

// Bulk operations
await userService.bulkUpdateUsers(updates, tenantId);
```

### 2. Agent State Synchronization (`agent-state-sync.ts`)

**What it covers**:
- Real-time agent state tracking
- Task assignment and progress updates
- Agent health monitoring with heartbeat
- Error handling and recovery

**Best for**:
- Distributed agent coordination
- Task execution tracking
- Multi-agent workflows
- Real-time monitoring dashboards

**Key features**:
```typescript
// Update agent status
await agentService.updateAgentStatus(agentId, 'PROCESSING', metadata);

// Track task progress
await agentService.updateTaskProgress(agentId, taskId, 75, tenantId);

// Monitor agent health
await agentService.monitorAgentHealth(agentId);
```

### 3. Conflict Resolution (`conflict-resolution.ts`)

**What it covers**:
- Conflict detection strategies
- Multiple resolution strategies (latest-wins, smart-merge, manual)
- Content merging algorithms
- Conflict audit trail

**Best for**:
- Collaborative editing
- Multi-user document management
- Concurrent data modifications
- Version control systems

**Key features**:
```typescript
// Register custom resolvers
conflictManager.registerResolver('document', 'smart_merge', smartMergeFunc);

// Handle conflicts automatically
const resolved = await documentService.updateDocument(docId, updates, userId, tenantId);

// Get conflict statistics
const stats = await documentService.getConflictStats(tenantId);
```

### 4. Real-Time Notifications (`real-time-notifications.ts`)

**What it covers**:
- Multi-channel notification delivery (WebSocket, email, SMS, push)
- Priority-based routing
- System-wide broadcasts
- User-specific notifications
- Notification streams

**Best for**:
- Real-time alerts and updates
- User engagement
- System status notifications
- Critical error alerts

**Key features**:
```typescript
// Send notification to user
await notificationService.notifyUser(userId, tenantId, 'Title', 'Message');

// Broadcast to all tenants
await notificationService.broadcastSystemNotification('Title', 'Message');

// Real-time notification stream
const stream = await notificationService.streamNotifications(userId, tenantId);
```

### 5. File Watching & CMS Sync (`file-watching-cms-sync.ts`)

**What it covers**:
- File system monitoring
- Automatic content synchronization
- Configuration hot-reloading
- Markdown frontmatter parsing
- Checksum-based change detection

**Best for**:
- Content Management Systems
- Configuration management
- Documentation sites
- Static site generators

**Key features**:
```typescript
// Watch content directory
await fileWatcher.watchPath('./content', handleContentChange);

// Manual full sync
await cmsService.syncAllContent();

// Trigger reload on config change
await cmsService.triggerReload(configPath);
```

### 6. Advanced Multi-Service Orchestration (`advanced-multi-service.ts`)

**What it covers**:
- Distributed workflow execution
- Multi-step task orchestration
- Dependency management
- Retry logic with backoff
- Workflow pause/resume/cancel
- Cross-service coordination

**Best for**:
- Complex business processes
- Multi-stage pipelines
- Distributed transactions
- Service orchestration

**Key features**:
```typescript
// Execute distributed workflow
const workflow = await workflowService.executeWorkflow(workflowDef, tenantId);

// Pause/resume workflow
await workflowService.pauseWorkflow(workflowId, tenantId);
await workflowService.resumeWorkflow(workflowId, tenantId);

// Get workflow status
const status = await workflowService.getWorkflowStatus(workflowId);
```

## Usage Patterns

### Pattern 1: Single Resource Sync

Use when you need to synchronize a specific resource type (e.g., users, documents).

```typescript
// Update local database
const updated = await database.update(resourceId, data);

// Sync across all instances
await syncOrchestrator.syncTenantData(tenantId, resourceType, updated);
```

**Example**: `basic-integration.ts`

### Pattern 2: Event-Driven Sync

Use when you need to react to changes from other instances.

```typescript
// Subscribe to events
syncOrchestrator.subscribe(resourceType, (event) => {
  console.log('Change detected:', event);
  // Update local cache, trigger UI refresh, etc.
});
```

**Example**: All examples use this pattern

### Pattern 3: Stateful Agent Coordination

Use when coordinating multiple agents working on tasks.

```typescript
// Update agent state
await syncOrchestrator.syncAgentState(agentId, state);

// Update task state
await taskSync.syncTaskData(taskData, tenantId);
```

**Example**: `agent-state-sync.ts`, `advanced-multi-service.ts`

### Pattern 4: Conflict-Aware Updates

Use when concurrent modifications are expected.

```typescript
try {
  await syncOrchestrator.syncTenantData(
    tenantId,
    resourceType,
    data,
    { expectedVersion: currentVersion }
  );
} catch (error) {
  if (error.code === 'VERSION_CONFLICT') {
    // Handle conflict
    const resolved = await conflictManager.resolve(local, remote);
  }
}
```

**Example**: `conflict-resolution.ts`

### Pattern 5: Global Sync

Use for tenant-independent resources (configs, system settings).

```typescript
// Sync globally (all tenants)
await syncOrchestrator.syncGlobalData(resourceType, data);
```

**Example**: `file-watching-cms-sync.ts`

## Integration Checklist

When integrating sync-core into your service:

- [ ] **Initialize SyncOrchestrator** in your service constructor
- [ ] **Subscribe to relevant events** in `onModuleInit()`
- [ ] **Add sync calls** after database updates
- [ ] **Handle sync events** in subscription callbacks
- [ ] **Implement error handling** for sync failures
- [ ] **Add metrics tracking** for monitoring
- [ ] **Test conflict scenarios** if concurrent updates are possible
- [ ] **Configure caching** for frequently accessed data
- [ ] **Set up health checks** to monitor sync service health

## Performance Considerations

### When to Use Batching

✅ **Use batching for**:
- Bulk operations (> 10 items)
- Background sync jobs
- Data imports
- Batch notifications

❌ **Don't use batching for**:
- Real-time user interactions
- Critical updates
- High-priority notifications

### When to Use Global vs Tenant Sync

**Global Sync** (`syncGlobalData`):
- Configuration changes
- System-wide announcements
- Feature flags
- Prompt templates (shared across tenants)

**Tenant Sync** (`syncTenantData`):
- User data
- Tenant-specific resources
- Documents and content
- Agent states within a tenant

### Caching Strategy

```typescript
// High-frequency reads, infrequent writes
await cache.set(key, value, ttl = 3600); // 1 hour

// Low-frequency reads, frequent writes
await cache.set(key, value, ttl = 60); // 1 minute

// Critical real-time data
// Don't cache, always sync
```

## Testing

### Unit Testing

```typescript
describe('SyncIntegration', () => {
  let mockOrchestrator: jest.Mocked<SyncOrchestrator>;

  beforeEach(() => {
    mockOrchestrator = {
      syncTenantData: jest.fn(),
      subscribe: jest.fn(),
    } as any;
  });

  it('should sync after update', async () => {
    const service = new YourService(mockOrchestrator);
    await service.updateResource(id, data, tenantId);

    expect(mockOrchestrator.syncTenantData).toHaveBeenCalledWith(
      tenantId,
      'resource',
      expect.objectContaining({ id })
    );
  });
});
```

### Integration Testing

```typescript
describe('SyncIntegration E2E', () => {
  let syncOrchestrator: SyncOrchestrator;

  beforeAll(async () => {
    // Set up real sync-core instance
    syncOrchestrator = await SyncOrchestrator.create();
  });

  it('should sync across instances', async () => {
    const received = [];

    // Subscribe in one instance
    syncOrchestrator.subscribe('test', (event) => {
      received.push(event);
    });

    // Publish from another instance
    await syncOrchestrator.syncTenantData(
      'tenant-123',
      'test',
      { data: 'test' }
    );

    // Wait for sync
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(received).toHaveLength(1);
  });
});
```

## Troubleshooting

### Common Issues

**Issue**: Sync operations are slow
```typescript
// Check metrics
const metrics = syncOrchestrator.getMetrics();
console.log('Avg latency:', metrics.performance.avgSyncLatency);

// Solution: Enable batching or caching
```

**Issue**: High conflict rate
```typescript
// Check conflict stats
const stats = conflictManager.getStats();
console.log('Conflict rate:', stats.conflictRate);

// Solution: Implement optimistic locking or adjust debouncing
```

**Issue**: Memory leaks from subscriptions
```typescript
// Always unsubscribe when done
const handler = (event) => { /* ... */ };
syncOrchestrator.subscribe('resource', handler);

// Later...
syncOrchestrator.unsubscribe('resource', handler);
```

## Best Practices

1. **Always sync after database updates** - Keep sync-core in sync with database state
2. **Use appropriate TTLs for caching** - Balance freshness vs performance
3. **Implement proper error handling** - Sync failures shouldn't break your service
4. **Monitor sync metrics** - Track latency and success rates
5. **Test conflict scenarios** - Ensure your conflict resolution works correctly
6. **Use tenant isolation** - Don't mix tenant data in global sync
7. **Batch when possible** - Reduce overhead for bulk operations
8. **Clean up subscriptions** - Prevent memory leaks

## Further Reading

- [Architecture Documentation](../ARCHITECTURE.md)
- [Deployment Guide](../deployment/DEPLOYMENT.md)
- [Performance Optimization](../docs/PERFORMANCE_OPTIMIZATION.md)
- [API Reference](../docs/SyncOrchestrator.md)

## Need Help?

- Check the [troubleshooting guide](../README.md#troubleshooting)
- Review the [architecture documentation](../ARCHITECTURE.md)
- Look at similar examples in this directory
- Open an issue on GitHub
