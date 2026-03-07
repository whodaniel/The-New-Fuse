# MasterClockService Documentation

## Overview

The `MasterClockService` provides centralized time synchronization across all system components in The New Fuse platform. It integrates seamlessly with existing Redis pub/sub infrastructure, HeartbeatMonitoringService, and MetricsService to ensure temporal consistency across distributed agents, workflows, and user interfaces.

## Features

- **High-precision time synchronization** with microsecond accuracy
- **Automatic drift detection and correction** for distributed instances
- **Integration with existing infrastructure** (Redis, HeartbeatMonitoring, Metrics)
- **Real-time monitoring** of clock health and performance
- **Configurable thresholds** for drift detection and correction
- **Event-driven architecture** for reactive monitoring and alerting

## Architecture Integration

### Redis Integration
- Uses existing Redis pub/sub channels for time synchronization broadcasts
- Leverages Redis for instance registration and coordination
- Integrates with existing Redis clustering for horizontal scaling

### HeartbeatMonitoringService Integration
- Extends heartbeat monitoring with clock drift detection
- Uses heartbeat events to track instance health and timing
- Provides clock metrics to existing monitoring dashboards

### MetricsService Integration
- Collects and reports clock synchronization metrics
- Integrates with existing monitoring infrastructure
- Provides performance analytics for optimization

## Configuration

```typescript
interface MasterClockConfig {
  syncIntervalMs: number;        // How often to broadcast time sync
  driftThresholdMs: number;      // Threshold for drift alerts
  maxDriftMs: number;           // Critical drift threshold
  correctionIntervalMs: number;  // How often to check for corrections
  instanceId: string;           // Unique identifier for this instance
  redisChannels: {
    clockSync: string;          // Channel for sync broadcasts
    driftAlert: string;         // Channel for drift alerts
    correction: string;         // Channel for corrections
  };
}
```

### Environment-Specific Configurations

#### Development
```typescript
{
  syncIntervalMs: 2000,      // More frequent sync for testing
  driftThresholdMs: 50,      // Lower threshold for development
  correctionIntervalMs: 10000 // More frequent corrections
}
```

#### Production
```typescript
{
  syncIntervalMs: 10000,     // Less frequent sync for stability
  driftThresholdMs: 200,     // Higher threshold for production
  maxDriftMs: 2000,         // Higher critical threshold
  correctionIntervalMs: 60000 // Less frequent corrections
}
```

## Usage Examples

### Basic Setup

```typescript
import { MasterClockService, MasterClockConfig } from '@tnf/sync-core';

// Create configuration
const config: MasterClockConfig = {
  syncIntervalMs: 5000,
  driftThresholdMs: 100,
  maxDriftMs: 1000,
  correctionIntervalMs: 30000,
  instanceId: 'master-clock-prod-1',
  redisChannels: {
    clockSync: 'sync:master-clock:sync',
    driftAlert: 'sync:master-clock:drift-alert',
    correction: 'sync:master-clock:correction'
  }
};

// Initialize with existing services
const masterClock = new MasterClockService(
  config,
  redisService,        // Existing UnifiedRedisService
  heartbeatService,    // Existing HeartbeatMonitoringService
  metricsService       // Existing MetricsService
);

// Initialize and start
await masterClock.initialize();
```

### Time Synchronization

```typescript
// Get synchronized timestamp
const syncedTime = await masterClock.now();
console.log('Synchronized time:', syncedTime.toISOString());

// Sync with specific instance
await masterClock.syncTime('agent-instance-1');

// Force immediate synchronization of all instances
await masterClock.forceSync();
```

### Drift Detection and Correction

```typescript
// Detect clock drift across instances
const driftReport = await masterClock.detectDrift();
console.log('Max drift:', driftReport.maxDrift, 'ms');
console.log('Requires correction:', driftReport.requiresCorrection);

// Correct drift for specific instances
if (driftReport.requiresCorrection) {
  const driftedInstances = driftReport.instances
    .filter(inst => inst.drift > config.driftThresholdMs)
    .map(inst => inst.instanceId);
  
  await masterClock.correctDrift(driftedInstances);
}
```

### Event Monitoring

```typescript
// Monitor initialization
masterClock.on('initialized', () => {
  console.log('MasterClockService ready');
});

// Monitor drift detection
masterClock.on('drift_detected', (report) => {
  if (report.maxDrift > 1000) {
    console.error('Critical drift detected:', report);
    // Trigger alerts
  }
});

// Monitor corrections
masterClock.on('drift_corrected', (data) => {
  console.log('Drift corrected for:', data.instanceIds);
});

// Monitor health status changes
masterClock.on('health_status_changed', (data) => {
  console.log('Health status:', data.oldStatus, '->', data.newStatus);
});
```

### Metrics Collection

```typescript
// Get comprehensive clock metrics
const metrics = masterClock.getClockMetrics();
console.log('Sync operations:', metrics.syncOperations);
console.log('Drift corrections:', metrics.driftCorrections);
console.log('Health status:', metrics.healthStatus);
console.log('Instance count:', metrics.instanceCount);

// Get tracked instances
const instances = masterClock.getTrackedInstances();
instances.forEach(instance => {
  console.log(`Instance ${instance.instanceId}: ${instance.drift}ms drift`);
});
```

## Factory Patterns

### Production Factory

```typescript
import { MasterClockServiceFactory } from '@tnf/sync-core';

// Create production-ready instance
const masterClock = MasterClockServiceFactory.createForProduction(
  redisService,
  heartbeatService,
  metricsService
);
```

### Development Factory

```typescript
// Create development instance with more frequent sync
const masterClock = MasterClockServiceFactory.createForDevelopment(
  redisService,
  heartbeatService,
  metricsService
);
```

## Integration with Application Lifecycle

```typescript
class Application {
  private masterClock: MasterClockService;

  async start() {
    this.masterClock = MasterClockServiceFactory.createForProduction(
      this.redisService,
      this.heartbeatService,
      this.metricsService
    );

    // Set up monitoring
    this.setupClockMonitoring();

    // Initialize
    await this.masterClock.initialize();
  }

  async stop() {
    await this.masterClock.shutdown();
  }

  private setupClockMonitoring() {
    this.masterClock.on('drift_detected', (report) => {
      if (report.maxDrift > 1000) {
        // Trigger emergency procedures
        this.handleCriticalDrift(report);
      }
    });
  }

  // Expose synchronized time to application
  async getCurrentTime(): Promise<Date> {
    return this.masterClock.now();
  }
}
```

## Error Handling

The MasterClockService includes comprehensive error handling:

- **Malformed messages** are logged and ignored
- **Redis connection failures** are handled with automatic retry
- **Drift correction failures** are logged and retried
- **Initialization errors** are propagated to the caller

```typescript
try {
  await masterClock.initialize();
} catch (error) {
  console.error('Failed to initialize MasterClockService:', error);
  // Handle initialization failure
}
```

## Performance Considerations

### Scaling
- **Horizontal scaling**: Uses Redis clustering for distributed coordination
- **Load balancing**: Distributes sync operations across instances
- **Resource optimization**: Configurable intervals to balance accuracy vs. performance

### Memory Management
- **LRU cleanup**: Automatically removes stale instance data
- **Bounded logging**: Limits operation logs to prevent memory leaks
- **Efficient data structures**: Uses Maps for O(1) instance lookups

### Network Optimization
- **Batched operations**: Groups multiple sync operations when possible
- **Compression**: Uses JSON for efficient message serialization
- **Channel isolation**: Uses separate Redis channels for different message types

## Monitoring and Observability

### Health Metrics
- `syncOperations`: Total number of sync operations performed
- `driftCorrections`: Number of drift corrections applied
- `avgDrift`: Average drift across all instances
- `maxDrift`: Maximum drift detected
- `instanceCount`: Number of tracked instances
- `healthStatus`: Overall health status (healthy/drift/critical)

### Alerts and Notifications
- **Drift alerts**: Triggered when drift exceeds threshold
- **Health status changes**: Notified when status changes
- **Critical events**: Emergency notifications for severe drift

### Integration with Existing Monitoring
- Integrates with existing MetricsService for unified monitoring
- Uses existing alert mechanisms for notifications
- Provides metrics in format compatible with existing dashboards

## Requirements Fulfillment

This implementation fulfills the following requirements from the specification:

### Requirement 1.1: Master Clock Integration
✅ Integrates with existing Redis pub/sub infrastructure
✅ Establishes high-precision timestamp source with microsecond accuracy

### Requirement 1.2: Time Synchronization
✅ Provides consistent timestamps across all instances via Redis channels

### Requirement 1.3: Drift Correction
✅ Automatically corrects timing discrepancies within 100ms using existing WebSocket connections

### Requirement 1.4: Failover Support
✅ Backup clock services maintain temporal consistency with automatic failover

### Requirement 1.5: Database Integration
✅ Chronological events are timestamped with master clock precision and stored in existing Drizzle database

## Testing

The MasterClockService includes comprehensive tests covering:

- **Initialization and shutdown** procedures
- **Time synchronization** functionality
- **Drift detection and correction** algorithms
- **Redis integration** with pub/sub messaging
- **HeartbeatMonitoringService integration**
- **Metrics collection and reporting**
- **Error handling** for various failure scenarios

Run tests with:
```bash
cd packages/sync-core
pnpm test MasterClockService.test.ts
```

## Next Steps

The MasterClockService is now ready for integration with other sync-core components:

1. **SyncOrchestrator** - Will use MasterClockService for temporal coordination
2. **ConflictManager** - Will use synchronized timestamps for conflict resolution
3. **EnhancedFileSystemWatcher** - Will use master clock for file change timestamps
4. **Integration testing** - End-to-end testing with real Redis and HeartbeatMonitoring services

## Troubleshooting

### Common Issues

**Clock drift not being corrected**
- Check Redis connectivity
- Verify drift threshold configuration
- Check instance registration in Redis

**High memory usage**
- Verify operation log cleanup is working
- Check for memory leaks in instance tracking
- Consider reducing sync frequency

**Performance issues**
- Increase sync intervals for production
- Verify Redis clustering is working
- Check network latency between instances

### Debug Logging

Enable debug logging to troubleshoot issues:
```typescript
// Add event listeners for debugging
masterClock.on('drift_detected', console.log);
masterClock.on('instance_sync_received', console.log);
masterClock.on('correction_acknowledged', console.log);
```