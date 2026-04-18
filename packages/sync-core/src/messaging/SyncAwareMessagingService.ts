import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { SyncRedisConfig } from '../config/SyncRedisConfig.js';
import { SyncAwareAgentWebSocketService, IAgentWebSocketService } from './SyncAwareAgentWebSocketService.js';
import { MessageQueueSynchronizer } from './MessageQueueSynchronizer.js';
import { CommunicationHubFailover } from './CommunicationHubFailover.js';
import {
  SyncAwareA2AMessage,
  MessageSyncStatus,
  CrossTenantRoutingConfig,
  MessageQueueSyncConfig,
  MessageFailoverConfig,
  MessageDeliveryMetrics,
  SyncAwareMessageUtils
} from './SyncAwareA2AMessage.js';

export interface MessagingServiceConfig {
  enableSyncAwareMessaging: boolean;
  enableCrossTenantMessaging: boolean;
  enableQueueSynchronization: boolean;
  enableFailoverMechanisms: boolean;
  maxConcurrentMessages: number;
  messageTimeout: number;
  retryAttempts: number;
  enableMetrics: boolean;
  enableTracing: boolean;
}

export interface MessagingMetrics {
  totalMessages: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  crossTenantMessages: number;
  queueSyncOperations: number;
  failoverEvents: number;
  averageDeliveryTime: number;
  activeConnections: number;
}

/**
 * Main Sync-Aware Messaging Service
 * Integrates all sync-aware messaging components with existing infrastructure
 */
@Injectable()
export class SyncAwareMessagingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SyncAwareMessagingService.name);
  
  private readonly config: MessagingServiceConfig = {
    enableSyncAwareMessaging: true,
    enableCrossTenantMessaging: true,
    enableQueueSynchronization: true,
    enableFailoverMechanisms: true,
    maxConcurrentMessages: 1000,
    messageTimeout: 30000,
    retryAttempts: 3,
    enableMetrics: true,
    enableTracing: true
  };

  private metrics: MessagingMetrics = {
    totalMessages: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0,
    crossTenantMessages: 0,
    queueSyncOperations: 0,
    failoverEvents: 0,
    averageDeliveryTime: 0,
    activeConnections: 0
  };

  private activeMessages: Map<string, SyncAwareA2AMessage> = new Map();
  private messageTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private readonly redisService: UnifiedRedisService,
    private readonly redisConfig: SyncRedisConfig,
    private readonly syncAwareWebSocket: SyncAwareAgentWebSocketService,
    private readonly queueSynchronizer: MessageQueueSynchronizer,
    private readonly failoverManager: CommunicationHubFailover,
    @Inject('IAgentWebSocketService') private readonly wsService: IAgentWebSocketService
  ) {}

  async onModuleInit(): Promise<void> {
    await this.initializeMessagingInfrastructure();
    this.startMetricsCollection();
    this.startMessageCleanup();
    this.logger.log('SyncAwareMessagingService initialized');
  }

  async onModuleDestroy(): Promise<void> {
    await this.cleanup();
    this.logger.log('SyncAwareMessagingService destroyed');
  }

  /**
   * Send sync-aware message with full feature support
   */
  async sendMessage(
    targetAgentId: string,
    message: SyncAwareA2AMessage,
    options: {
      tenantId?: string;
      allowCrossTenant?: boolean;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      requiresAck?: boolean;
      enableFailover?: boolean;
      timeout?: number;
    } = {}
  ): Promise<MessageSyncStatus> {
    const startTime = Date.now();
    const messageId = 'header' in message ? message.header.id : message.id;
    
    try {
      // Validate and enhance message
      const enhancedMessage = await this.enhanceMessage(message, options);
      
      // Track active message
      this.activeMessages.set(messageId, enhancedMessage);
      
      // Set timeout if specified
      if (options.timeout) {
        const timer = setTimeout(() => {
          this.handleMessageTimeout(messageId);
        }, options.timeout);
        this.messageTimers.set(messageId, timer);
      }

      // Determine delivery strategy
      let syncStatus: MessageSyncStatus;
      
      if (options.enableFailover && options.tenantId) {
        // Use failover-enabled delivery
        const delivered = await this.failoverManager.deliverWithFailover(
          options.tenantId,
          enhancedMessage,
          targetAgentId
        );
        
        syncStatus = {
          messageId,
          syncId: SyncAwareMessageUtils.extractSyncMetadata(enhancedMessage).syncId,
          status: delivered ? 'delivered' : 'failed',
          deliveredTo: delivered ? [targetAgentId] : [],
          failedDeliveries: delivered ? [] : [{
            target: targetAgentId,
            error: 'Failover delivery failed',
            timestamp: Date.now(),
            retryCount: 0
          }],
          acknowledgedBy: [],
          createdAt: startTime,
          updatedAt: Date.now()
        };
      } else {
        // Use standard sync-aware delivery
        syncStatus = await this.syncAwareWebSocket.sendSyncAwareMessage(
          targetAgentId,
          enhancedMessage,
          {
            allowCrossTenant: options.allowCrossTenant,
            priority: options.priority,
            requiresAck: options.requiresAck,
            maxRetries: this.config.retryAttempts
          }
        );
      }

      // Update metrics
      this.updateDeliveryMetrics(startTime, syncStatus.status === 'delivered');
      
      // Track cross-tenant messages
      const syncMetadata = SyncAwareMessageUtils.extractSyncMetadata(enhancedMessage);
      if (syncMetadata.crossTenantAllowed) {
        this.metrics.crossTenantMessages++;
      }

      this.logger.debug(`Sent sync-aware message ${messageId} to agent ${targetAgentId}`);
      return syncStatus;

    } catch (error) {
      this.updateDeliveryMetrics(startTime, false);
      this.logger.error(`Failed to send sync-aware message ${messageId}:`, error);
      throw error;
    } finally {
      // Cleanup
      this.activeMessages.delete(messageId);
      const timer = this.messageTimers.get(messageId);
      if (timer) {
        clearTimeout(timer);
        this.messageTimers.delete(messageId);
      }
    }
  }

  /**
   * Broadcast message to multiple agents with sync awareness
   */
  async broadcastMessage(
    message: SyncAwareA2AMessage,
    options: {
      tenantIds?: string[];
      excludeAgents?: string[];
      crossTenant?: boolean;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      requiresAck?: boolean;
    } = {}
  ): Promise<Record<string, MessageSyncStatus[]>> {
    try {
      const results: Record<string, MessageSyncStatus[]> = {};

      if (options.crossTenant && options.tenantIds) {
        // Cross-tenant broadcast
        const syncMetadata = SyncAwareMessageUtils.extractSyncMetadata(message);
        const sourceTenantId = syncMetadata.tenantId || 'global';
        
        const crossTenantResults = await this.syncAwareWebSocket.broadcastCrossTenant(
          options.tenantIds,
          message,
          {
            sourceTenantId,
            priority: options.priority,
            requiresAck: options.requiresAck
          }
        );
        
        Object.assign(results, crossTenantResults);
        this.metrics.crossTenantMessages += options.tenantIds.length;
      } else if (options.tenantIds) {
        // Single tenant broadcasts
        for (const tenantId of options.tenantIds) {
          const syncStatuses = await this.syncAwareWebSocket.broadcastToTenantSync(
            tenantId,
            message,
            {
              excludeAgents: options.excludeAgents,
              priority: options.priority,
              requiresAck: options.requiresAck
            }
          );
          results[tenantId] = syncStatuses;
        }
      } else {
        // Global broadcast (all connected agents)
        const connectedAgents = await this.wsService.getConnectedAgents();
        const filteredAgents = connectedAgents.filter(agentId => 
          !options.excludeAgents?.includes(agentId)
        );
        
        const syncStatuses: MessageSyncStatus[] = [];
        for (const agentId of filteredAgents) {
          try {
            const syncStatus = await this.sendMessage(agentId, message, {
              priority: options.priority,
              requiresAck: options.requiresAck
            });
            syncStatuses.push(syncStatus);
          } catch (error) {
            this.logger.warn(`Failed to broadcast to agent ${agentId}:`, error);
          }
        }
        results['global'] = syncStatuses;
      }

      this.logger.debug(`Broadcasted message to ${Object.keys(results).length} tenant(s)`);
      return results;

    } catch (error) {
      this.logger.error('Failed to broadcast message:', error);
      throw error;
    }
  }

  /**
   * Configure cross-tenant messaging
   */
  async configureCrossTenantMessaging(config: CrossTenantRoutingConfig): Promise<void> {
    try {
      await this.syncAwareWebSocket.configureCrossTenantRouting(config);
      this.logger.debug(`Configured cross-tenant messaging for tenant ${config.sourceTenantId}`);
    } catch (error) {
      this.logger.error('Failed to configure cross-tenant messaging:', error);
      throw error;
    }
  }

  /**
   * Configure message queue synchronization
   */
  async configureQueueSynchronization(config: MessageQueueSyncConfig): Promise<void> {
    try {
      await this.queueSynchronizer.configureQueueSync(config);
      this.logger.debug(`Configured queue synchronization for ${config.queueName}`);
    } catch (error) {
      this.logger.error('Failed to configure queue synchronization:', error);
      throw error;
    }
  }

  /**
   * Configure failover mechanisms
   */
  async configureFailover(tenantId: string, config: MessageFailoverConfig): Promise<void> {
    try {
      await this.failoverManager.configureFailover(tenantId, config);
      this.logger.debug(`Configured failover for tenant ${tenantId}`);
    } catch (error) {
      this.logger.error('Failed to configure failover:', error);
      throw error;
    }
  }

  /**
   * Synchronize message queues
   */
  async synchronizeQueues(tenantId?: string): Promise<void> {
    try {
      if (tenantId) {
        await this.queueSynchronizer.synchronizeQueue('default', tenantId);
      } else {
        await this.queueSynchronizer.synchronizeAllQueues();
      }
      
      this.metrics.queueSyncOperations++;
      this.logger.debug(`Synchronized message queues for ${tenantId || 'all tenants'}`);
    } catch (error) {
      this.logger.error('Failed to synchronize queues:', error);
      throw error;
    }
  }

  /**
   * Get message synchronization status
   */
  async getMessageStatus(messageId: string): Promise<MessageSyncStatus | null> {
    return await this.syncAwareWebSocket.getMessageSyncStatus(messageId);
  }

  /**
   * Get delivery metrics for a message
   */
  async getMessageMetrics(messageId: string): Promise<MessageDeliveryMetrics | null> {
    return await this.syncAwareWebSocket.getDeliveryMetrics(messageId);
  }

  /**
   * Get overall messaging metrics
   */
  getMessagingMetrics(): MessagingMetrics {
    return { ...this.metrics };
  }

  /**
   * Get failover statistics
   */
  getFailoverStats() {
    return this.failoverManager.getFailoverStats();
  }

  /**
   * Get queue synchronization metrics
   */
  getQueueSyncMetrics() {
    return this.queueSynchronizer.getQueueSyncMetrics();
  }

  /**
   * Trigger manual failover
   */
  async triggerFailover(tenantId: string, fromNodeId: string, toNodeId: string): Promise<void> {
    try {
      await this.failoverManager.triggerManualFailover(tenantId, fromNodeId, toNodeId);
      this.metrics.failoverEvents++;
      this.logger.log(`Triggered manual failover for tenant ${tenantId}`);
    } catch (error) {
      this.logger.error('Failed to trigger failover:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async initializeMessagingInfrastructure(): Promise<void> {
    // Subscribe to Redis channels for coordination
    const keyPatterns = this.redisConfig.getKeyspatterns();
    
    await this.redisService.psubscribe(
      keyPatterns.patterns.channelAll,
      async (message) => {
        await this.handleCoordinationMessage(message);
      }
    );

    // Initialize components if enabled
    if (this.config.enableSyncAwareMessaging) {
      // SyncAwareAgentWebSocketService is already initialized via DI
    }

    if (this.config.enableQueueSynchronization) {
      // MessageQueueSynchronizer is already initialized via DI
    }

    if (this.config.enableFailoverMechanisms) {
      // CommunicationHubFailover is already initialized via DI
    }

    this.logger.debug('Messaging infrastructure initialized');
  }

  private async enhanceMessage(
    message: SyncAwareA2AMessage,
    options: any
  ): Promise<SyncAwareA2AMessage> {
    const syncMetadata = SyncAwareMessageUtils.extractSyncMetadata(message);
    
    // Enhance sync metadata with options
    const enhancedSyncMetadata = {
      ...syncMetadata,
      tenantId: options.tenantId || syncMetadata.tenantId,
      crossTenantAllowed: options.allowCrossTenant || syncMetadata.crossTenantAllowed,
      priority: options.priority || syncMetadata.priority,
      requiresAck: options.requiresAck || syncMetadata.requiresAck,
      maxRetries: this.config.retryAttempts,
      traceId: this.config.enableTracing ? SyncAwareMessageUtils.generateTraceId() : undefined
    };

    return SyncAwareMessageUtils.toSyncAware(message, enhancedSyncMetadata);
  }

  private handleMessageTimeout(messageId: string): void {
    const message = this.activeMessages.get(messageId);
    if (message) {
      this.logger.warn(`Message ${messageId} timed out`);
      this.metrics.failedDeliveries++;
      
      // Clean up
      this.activeMessages.delete(messageId);
      this.messageTimers.delete(messageId);
    }
  }

  private updateDeliveryMetrics(startTime: number, success: boolean): void {
    const deliveryTime = Date.now() - startTime;
    
    this.metrics.totalMessages++;
    if (success) {
      this.metrics.successfulDeliveries++;
    } else {
      this.metrics.failedDeliveries++;
    }

    // Update average delivery time
    const totalDeliveries = this.metrics.successfulDeliveries + this.metrics.failedDeliveries;
    this.metrics.averageDeliveryTime = 
      (this.metrics.averageDeliveryTime * (totalDeliveries - 1) + deliveryTime) / totalDeliveries;
  }

  private async handleCoordinationMessage(message: any): Promise<void> {
    try {
      const data = JSON.parse(message.message);
      
      switch (data.type) {
        case 'sync_request':
          await this.synchronizeQueues(data.tenantId);
          break;
        case 'failover_trigger':
          this.metrics.failoverEvents++;
          break;
        case 'metrics_request':
          await this.publishMetrics();
          break;
        default:
          this.logger.debug(`Unknown coordination message type: ${data.type}`);
      }
    } catch (error) {
      this.logger.warn('Failed to handle coordination message:', error);
    }
  }

  private async publishMetrics(): Promise<void> {
    const keyPatterns = this.redisConfig.getKeyspatterns();
    
    const allMetrics = {
      messaging: this.metrics,
      failover: this.failoverManager.getFailoverStats(),
      queueSync: this.queueSynchronizer.getQueueSyncMetrics(),
      timestamp: Date.now()
    };

    await this.redisService.publish(keyPatterns.channels.metrics, JSON.stringify(allMetrics));
  }

  private startMetricsCollection(): void {
    if (!this.config.enableMetrics) return;

    setInterval(async () => {
      await this.collectMetrics();
    }, 60000); // Collect metrics every minute
  }

  private async collectMetrics(): Promise<void> {
    try {
      // Update active connections count
      const connectedAgents = await this.wsService.getConnectedAgents();
      this.metrics.activeConnections = connectedAgents.length;

      // Publish metrics
      await this.publishMetrics();
      
      this.logger.debug('Collected messaging metrics:', this.metrics);
    } catch (error) {
      this.logger.warn('Failed to collect metrics:', error);
    }
  }

  private startMessageCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredMessages();
    }, 300000); // Cleanup every 5 minutes
  }

  private cleanupExpiredMessages(): void {
    const now = Date.now();
    const expiredMessages: string[] = [];

    for (const [messageId, timer] of this.messageTimers.entries()) {
      // Check if message has been active too long
      if (!this.activeMessages.has(messageId)) {
        clearTimeout(timer);
        expiredMessages.push(messageId);
      }
    }

    // Clean up expired message timers
    for (const messageId of expiredMessages) {
      this.messageTimers.delete(messageId);
    }

    if (expiredMessages.length > 0) {
      this.logger.debug(`Cleaned up ${expiredMessages.length} expired message timers`);
    }
  }

  private async cleanup(): Promise<void> {
    // Clear all active message timers
    for (const timer of this.messageTimers.values()) {
      clearTimeout(timer);
    }
    this.messageTimers.clear();

    // Clear active messages
    this.activeMessages.clear();

    // Unsubscribe from Redis channels
    const keyPatterns = this.redisConfig.getKeyspatterns();
    await this.redisService.punsubscribe(keyPatterns.patterns.channelAll);
  }
}