# ConflictManager

The ConflictManager is a core service in the multi-tenant chokidar
synchronization system that handles synchronization conflicts using existing
database transaction patterns. It integrates seamlessly with the existing Drizzle
database infrastructure and audit logging system.

## Overview

The ConflictManager extends the BaseErrorHandler from the core-error-handling
package and provides comprehensive conflict detection, resolution, and
management capabilities while maintaining tenant isolation and security.

## Features

- **Conflict Detection**: Automatically detects version, checksum, and
  concurrent modification conflicts
- **Multiple Resolution Strategies**: Supports latest_wins, merge, rollback, and
  manual resolution strategies
- **Auto-Resolution**: Intelligent automatic resolution for simple conflicts
- **Tenant Isolation**: Maintains strict tenant boundaries during conflict
  resolution
- **Audit Logging**: Integrates with existing AuthEvent table for comprehensive
  audit trails
- **Error Handling**: Built-in error handling with retry mechanisms and recovery
  strategies
- **Database Transactions**: Uses existing Drizzle transaction patterns for data
  consistency

## Architecture Integration

### Database Integration

- Uses existing `DrizzleClient` for database operations
- Integrates with `SyncDatabaseService` for sync-specific operations
- Leverages existing `SyncState` and `SyncConflict` models
- Uses database transactions to ensure consistency

### Error Handling Integration

- Extends `BaseErrorHandler` from core-error-handling package
- Implements custom error types for conflict-specific scenarios
- Provides recovery strategies for transient failures
- Integrates with existing monitoring and alerting systems

### Audit Logging Integration

- Uses existing `AuthEvent` table for audit logging
- Creates system user for automated conflict resolution events
- Maintains comprehensive audit trails for compliance

## Usage

### Basic Setup

```typescript
import { ConflictManager } from '@the-new-fuse/sync-core';
import { SyncDatabaseService } from '@the-new-fuse/sync-core';
import { DrizzleClient } from '@the-new-fuse/database';

// Initialize dependencies
const drizzle = new DrizzleClient();
const syncDb = new SyncDatabaseService(drizzle);

// Create ConflictManager instance
const conflictManager = new ConflictManager(drizzle, syncDb);
```

### Conflict Detection

```typescript
// Detect conflicts during synchronization
const conflict = await conflictManager.detectConflict(
  'agent', // Resource type
  'agent-123', // Resource ID
  localVersion, // Local version data
  remoteVersion, // Remote version data
  'tenant-456' // Optional tenant ID
);

if (conflict) {
  console.log(`Conflict detected: ${conflict.conflictType}`);
}
```

### Conflict Resolution

```typescript
// Resolve conflict with specific strategy
const resolution = await conflictManager.resolveConflict(
  conflict.id, // Conflict ID
  'latest_wins', // Resolution strategy
  'user-123', // Resolver ID
  tenantContext // Optional tenant context
);

console.log(`Resolved with strategy: ${resolution.strategy}`);
```

### Auto-Resolution

```typescript
// Auto-resolve all pending conflicts for a tenant
const resolvedCount = await conflictManager.autoResolveConflicts('tenant-123');
console.log(`Auto-resolved ${resolvedCount} conflicts`);
```

## Conflict Types

### Version Conflicts

Occur when local and remote versions have different version numbers.

- **Auto-resolution**: `latest_wins` strategy
- **Detection**: Compares version fields in data objects

### Checksum Conflicts

Occur when data content differs but versions might be the same.

- **Auto-resolution**: `merge` strategy (if compatible)
- **Detection**: SHA-256 checksum comparison

### Concurrent Conflicts

Occur when both local and remote versions differ from the stored state.

- **Auto-resolution**: None (requires manual intervention)
- **Detection**: Both versions differ from current sync state

## Resolution Strategies

### latest_wins

- Selects the remote version as the resolved data
- Best for: Version conflicts where newer is better
- Risk: May lose local changes

### merge

- Automatically merges non-conflicting changes
- Best for: Compatible object structures
- Risk: May create inconsistent merged state

### rollback

- Keeps the local version, discarding remote changes
- Best for: When local changes should be preserved
- Risk: May lose important remote updates

### manual

- Requires human intervention to resolve
- Best for: Complex conflicts requiring business logic
- Risk: Delays in resolution

## Error Handling

The ConflictManager implements comprehensive error handling:

### Error Types

- **5001**: Conflict detection errors (database connectivity, etc.)
- **5002**: Conflict resolution errors (transaction failures, etc.)
- **5003**: General system errors

### Recovery Strategies

- **database-retry**: Retries database operations with exponential backoff
- **conflict-fallback**: Applies safe fallback resolution when possible

### Error Events

```typescript
// Listen to error events
conflictManager.on('error', (error, context) => {
  console.error('Conflict error:', error.message);
});

// Listen to recovery events
conflictManager.on('recoverySuccess', (event) => {
  console.log('Recovery successful:', event.strategy);
});
```

## Monitoring and Statistics

### Conflict Statistics

```typescript
const stats = await conflictManager.getConflictStatistics('tenant-123');
console.log({
  total: stats.totalSyncStates,
  pending: stats.pendingConflicts,
  resolved: stats.resolvedConflicts,
  conflictRate: stats.conflictRate,
});
```

### Resource-Specific Conflicts

```typescript
const conflicts = await conflictManager.getResourceConflicts(
  'agent',
  'problematic-agent-id',
  'tenant-123'
);
```

### Maintenance Operations

```typescript
// Clean up old resolved conflicts (older than 30 days)
const cleanedUp = await conflictManager.cleanupResolvedConflicts(30);
```

## Tenant Isolation

The ConflictManager maintains strict tenant isolation:

### Tenant Context

```typescript
interface TenantSyncContext {
  tenantId: string;
  userId?: string;
  permissions: string[];
  isolationLevel: 'strict' | 'controlled' | 'shared';
}
```

### Isolation Levels

- **strict**: Complete tenant isolation, no cross-tenant operations
- **controlled**: Limited cross-tenant operations with explicit permissions
- **shared**: Shared resources with tenant-aware access control

## Security Considerations

### Data Protection

- All conflict data is encrypted in transit and at rest
- Tenant boundaries are enforced at the database level
- Audit trails are maintained for all conflict operations

### Access Control

- Resolution operations require appropriate permissions
- System operations use dedicated system user account
- All operations are logged with user attribution

### Privacy

- Tenant data never crosses isolation boundaries
- Conflict resolution respects existing privacy settings
- Audit logs exclude sensitive data content

## Performance Optimization

### Batching

- Auto-resolution processes conflicts in batches
- Database operations are optimized with transactions
- Bulk operations reduce database round trips

### Caching

- Conflict statistics are cached for performance
- Checksum calculations are optimized
- Database queries use appropriate indexes

### Scalability

- Horizontal scaling through Redis coordination
- Database connection pooling for high concurrency
- Asynchronous processing for non-blocking operations

## Integration Examples

### With SyncOrchestrator

```typescript
// In SyncOrchestrator
const conflict = await this.conflictManager.detectConflict(
  resourceType,
  resourceId,
  localData,
  remoteData,
  tenantId
);

if (conflict) {
  // Handle conflict before proceeding with sync
  await this.handleSyncConflict(conflict);
}
```

### With File System Watcher

```typescript
// In EnhancedFileSystemWatcher
watcher.on('change', async (filePath) => {
  const conflict = await conflictManager.detectConflict(
    'file',
    filePath,
    localFileData,
    remoteFileData
  );

  if (conflict) {
    await conflictManager.resolveConflict(
      conflict.id,
      'latest_wins',
      'file-watcher'
    );
  }
});
```

## Testing

The ConflictManager includes comprehensive tests covering:

- Conflict detection scenarios
- All resolution strategies
- Error handling and recovery
- Tenant isolation
- Database transaction integrity
- Performance characteristics

Run tests with:

```bash
pnpm test ConflictManager.test.ts
```

## Configuration

### Environment Variables

- `CONFLICT_AUTO_RESOLUTION_ENABLED`: Enable/disable auto-resolution
- `CONFLICT_CLEANUP_INTERVAL_DAYS`: Days to keep resolved conflicts
- `CONFLICT_MAX_RETRY_ATTEMPTS`: Maximum retry attempts for failed operations

### Service Configuration

```typescript
const conflictManager = new ConflictManager(drizzle, syncDb, {
  enableAutoRecovery: true,
  maxRecoveryAttempts: 3,
  statisticsInterval: 60000,
  enableLogging: true,
  logLevel: 'error',
});
```

## Troubleshooting

### Common Issues

1. **High Conflict Rate**
   - Check for clock synchronization issues
   - Review concurrent modification patterns
   - Consider adjusting sync frequency

2. **Resolution Failures**
   - Verify database connectivity
   - Check transaction timeout settings
   - Review error logs for specific failures

3. **Performance Issues**
   - Monitor database connection pool
   - Check for long-running transactions
   - Review conflict cleanup frequency

### Debug Logging

Enable debug logging to troubleshoot issues:

```typescript
const conflictManager = new ConflictManager(drizzle, syncDb, {
  enableLogging: true,
  logLevel: 'debug',
});
```

## API Reference

### Methods

#### `detectConflict(resourceType, resourceId, localVersion, remoteVersion, tenantId?)`

Detects conflicts between local and remote versions of a resource.

#### `resolveConflict(conflictId, strategy, resolvedBy, context?)`

Resolves a conflict using the specified strategy.

#### `getPendingConflicts(tenantId?)`

Gets all pending conflicts for a tenant or globally.

#### `getResourceConflicts(resourceType, resourceId, tenantId?)`

Gets all conflicts for a specific resource.

#### `autoResolveConflicts(tenantId?)`

Automatically resolves conflicts using predefined rules.

#### `cleanupResolvedConflicts(olderThanDays)`

Cleans up old resolved conflicts.

#### `getConflictStatistics(tenantId?)`

Gets conflict statistics for monitoring.

### Events

#### `error`

Emitted when an error occurs during conflict operations.

#### `recoverySuccess`

Emitted when error recovery succeeds.

#### `recoveryFailure`

Emitted when error recovery fails.

## Best Practices

1. **Monitor Conflict Rates**: Keep track of conflict statistics to identify
   systemic issues
2. **Use Appropriate Strategies**: Choose resolution strategies based on data
   criticality
3. **Regular Cleanup**: Clean up old resolved conflicts to maintain performance
4. **Test Resolution Logic**: Thoroughly test custom resolution strategies
5. **Audit Trail Review**: Regularly review audit logs for security and
   compliance
6. **Performance Monitoring**: Monitor resolution times and database performance
7. **Tenant Isolation**: Always verify tenant boundaries in custom
   implementations

## Future Enhancements

- Machine learning-based conflict prediction
- Advanced merge algorithms for complex data structures
- Real-time conflict notification system
- Conflict resolution workflow integration
- Enhanced performance metrics and analytics
