/**
 * Sync-Aware Messaging System Usage Examples
 * 
 * This file demonstrates how to use the enhanced agent communication
 * with sync-aware messaging capabilities, integrating with existing
 * AgentWebSocketService and Redis infrastructure.
 */

import {
  SyncAwareMessagingService,
  SyncAwareA2AMessage,
  SyncAwareMessageUtils,
  CrossTenantRoutingConfig,
  MessageQueueSyncConfig,
  MessageFailoverConfig,
  CommunicationNode
} from './index.js';

// Example: Basic sync-aware message sending
export async function basicMessageSending(
  messagingService: SyncAwareMessagingService
) {
  console.log('=== Basic Sync-Aware Message Sending ===');

  // Create a sync-aware message from existing A2A message
  const basicMessage: SyncAwareA2AMessage = {
    id: 'msg-001',
    type: 'TASK_REQUEST',
    timestamp: Date.now(),
    sender: 'agent-orchestrator',
    recipient: 'worker-agent-1',
    payload: {
      taskId: 'task-123',
      action: 'process_document',
      parameters: {
        documentId: 'doc-456',
        priority: 'high'
      }
    },
    metadata: {
      priority: 'high',
      protocol_version: '1.0',
      sync: SyncAwareMessageUtils.createSyncMetadata({
        tenantId: 'tenant-acme-corp',
        crossTenantAllowed: false,
        priority: 'high',
        requiresAck: true,
        conflictResolution: 'latest_wins'
      })
    }
  };

  try {
    const syncStatus = await messagingService.sendMessage(
      'worker-agent-1',
      basicMessage,
      {
        tenantId: 'tenant-acme-corp',
        priority: 'high',
        requiresAck: true,
        timeout: 30000
      }
    );

    console.log('Message sent successfully:', {
      messageId: syncStatus.messageId,
      status: syncStatus.status,
      deliveredTo: syncStatus.deliveredTo
    });

    // Check message status
    const status = await messagingService.getMessageStatus(syncStatus.messageId);
    console.log('Current message status:', status);

  } catch (error) {
    console.error('Failed to send message:', error);
  }
}

// Example: Cross-tenant messaging setup and usage
export async function crossTenantMessaging(
  messagingService: SyncAwareMessagingService
) {
  console.log('=== Cross-Tenant Messaging ===');

  // Configure cross-tenant routing
  const crossTenantConfig: CrossTenantRoutingConfig = {
    sourceTenantId: 'tenant-acme-corp',
    targetTenantIds: ['tenant-beta-inc', 'tenant-gamma-llc'],
    routingRules: [
      {
        condition: 'always', // Simple condition - can be enhanced with JSONPath
        action: 'allow'
      },
      {
        condition: 'message.type === "URGENT_ALERT"',
        action: 'allow'
      },
      {
        condition: 'message.payload.confidential === true',
        action: 'deny'
      }
    ],
    securityPolicy: {
      requireEncryption: true,
      allowedMessageTypes: ['TASK_REQUEST', 'STATUS_UPDATE', 'URGENT_ALERT'],
      maxMessageSize: 1024 * 1024, // 1MB
      rateLimiting: {
        maxMessagesPerSecond: 10,
        maxMessagesPerMinute: 100
      }
    }
  };

  await messagingService.configureCrossTenantMessaging(crossTenantConfig);

  // Create cross-tenant message
  const crossTenantMessage: SyncAwareA2AMessage = {
    id: 'cross-msg-001',
    type: 'STATUS_UPDATE',
    timestamp: Date.now(),
    sender: 'acme-monitoring-agent',
    payload: {
      systemStatus: 'operational',
      metrics: {
        uptime: '99.9%',
        responseTime: '150ms'
      }
    },
    metadata: {
      priority: 'medium',
      protocol_version: '1.0',
      sync: SyncAwareMessageUtils.createSyncMetadata({
        tenantId: 'tenant-acme-corp',
        crossTenantAllowed: true,
        priority: 'medium',
        routingKey: 'status-updates'
      })
    }
  };

  try {
    const results = await messagingService.broadcastMessage(crossTenantMessage, {
      tenantIds: ['tenant-beta-inc', 'tenant-gamma-llc'],
      crossTenant: true,
      priority: 'medium'
    });

    console.log('Cross-tenant broadcast results:');
    Object.entries(results).forEach(([tenantId, statuses]) => {
      console.log(`  ${tenantId}: ${statuses.length} messages delivered`);
    });

  } catch (error) {
    console.error('Cross-tenant messaging failed:', error);
  }
}

// Example: Message queue synchronization
export async function messageQueueSynchronization(
  messagingService: SyncAwareMessagingService
) {
  console.log('=== Message Queue Synchronization ===');

  // Configure queue synchronization for high-priority messages
  const highPriorityQueueConfig: MessageQueueSyncConfig = {
    queueName: 'high-priority-tasks',
    tenantId: 'tenant-acme-corp',
    syncMode: 'immediate', // Sync immediately for high priority
    conflictResolution: 'latest_wins',
    retentionPolicy: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      maxSize: 1000,
      cleanupInterval: 60 * 60 * 1000 // 1 hour
    }
  };

  // Configure batch synchronization for regular messages
  const regularQueueConfig: MessageQueueSyncConfig = {
    queueName: 'regular-tasks',
    tenantId: 'tenant-acme-corp',
    syncMode: 'batch',
    batchSize: 50,
    batchTimeout: 5000, // 5 seconds
    conflictResolution: 'merge',
    retentionPolicy: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      maxSize: 10000,
      cleanupInterval: 4 * 60 * 60 * 1000 // 4 hours
    }
  };

  await messagingService.configureQueueSynchronization(highPriorityQueueConfig);
  await messagingService.configureQueueSynchronization(regularQueueConfig);

  // Trigger manual synchronization
  await messagingService.synchronizeQueues('tenant-acme-corp');

  // Get synchronization metrics
  const queueMetrics = messagingService.getQueueSyncMetrics();
  console.log('Queue synchronization metrics:', {
    totalQueues: queueMetrics.totalQueues,
    syncedMessages: queueMetrics.syncedMessages,
    conflictCount: queueMetrics.conflictCount,
    averageSyncTime: queueMetrics.averageSyncTime
  });
}

// Example: Failover mechanism setup and usage
export async function failoverMechanisms(
  messagingService: SyncAwareMessagingService
) {
  console.log('=== Failover Mechanisms ===');

  // Configure failover for critical tenant
  const failoverConfig: MessageFailoverConfig = {
    primaryNodes: ['primary-hub-1', 'primary-hub-2'],
    fallbackNodes: ['fallback-hub-1', 'fallback-hub-2'],
    healthCheckInterval: 30000, // 30 seconds
    failoverThreshold: 3, // Fail after 3 consecutive failures
    recoveryThreshold: 5, // Recover after 5 consecutive successes
    circuitBreakerConfig: {
      enabled: true,
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      halfOpenMaxCalls: 3
    }
  };

  await messagingService.configureFailover('tenant-acme-corp', failoverConfig);

  // Create critical message that requires failover protection
  const criticalMessage: SyncAwareA2AMessage = {
    id: 'critical-msg-001',
    type: 'URGENT_ALERT',
    timestamp: Date.now(),
    sender: 'system-monitor',
    payload: {
      alertType: 'SYSTEM_FAILURE',
      severity: 'critical',
      affectedSystems: ['payment-processor', 'user-auth'],
      estimatedDowntime: '15 minutes'
    },
    metadata: {
      priority: 'critical',
      protocol_version: '1.0',
      sync: SyncAwareMessageUtils.createSyncMetadata({
        tenantId: 'tenant-acme-corp',
        priority: 'critical',
        maxRetries: 5,
        failoverNodes: ['fallback-hub-1', 'fallback-hub-2'],
        deadLetterQueue: 'critical-alerts-dlq'
      })
    }
  };

  try {
    const syncStatus = await messagingService.sendMessage(
      'incident-response-agent',
      criticalMessage,
      {
        tenantId: 'tenant-acme-corp',
        enableFailover: true,
        priority: 'critical'
      }
    );

    console.log('Critical message sent with failover protection:', syncStatus);

    // Get failover statistics
    const failoverStats = messagingService.getFailoverStats();
    console.log('Failover statistics:', {
      totalNodes: failoverStats.totalNodes,
      healthyNodes: failoverStats.healthyNodes,
      failedNodes: failoverStats.failedNodes,
      circuitBreakersOpen: failoverStats.circuitBreakersOpen
    });

  } catch (error) {
    console.error('Critical message delivery failed:', error);
  }
}

// Example: Advanced message broadcasting with filtering
export async function advancedBroadcasting(
  messagingService: SyncAwareMessagingService
) {
  console.log('=== Advanced Message Broadcasting ===');

  // Create system-wide announcement
  const announcementMessage: SyncAwareA2AMessage = {
    id: 'announcement-001',
    type: 'SYSTEM_ANNOUNCEMENT',
    timestamp: Date.now(),
    sender: 'system-admin',
    payload: {
      title: 'Scheduled Maintenance Window',
      message: 'System maintenance scheduled for tonight 2:00 AM - 4:00 AM UTC',
      maintenanceWindow: {
        start: '2024-01-15T02:00:00Z',
        end: '2024-01-15T04:00:00Z',
        affectedServices: ['api', 'dashboard', 'reports']
      },
      actionRequired: false
    },
    metadata: {
      priority: 'medium',
      protocol_version: '1.0',
      sync: SyncAwareMessageUtils.createSyncMetadata({
        crossTenantAllowed: true,
        priority: 'medium',
        deliveryMode: 'broadcast',
        requiresAck: false
      })
    }
  };

  try {
    // Broadcast to all tenants except maintenance tenant
    const results = await messagingService.broadcastMessage(announcementMessage, {
      tenantIds: ['tenant-acme-corp', 'tenant-beta-inc', 'tenant-gamma-llc'],
      excludeAgents: ['maintenance-agent', 'system-monitor'],
      crossTenant: true,
      priority: 'medium'
    });

    console.log('System announcement broadcast results:');
    let totalDelivered = 0;
    Object.entries(results).forEach(([tenantId, statuses]) => {
      const delivered = statuses.filter(s => s.status === 'delivered').length;
      totalDelivered += delivered;
      console.log(`  ${tenantId}: ${delivered}/${statuses.length} delivered`);
    });

    console.log(`Total messages delivered: ${totalDelivered}`);

  } catch (error) {
    console.error('Broadcast failed:', error);
  }
}

// Example: Monitoring and metrics collection
export async function monitoringAndMetrics(
  messagingService: SyncAwareMessagingService
) {
  console.log('=== Monitoring and Metrics ===');

  // Get comprehensive messaging metrics
  const messagingMetrics = messagingService.getMessagingMetrics();
  console.log('Messaging Metrics:', {
    totalMessages: messagingMetrics.totalMessages,
    successRate: (messagingMetrics.successfulDeliveries / messagingMetrics.totalMessages * 100).toFixed(2) + '%',
    averageDeliveryTime: messagingMetrics.averageDeliveryTime + 'ms',
    crossTenantMessages: messagingMetrics.crossTenantMessages,
    activeConnections: messagingMetrics.activeConnections
  });

  // Get failover statistics
  const failoverStats = messagingService.getFailoverStats();
  console.log('Failover Statistics:', failoverStats);

  // Get queue synchronization metrics
  const queueMetrics = messagingService.getQueueSyncMetrics();
  console.log('Queue Sync Metrics:', queueMetrics);

  // Example: Check specific message status
  const messageId = 'msg-001';
  const messageStatus = await messagingService.getMessageStatus(messageId);
  if (messageStatus) {
    console.log(`Message ${messageId} status:`, {
      status: messageStatus.status,
      deliveredTo: messageStatus.deliveredTo,
      acknowledgedBy: messageStatus.acknowledgedBy,
      age: Date.now() - messageStatus.createdAt + 'ms'
    });
  }

  // Example: Get detailed delivery metrics
  const deliveryMetrics = await messagingService.getMessageMetrics(messageId);
  if (deliveryMetrics) {
    console.log(`Message ${messageId} delivery metrics:`, {
      deliveryAttempts: deliveryMetrics.deliveryAttempts,
      successfulDeliveries: deliveryMetrics.successfulDeliveries,
      averageDeliveryTime: deliveryMetrics.averageDeliveryTime + 'ms',
      routingPath: deliveryMetrics.routingPath
    });
  }
}

// Example: Error handling and recovery
export async function errorHandlingAndRecovery(
  messagingService: SyncAwareMessagingService
) {
  console.log('=== Error Handling and Recovery ===');

  const problematicMessage: SyncAwareA2AMessage = {
    id: 'problem-msg-001',
    type: 'TEST_FAILURE',
    timestamp: Date.now(),
    sender: 'test-agent',
    payload: {
      simulateFailure: true,
      failureType: 'network_timeout'
    },
    metadata: {
      priority: 'low',
      protocol_version: '1.0',
      sync: SyncAwareMessageUtils.createSyncMetadata({
        tenantId: 'tenant-test',
        maxRetries: 3,
        priority: 'low'
      })
    }
  };

  try {
    const syncStatus = await messagingService.sendMessage(
      'unreliable-agent',
      problematicMessage,
      {
        tenantId: 'tenant-test',
        timeout: 5000 // Short timeout to trigger failure
      }
    );

    console.log('Message sent (unexpectedly succeeded):', syncStatus);

  } catch (error) {
    console.log('Expected failure occurred:', error.message);

    // Check metrics to see failure recorded
    const metrics = messagingService.getMessagingMetrics();
    console.log('Failure recorded in metrics:', {
      failedDeliveries: metrics.failedDeliveries,
      successRate: (metrics.successfulDeliveries / metrics.totalMessages * 100).toFixed(2) + '%'
    });
  }

  // Example: Manual failover trigger
  try {
    await messagingService.triggerFailover(
      'tenant-test',
      'unreliable-node',
      'backup-node'
    );
    console.log('Manual failover triggered successfully');

  } catch (error) {
    console.log('Failover trigger failed:', error.message);
  }
}

// Example: Complete integration workflow
export async function completeIntegrationWorkflow(
  messagingService: SyncAwareMessagingService
) {
  console.log('=== Complete Integration Workflow ===');

  try {
    // 1. Setup configurations
    console.log('1. Setting up configurations...');
    await crossTenantMessaging(messagingService);
    await messageQueueSynchronization(messagingService);
    await failoverMechanisms(messagingService);

    // 2. Send various types of messages
    console.log('2. Sending various message types...');
    await basicMessageSending(messagingService);
    await advancedBroadcasting(messagingService);

    // 3. Monitor and collect metrics
    console.log('3. Collecting metrics and monitoring...');
    await monitoringAndMetrics(messagingService);

    // 4. Test error scenarios
    console.log('4. Testing error handling...');
    await errorHandlingAndRecovery(messagingService);

    console.log('=== Integration workflow completed successfully ===');

  } catch (error) {
    console.error('Integration workflow failed:', error);
  }
}

// Utility function to create sample messages for testing
export function createSampleMessages(): SyncAwareA2AMessage[] {
  return [
    {
      id: 'sample-1',
      type: 'WORKFLOW_START',
      timestamp: Date.now(),
      sender: 'workflow-engine',
      payload: { workflowId: 'wf-001', steps: ['validate', 'process', 'notify'] },
      metadata: {
        priority: 'high',
        protocol_version: '1.0',
        sync: SyncAwareMessageUtils.createSyncMetadata({
          tenantId: 'tenant-sample',
          priority: 'high',
          requiresAck: true
        })
      }
    },
    {
      id: 'sample-2',
      type: 'DATA_SYNC',
      timestamp: Date.now(),
      sender: 'data-sync-agent',
      payload: { 
        syncType: 'incremental',
        tables: ['users', 'orders'],
        lastSyncTime: Date.now() - 3600000
      },
      metadata: {
        priority: 'medium',
        protocol_version: '1.0',
        sync: SyncAwareMessageUtils.createSyncMetadata({
          tenantId: 'tenant-sample',
          priority: 'medium',
          conflictResolution: 'merge'
        })
      }
    },
    {
      id: 'sample-3',
      type: 'HEALTH_CHECK',
      timestamp: Date.now(),
      sender: 'health-monitor',
      payload: { 
        services: ['api', 'database', 'cache'],
        checkType: 'comprehensive'
      },
      metadata: {
        priority: 'low',
        protocol_version: '1.0',
        sync: SyncAwareMessageUtils.createSyncMetadata({
          crossTenantAllowed: true,
          priority: 'low',
          deliveryMode: 'broadcast'
        })
      }
    }
  ];
}

// Export all examples for easy testing
export const examples = {
  basicMessageSending,
  crossTenantMessaging,
  messageQueueSynchronization,
  failoverMechanisms,
  advancedBroadcasting,
  monitoringAndMetrics,
  errorHandlingAndRecovery,
  completeIntegrationWorkflow,
  createSampleMessages
};