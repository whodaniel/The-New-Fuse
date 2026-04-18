/**
 * ConflictManager Usage Examples
 * 
 * This file demonstrates how to use the ConflictManager service
 * for handling synchronization conflicts in a multi-tenant environment.
 */

import { ConflictManager } from './ConflictManager.js';
import { SyncDatabaseService } from '../database/SyncDatabaseService.js';
import { DrizzleClient } from '@the-new-fuse/database/generated/drizzle';
import { TenantSyncContext } from '../types/index.js';

// Example setup
async function setupConflictManager() {
  const drizzle = new DrizzleClient();
  const syncDb = new SyncDatabaseService(drizzle);
  const conflictManager = new ConflictManager(drizzle, syncDb);

  return { conflictManager, drizzle, syncDb };
}

/**
 * Example 1: Detecting conflicts during agent synchronization
 */
async function detectAgentConflictExample() {
  const { conflictManager } = await setupConflictManager();

  // Simulate local and remote agent versions
  const localAgentVersion = {
    version: 1,
    name: 'My Agent',
    config: {
      temperature: 0.7,
      maxTokens: 1000,
    },
    lastModified: '2024-01-15T10:00:00Z',
  };

  const remoteAgentVersion = {
    version: 2,
    name: 'My Agent Updated',
    config: {
      temperature: 0.8,
      maxTokens: 1500,
    },
    lastModified: '2024-01-15T11:00:00Z',
  };

  try {
    // Detect conflict
    const conflict = await conflictManager.detectConflict(
      'agent',
      'agent-123',
      localAgentVersion,
      remoteAgentVersion,
      'tenant-456'
    );

    if (conflict) {
      console.log('Conflict detected:', {
        id: conflict.id,
        type: conflict.conflictType,
        resourceType: conflict.resourceType,
        resourceId: conflict.resourceId,
      });

      // Auto-resolve or escalate to manual resolution
      if (conflict.conflictType === 'version') {
        const resolution = await conflictManager.resolveConflict(
          conflict.id,
          'latest_wins',
          'system-auto-resolver'
        );
        console.log('Conflict auto-resolved:', resolution.strategy);
      }
    } else {
      console.log('No conflict detected');
    }
  } catch (error) {
    console.error('Error detecting conflict:', error);
  }
}

/**
 * Example 2: Manual conflict resolution with context
 */
async function manualConflictResolutionExample() {
  const { conflictManager } = await setupConflictManager();

  const tenantContext: TenantSyncContext = {
    tenantId: 'tenant-789',
    userId: 'user-123',
    permissions: ['read', 'write', 'resolve_conflicts'],
    isolationLevel: 'controlled',
  };

  try {
    // Get pending conflicts for the tenant
    const pendingConflicts = await conflictManager.getPendingConflicts('tenant-789');
    
    console.log(`Found ${pendingConflicts.length} pending conflicts`);

    for (const conflict of pendingConflicts) {
      console.log(`Processing conflict ${conflict.id}:`);
      console.log(`  Resource: ${conflict.resourceType}:${conflict.resourceId}`);
      console.log(`  Type: ${conflict.conflictType}`);
      console.log(`  Created: ${conflict.createdAt}`);

      // Determine resolution strategy based on conflict type
      let strategy: 'latest_wins' | 'merge' | 'rollback' | 'manual';

      switch (conflict.conflictType) {
        case 'version':
          strategy = 'latest_wins';
          break;
        case 'checksum':
          strategy = 'merge';
          break;
        case 'concurrent':
          strategy = 'manual';
          break;
        default:
          strategy = 'manual';
      }

      if (strategy !== 'manual') {
        try {
          const resolution = await conflictManager.resolveConflict(
            conflict.id,
            strategy,
            tenantContext.userId!,
            tenantContext
          );

          console.log(`  Resolved with strategy: ${resolution.strategy}`);
        } catch (error) {
          console.error(`  Failed to resolve: ${error.message}`);
        }
      } else {
        console.log('  Requires manual intervention');
      }
    }
  } catch (error) {
    console.error('Error in manual conflict resolution:', error);
  }
}

/**
 * Example 3: Batch auto-resolution of conflicts
 */
async function batchAutoResolutionExample() {
  const { conflictManager } = await setupConflictManager();

  try {
    // Auto-resolve conflicts for all tenants
    const globalResolved = await conflictManager.autoResolveConflicts();
    console.log(`Auto-resolved ${globalResolved} conflicts globally`);

    // Auto-resolve conflicts for specific tenant
    const tenantResolved = await conflictManager.autoResolveConflicts('tenant-123');
    console.log(`Auto-resolved ${tenantResolved} conflicts for tenant-123`);

    // Get statistics after resolution
    const stats = await conflictManager.getConflictStatistics('tenant-123');
    console.log('Conflict statistics:', {
      total: stats.totalSyncStates,
      pending: stats.pendingConflicts,
      resolved: stats.resolvedConflicts,
      conflictRate: `${(stats.conflictRate * 100).toFixed(2)}%`,
    });
  } catch (error) {
    console.error('Error in batch auto-resolution:', error);
  }
}

/**
 * Example 4: Monitoring and maintenance
 */
async function monitoringAndMaintenanceExample() {
  const { conflictManager } = await setupConflictManager();

  try {
    // Get conflict statistics for monitoring
    const globalStats = await conflictManager.getConflictStatistics();
    console.log('Global conflict statistics:', globalStats);

    // Get tenant-specific statistics
    const tenantStats = await conflictManager.getConflictStatistics('tenant-456');
    console.log('Tenant conflict statistics:', tenantStats);

    // Clean up old resolved conflicts (older than 30 days)
    const cleanedUp = await conflictManager.cleanupResolvedConflicts(30);
    console.log(`Cleaned up ${cleanedUp} old resolved conflicts`);

    // Get resource-specific conflicts for debugging
    const agentConflicts = await conflictManager.getResourceConflicts(
      'agent',
      'problematic-agent-id',
      'tenant-456'
    );
    console.log(`Found ${agentConflicts.length} conflicts for specific agent`);

  } catch (error) {
    console.error('Error in monitoring and maintenance:', error);
  }
}

/**
 * Example 5: Error handling and recovery
 */
async function errorHandlingExample() {
  const { conflictManager } = await setupConflictManager();

  // Listen to error events
  conflictManager.on('error', (error, context) => {
    console.error('Conflict manager error:', {
      code: error.code,
      message: error.message,
      severity: error.severity,
      retryable: error.retryable,
      context,
    });
  });

  // Listen to recovery events
  conflictManager.on('recoverySuccess', (event) => {
    console.log('Recovery successful:', {
      strategy: event.strategy,
      attempts: event.attempts,
      duration: event.duration,
    });
  });

  conflictManager.on('recoveryFailure', (event) => {
    console.error('Recovery failed:', {
      attempts: event.attempts,
      duration: event.duration,
      lastError: event.lastError?.message,
    });
  });

  // Simulate error scenarios
  try {
    // This might fail due to database connectivity issues
    await conflictManager.detectConflict(
      'agent',
      'test-agent',
      { version: 1 },
      { version: 2 }
    );
  } catch (error) {
    console.log('Handled error gracefully:', error.message);
  }
}

/**
 * Example 6: Integration with existing workflow
 */
async function workflowIntegrationExample() {
  const { conflictManager } = await setupConflictManager();

  // Simulate a typical sync workflow
  async function syncAgentConfiguration(
    agentId: string,
    localConfig: any,
    remoteConfig: any,
    tenantId: string
  ) {
    try {
      // Step 1: Detect conflicts
      const conflict = await conflictManager.detectConflict(
        'agent',
        agentId,
        localConfig,
        remoteConfig,
        tenantId
      );

      if (!conflict) {
        console.log('No conflicts, proceeding with sync');
        return { success: true, data: remoteConfig };
      }

      // Step 2: Attempt auto-resolution
      console.log(`Conflict detected: ${conflict.conflictType}`);
      
      if (conflict.conflictType === 'version') {
        const resolution = await conflictManager.resolveConflict(
          conflict.id,
          'latest_wins',
          'sync-service'
        );
        
        console.log('Auto-resolved conflict');
        return { success: true, data: resolution.resolvedData };
      }

      // Step 3: Escalate to manual resolution
      console.log('Conflict requires manual resolution');
      return { 
        success: false, 
        conflict: conflict.id,
        message: 'Manual resolution required'
      };

    } catch (error) {
      console.error('Sync workflow error:', error);
      return { success: false, error: error.message };
    }
  }

  // Example usage
  const result = await syncAgentConfiguration(
    'agent-789',
    { version: 1, config: { temp: 0.7 } },
    { version: 2, config: { temp: 0.8 } },
    'tenant-123'
  );

  console.log('Sync result:', result);
}

/**
 * Example 7: Custom conflict resolution strategies
 */
async function customResolutionExample() {
  const { conflictManager } = await setupConflictManager();

  // Example of implementing custom resolution logic
  async function resolveTemplateConflict(conflictId: string) {
    try {
      // Get the conflict details
      const conflicts = await conflictManager.getResourceConflicts('template', 'template-123');
      const conflict = conflicts.find(c => c.id === conflictId);

      if (!conflict) {
        throw new Error('Conflict not found');
      }

      // Custom logic for template conflicts
      const localVersion = conflict.localVersion as any;
      const remoteVersion = conflict.remoteVersion as any;

      // If both versions have the same template structure but different content,
      // prefer the one with more recent timestamp
      if (localVersion.structure === remoteVersion.structure) {
        const localTime = new Date(localVersion.lastModified);
        const remoteTime = new Date(remoteVersion.lastModified);
        
        const strategy = remoteTime > localTime ? 'latest_wins' : 'rollback';
        
        const resolution = await conflictManager.resolveConflict(
          conflictId,
          strategy,
          'template-resolver'
        );

        console.log(`Template conflict resolved with ${strategy} strategy`);
        return resolution;
      }

      // For structural changes, require manual resolution
      console.log('Template structure conflict requires manual resolution');
      throw new Error('Manual resolution required for structural changes');

    } catch (error) {
      console.error('Custom resolution failed:', error);
      throw error;
    }
  }

  // Example usage
  try {
    await resolveTemplateConflict('conflict-template-123');
  } catch (error) {
    console.log('Custom resolution example completed with expected error');
  }
}

// Export examples for testing and documentation
export {
  detectAgentConflictExample,
  manualConflictResolutionExample,
  batchAutoResolutionExample,
  monitoringAndMaintenanceExample,
  errorHandlingExample,
  workflowIntegrationExample,
  customResolutionExample,
};

// Run examples if this file is executed directly
if (require.main === module) {
  async function runExamples() {
    console.log('=== ConflictManager Examples ===\n');

    console.log('1. Detecting Agent Conflicts:');
    await detectAgentConflictExample();
    console.log('\n');

    console.log('2. Manual Conflict Resolution:');
    await manualConflictResolutionExample();
    console.log('\n');

    console.log('3. Batch Auto-Resolution:');
    await batchAutoResolutionExample();
    console.log('\n');

    console.log('4. Monitoring and Maintenance:');
    await monitoringAndMaintenanceExample();
    console.log('\n');

    console.log('5. Error Handling:');
    await errorHandlingExample();
    console.log('\n');

    console.log('6. Workflow Integration:');
    await workflowIntegrationExample();
    console.log('\n');

    console.log('7. Custom Resolution:');
    await customResolutionExample();
    console.log('\n');

    console.log('=== Examples Complete ===');
  }

  runExamples().catch(console.error);
}