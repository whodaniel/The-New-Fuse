import { FileChangeEvent } from '../watchers/EnhancedFileSystemWatcher';
import {
  PerformanceConfig,
  PerformanceOptimizationService,
} from './PerformanceOptimizationService';

// Mock services for example purposes
class MockRedisService {
  async setex(key: string, seconds: number, value: string): Promise<string> {
    return 'OK';
  }
  async get(key: string): Promise<string | null> {
    return null;
  }
  async sadd(key: string, member: string): Promise<number> {
    return 1;
  }
  async smembers(key: string): Promise<string[]> {
    return [];
  }
  async srem(key: string, member: string): Promise<number> {
    return 1;
  }
  async del(key: string): Promise<number> {
    return 1;
  }
  async lpush(key: string, value: string): Promise<number> {
    return 1;
  }
  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return [];
  }
  async publish(channel: string, message: string): Promise<number> {
    return 1;
  }
}

class MockMetricsService {
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    console.log(`Metric: ${name} = ${value}`, tags);
  }
}

/**
 * Example: Setting up Performance Optimization Service
 *
 * This example demonstrates how to configure and use the performance optimization
 * service with horizontal scaling, batching, caching, and telemetry.
 */

async function setupPerformanceOptimization() {
  // Initialize dependencies (these would come from your existing infrastructure)
  const redisService = new MockRedisService();
  const metricsService = new MockMetricsService();

  // Configure performance optimization
  const config: PerformanceConfig = {
    scaling: {
      instanceId: `sync-instance-${process.env.HOSTNAME || 'local'}`,
      heartbeatInterval: 5000, // 5 seconds
      loadThreshold: 80, // 80% load threshold
      redistributionDelay: 30000, // 30 seconds
      clusterKey: 'sync-cluster',
    },
    batching: {
      maxBatchSize: 50, // Process up to 50 changes per batch
      batchTimeout: 2000, // 2 seconds max wait
      debounceDelay: 200, // 200ms debounce for rapid changes
      priorityPatterns: ['config', 'template', '.env', 'schema'],
    },
    caching: {
      maxSize: 10000, // 10k cache entries
      maxMemory: 1024 * 1024 * 100, // 100MB memory limit
      ttl: 1800000, // 30 minutes TTL
      cleanupInterval: 300000, // 5 minutes cleanup
      tenantIsolation: true,
    },
    telemetry: {
      metricsInterval: 30000, // 30 seconds
      retentionPeriod: 3600000 * 24, // 24 hours
      aggregationWindow: 300000, // 5 minutes
      enableDetailedMetrics: true,
      maxMetricsBuffer: 50000,
    },
    enableOptimizations: true,
    memoryThreshold: 1024 * 1024 * 500, // 500MB
    cpuThreshold: 85, // 85%
  };

  // Create and initialize the service
  const performanceService = new PerformanceOptimizationService(
    redisService,
    metricsService,
    config
  );

  await performanceService.initialize();

  console.log('Performance optimization service initialized');
  return performanceService;
}

/**
 * Example: Processing File Changes with Performance Optimization
 */
async function processFileChangesExample(performanceService: PerformanceOptimizationService) {
  console.log('\n=== File Change Processing Example ===');

  // Simulate various file changes
  const fileChanges: FileChangeEvent[] = [
    {
      type: 'create',
      filePath: '/config/database.json',
      tenantId: 'tenant-1',
      timestamp: new Date(),
      checksum: 'abc123',
      metadata: { size: 2048, priority: 'high' },
    },
    {
      type: 'update',
      filePath: '/templates/user-prompt.md',
      tenantId: 'tenant-1',
      timestamp: new Date(),
      checksum: 'def456',
      metadata: { size: 4096, priority: 'high' },
    },
    {
      type: 'update',
      filePath: '/data/cache/temp.json',
      tenantId: 'tenant-2',
      timestamp: new Date(),
      checksum: 'ghi789',
      metadata: { size: 1024, priority: 'low' },
    },
  ];

  // Process file changes (they will be batched automatically)
  for (const change of fileChanges) {
    await performanceService.processFileChange(change);
    console.log(`Processed file change: ${change.filePath}`);
  }

  // Wait for batching to complete
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const metrics = await performanceService.getPerformanceMetrics();
  console.log('Batching metrics:', {
    processedBatches: metrics.batching.processedBatches,
    pendingChanges: metrics.batching.pendingChanges,
  });
}

/**
 * Example: Using Intelligent Caching
 */
async function cachingExample(performanceService: PerformanceOptimizationService) {
  console.log('\n=== Caching Example ===');

  // Cache some data for different tenants
  const userData = {
    id: 'user-123',
    name: 'John Doe',
    preferences: { theme: 'dark', language: 'en' },
  };

  const configData = {
    apiEndpoint: 'https://api.example.com',
    timeout: 30000,
    retries: 3,
  };

  // Set cached data with tenant isolation
  performanceService.setCachedData('user:123', userData, 'tenant-1');
  performanceService.setCachedData('config:api', configData, 'tenant-1');
  performanceService.setCachedData('config:api', { ...configData, timeout: 60000 }, 'tenant-2');

  // Retrieve cached data
  const cachedUser = performanceService.getCachedData('user:123', 'tenant-1');
  const cachedConfig1 = performanceService.getCachedData('config:api', 'tenant-1');
  const cachedConfig2 = performanceService.getCachedData('config:api', 'tenant-2');

  console.log('Cached user:', cachedUser);
  console.log('Tenant 1 config timeout:', cachedConfig1?.timeout);
  console.log('Tenant 2 config timeout:', cachedConfig2?.timeout);

  // Demonstrate cache miss
  const missedData = performanceService.getCachedData('non-existent', 'tenant-1');
  console.log('Cache miss result:', missedData);

  const metrics = await performanceService.getPerformanceMetrics();
  console.log('Cache metrics:', {
    hitRate: (metrics.caching.hitRate * 100).toFixed(2) + '%',
    memoryUsage: Math.round(metrics.caching.memoryUsage / 1024) + ' KB',
  });
}

/**
 * Example: Work Distribution Across Cluster
 */
async function workDistributionExample(performanceService: PerformanceOptimizationService) {
  console.log('\n=== Work Distribution Example ===');

  try {
    // Distribute different types of work
    const syncWork = {
      operation: 'sync-templates',
      templates: ['template1.md', 'template2.md'],
      priority: 'high',
    };

    const targetInstance = await performanceService.distributeWork(
      'template-sync',
      syncWork,
      'tenant-1'
    );
    console.log(`Work distributed to instance: ${targetInstance}`);

    // Check for assigned work (in a real scenario, this would be called by worker instances)
    const assignedWork = await performanceService.getAssignedWork();
    console.log(`Assigned work items: ${assignedWork.length}`);

    // Update instance load
    performanceService.updateInstanceLoad(65);
    console.log('Updated instance load to 65%');
  } catch (error) {
    console.log('Work distribution not available (no other instances):', error.message);
  }
}

/**
 * Example: Performance Monitoring and Optimization
 */
async function monitoringExample(performanceService: PerformanceOptimizationService) {
  console.log('\n=== Performance Monitoring Example ===');

  // Get comprehensive performance metrics
  const metrics = await performanceService.getPerformanceMetrics();

  console.log('Performance Metrics:');
  console.log('- Scaling:');
  console.log(`  * Instance Count: ${metrics.scaling.instanceCount}`);
  console.log(`  * Current Load: ${metrics.scaling.currentLoad}%`);

  console.log('- Batching:');
  console.log(`  * Pending Changes: ${metrics.batching.pendingChanges}`);
  console.log(`  * Active Batches: ${metrics.batching.activeBatches}`);
  console.log(`  * Processed Batches: ${metrics.batching.processedBatches}`);

  console.log('- Caching:');
  console.log(`  * Hit Rate: ${(metrics.caching.hitRate * 100).toFixed(2)}%`);
  console.log(`  * Memory Usage: ${Math.round(metrics.caching.memoryUsage / 1024)} KB`);
  console.log(`  * Evictions: ${metrics.caching.evictionCount}`);

  console.log('- System:');
  console.log(`  * Memory Usage: ${Math.round(metrics.system.memoryUsage / 1024 / 1024)} MB`);
  console.log(`  * Uptime: ${Math.round(metrics.system.uptime / 1000)} seconds`);

  // Force optimization if needed
  if (metrics.system.memoryUsage > 100 * 1024 * 1024) {
    // 100MB
    console.log('High memory usage detected, forcing optimization...');
    await performanceService.forceOptimization();
    console.log('Optimization completed');
  }
}

/**
 * Example: Handling High Load Scenarios
 */
async function highLoadExample(performanceService: PerformanceOptimizationService) {
  console.log('\n=== High Load Scenario Example ===');

  // Simulate high-volume file changes
  const promises: Promise<void>[] = [];

  for (let i = 0; i < 100; i++) {
    const change: FileChangeEvent = {
      type: i % 3 === 0 ? 'create' : i % 3 === 1 ? 'update' : 'delete',
      filePath: `/bulk/file-${i}.txt`,
      tenantId: `tenant-${i % 5}`, // 5 different tenants
      timestamp: new Date(),
      checksum: `hash-${i}`,
      metadata: { size: Math.random() * 10000 },
    };

    promises.push(performanceService.processFileChange(change));
  }

  console.log('Processing 100 file changes concurrently...');
  const startTime = Date.now();

  await Promise.all(promises);

  const processingTime = Date.now() - startTime;
  console.log(`Completed in ${processingTime}ms`);

  // Wait for batching to complete
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const finalMetrics = await performanceService.getPerformanceMetrics();
  console.log('Final batching metrics:', {
    processedBatches: finalMetrics.batching.processedBatches,
    pendingChanges: finalMetrics.batching.pendingChanges,
  });
}

/**
 * Main example execution
 */
async function runExamples() {
  console.log('🚀 Performance Optimization Service Examples\n');

  let performanceService: PerformanceOptimizationService | null = null;

  try {
    // Setup
    performanceService = await setupPerformanceOptimization();

    // Run examples
    await processFileChangesExample(performanceService);
    await cachingExample(performanceService);
    await workDistributionExample(performanceService);
    await monitoringExample(performanceService);
    await highLoadExample(performanceService);

    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('❌ Example failed:', error);
  } finally {
    // Cleanup
    if (performanceService) {
      await performanceService.shutdown();
      console.log('🔄 Performance service shutdown complete');
    }
  }
}

// Export for use in other examples
export {
  cachingExample,
  highLoadExample,
  monitoringExample,
  processFileChangesExample,
  runExamples,
  setupPerformanceOptimization,
  workDistributionExample,
};

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples().catch(console.error);
}
