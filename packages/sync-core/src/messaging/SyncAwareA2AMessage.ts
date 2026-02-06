import { A2AMessage, A2AMessageV1, A2AMessageV2 } from '../../../src/protocols/types.js';

/**
 * Sync metadata for A2A messages
 * Extends existing A2A message protocols with synchronization information
 */
export interface SyncMetadata {
  // Synchronization identifiers
  syncId: string;
  syncVersion: number;
  syncTimestamp: number;

  // Tenant isolation
  tenantId?: string;
  crossTenantAllowed: boolean;

  // Message routing and delivery
  routingKey: string;
  deliveryMode: 'direct' | 'broadcast' | 'multicast';
  requiresAck: boolean;

  // Conflict resolution
  conflictResolution: 'latest_wins' | 'merge' | 'manual' | 'rollback';
  checksumValidation: boolean;

  // Failover and reliability
  maxRetries: number;
  retryCount: number;
  failoverNodes?: string[];
  deadLetterQueue?: string;

  // Performance and monitoring
  priority: 'low' | 'medium' | 'high' | 'critical';
  traceId?: string;
  parentSpanId?: string;

  // Synchronization state
  syncState: 'pending' | 'in_progress' | 'completed' | 'failed' | 'conflicted';
  lastSyncAttempt?: number;
  syncErrors?: string[];
}

/**
 * Enhanced A2A Message V1 with sync metadata
 */
export interface SyncAwareA2AMessageV1 extends A2AMessageV1 {
  metadata: A2AMessageV1['metadata'] & {
    sync: SyncMetadata;
  };
}

/**
 * Enhanced A2A Message V2 with sync metadata
 */
export interface SyncAwareA2AMessageV2 extends A2AMessageV2 {
  header: A2AMessageV2['header'] & {
    syncId: string;
    tenantId?: string;
    crossTenantAllowed: boolean;
  };
  body: A2AMessageV2['body'] & {
    metadata: A2AMessageV2['body']['metadata'] & {
      sync: SyncMetadata;
    };
  };
}

/**
 * Union type for sync-aware A2A messages
 */
export type SyncAwareA2AMessage = SyncAwareA2AMessageV1 | SyncAwareA2AMessageV2;

/**
 * Message synchronization status
 */
export interface MessageSyncStatus {
  messageId: string;
  syncId: string;
  status: 'queued' | 'delivered' | 'acknowledged' | 'failed' | 'expired';
  deliveredTo: string[];
  failedDeliveries: Array<{
    target: string;
    error: string;
    timestamp: number;
    retryCount: number;
  }>;
  acknowledgedBy: string[];
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
}

/**
 * Cross-tenant message routing configuration
 */
export interface CrossTenantRoutingConfig {
  sourceTenantId: string;
  targetTenantIds: string[];
  routingRules: Array<{
    condition: string; // JSONPath expression
    action: 'allow' | 'deny' | 'transform';
    transformation?: string; // Transformation function name
  }>;
  securityPolicy: {
    requireEncryption: boolean;
    allowedMessageTypes: string[];
    maxMessageSize: number;
    rateLimiting: {
      maxMessagesPerSecond: number;
      maxMessagesPerMinute: number;
    };
  };
}

/**
 * Message queue synchronization configuration
 */
export interface MessageQueueSyncConfig {
  queueName: string;
  tenantId?: string;
  syncMode: 'immediate' | 'batch' | 'scheduled';
  batchSize?: number;
  batchTimeout?: number;
  scheduleCron?: string;
  conflictResolution: 'latest_wins' | 'merge' | 'manual';
  retentionPolicy: {
    maxAge: number; // milliseconds
    maxSize: number; // number of messages
    cleanupInterval: number; // milliseconds
  };
}

/**
 * Failover configuration for message delivery
 */
export interface MessageFailoverConfig {
  primaryNodes: string[];
  fallbackNodes: string[];
  healthCheckInterval: number;
  failoverThreshold: number; // number of consecutive failures
  recoveryThreshold: number; // number of consecutive successes
  circuitBreakerConfig: {
    enabled: boolean;
    failureThreshold: number;
    recoveryTimeout: number;
    halfOpenMaxCalls: number;
  };
}

/**
 * Message delivery metrics
 */
export interface MessageDeliveryMetrics {
  messageId: string;
  syncId: string;
  tenantId?: string;
  messageType: string;
  deliveryAttempts: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageDeliveryTime: number;
  maxDeliveryTime: number;
  minDeliveryTime: number;
  deliveryStartTime: number;
  deliveryEndTime?: number;
  errorCodes: Record<string, number>;
  routingPath: string[];
}

/**
 * Utility functions for sync-aware messaging
 */
export class SyncAwareMessageUtils {
  /**
   * Create sync metadata for a message
   */
  static createSyncMetadata(options: Partial<SyncMetadata> = {}): SyncMetadata {
    return {
      syncId: options.syncId || this.generateSyncId(),
      syncVersion: options.syncVersion || 1,
      syncTimestamp: options.syncTimestamp || Date.now(),
      tenantId: options.tenantId,
      crossTenantAllowed: options.crossTenantAllowed || false,
      routingKey: options.routingKey || 'default',
      deliveryMode: options.deliveryMode || 'direct',
      requiresAck: options.requiresAck || false,
      conflictResolution: options.conflictResolution || 'latest_wins',
      checksumValidation: options.checksumValidation || true,
      maxRetries: options.maxRetries || 3,
      retryCount: options.retryCount || 0,
      failoverNodes: options.failoverNodes || [],
      priority: options.priority || 'medium',
      syncState: options.syncState || 'pending',
      syncErrors: options.syncErrors || [],
      ...options,
    };
  }

  /**
   * Convert existing A2A message to sync-aware message
   */
  static toSyncAware(
    message: A2AMessage,
    syncOptions: Partial<SyncMetadata> = {}
  ): SyncAwareA2AMessage {
    const syncMetadata = this.createSyncMetadata(syncOptions);

    if ('header' in message) {
      // A2AMessageV2
      return {
        ...message,
        header: {
          ...message.header,
          syncId: syncMetadata.syncId,
          tenantId: syncMetadata.tenantId,
          crossTenantAllowed: syncMetadata.crossTenantAllowed,
        },
        body: {
          ...message.body,
          metadata: {
            ...message.body.metadata,
            sync: syncMetadata,
          },
        },
      } as SyncAwareA2AMessageV2;
    } else {
      // A2AMessageV1
      return {
        ...message,
        metadata: {
          ...message.metadata,
          sync: syncMetadata,
        },
      } as SyncAwareA2AMessageV1;
    }
  }

  /**
   * Extract sync metadata from sync-aware message
   */
  static extractSyncMetadata(message: SyncAwareA2AMessage): SyncMetadata {
    if ('header' in message) {
      return message.body.metadata.sync;
    } else {
      return message.metadata.sync;
    }
  }

  /**
   * Check if message allows cross-tenant delivery
   */
  static allowsCrossTenant(message: SyncAwareA2AMessage): boolean {
    const syncMetadata = this.extractSyncMetadata(message);
    return syncMetadata.crossTenantAllowed;
  }

  /**
   * Get tenant ID from message
   */
  static getTenantId(message: SyncAwareA2AMessage): string | undefined {
    const syncMetadata = this.extractSyncMetadata(message);
    return syncMetadata.tenantId;
  }

  /**
   * Calculate message checksum for conflict detection
   */
  static calculateChecksum(message: SyncAwareA2AMessage): string {
    // Create a stable string representation for checksum calculation
    const payload = 'header' in message ? message.body.content : message.payload;
    const str = JSON.stringify(payload, Object.keys(payload).sort());

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Generate unique sync ID
   */
  static generateSyncId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate trace ID for distributed tracing
   */
  static generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
  }

  /**
   * Validate message structure
   */
  static validateMessage(message: SyncAwareA2AMessage): boolean {
    try {
      const syncMetadata = this.extractSyncMetadata(message);

      // Basic validation
      if (!syncMetadata.syncId || !syncMetadata.syncTimestamp) {
        return false;
      }

      // Tenant validation
      if (syncMetadata.tenantId && !this.isValidTenantId(syncMetadata.tenantId)) {
        return false;
      }

      // Priority validation
      const validPriorities = ['low', 'medium', 'high', 'critical'];
      if (!validPriorities.includes(syncMetadata.priority)) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate tenant ID format
   */
  private static isValidTenantId(tenantId: string): boolean {
    const tenantIdRegex = /^[a-zA-Z0-9_-]+$/;
    return tenantIdRegex.test(tenantId) && tenantId.length <= 64;
  }
}
