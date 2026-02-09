import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { SyncRedisConfig } from '../config/SyncRedisConfig';
import {
  SyncAwareA2AMessage,
  SyncMetadata,
  MessageSyncStatus,
  CrossTenantRoutingConfig,
  MessageDeliveryMetrics,
  SyncAwareMessageUtils
} from './SyncAwareA2AMessage';

export interface IAgentWebSocketService {
  sendMessage(agentId: string, message: any): Promise<boolean>;
  broadcastToTenant(tenantId: string, message: any): Promise<number>;
  broadcastToAllAgents(message: any): Promise<number>;
  getConnectedAgents(): Promise<string[]>;
  getAgentTenant(agentId: string): Promise<string | null>;
}

export interface SyncAwareWebSocketConfig {
  enableCrossTenantMessaging: boolean;
  maxConcurrentDeliveries: number;
  deliveryTimeout: number;
  retryDelay: number;
  maxQueueSize: number;
  enableMetrics: boolean;
  enableTracing: boolean;
}

/**
 * Enhanced AgentWebSocketService with sync-aware messaging capabilities
 * Integrates with existing AgentWebSocketService for cross-tenant messaging
 */
@Injectable()
export class SyncAwareAgentWebSocketService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SyncAwareAgentWebSocketService.name);
  
  private readonly config: SyncAwareWebSocketConfig = {
    enableCrossTenantMessaging: true,
    maxConcurrentDeliveries: 100,
    deliveryTimeout: 30000,
    retryDelay: 1000,
    maxQueueSize: 10000,
    enableMetrics: true,
    enableTracing: true
  };

  private messageQueue: Map<string, SyncAwareA2AMessage[]> = new Map();
  private deliveryMetrics: Map<string, MessageDeliveryMetrics> = new Map();
  private crossTenantConfigs: Map<string, CrossTenantRoutingConfig> = new Map();
  private activeDeliveries: Set<string> = new Set();

  constructor(
    private readonly redisService: UnifiedRedisService,
    private readonly redisConfig: SyncRedisConfig,
    private readonly wsService: IAgentWebSocketService
  ) {}

  async onModuleInit(): Promise<void> {
    await this.initializeMessageQueues();
    await this.loadCrossTenantConfigs();
    this.startMessageProcessor();
    this.startMetricsCollection();
    this.logger.log('SyncAwareAgentWebSocketService initialized');
  }

  async onModuleDestroy(): Promise<void> {
    await this.cleanup();
    this.logger.log('SyncAwareAgentWebSocketService destroyed');
  }

  /**
   * Send sync-aware message to specific agent with cross-tenant support
   */
  async sendSyncAwareMessage(
    targetAgentId: string,
    message: SyncAwareA2AMessage,
    options: {
      allowCrossTenant?: boolean;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      requiresAck?: boolean;
      maxRetries?: number;
    } = {}
  ): Promise<MessageSyncStatus> {
    const startTime = Date.now();
    const syncMetadata = SyncAwareMessageUtils.extractSyncMetadata(message);
    
    try {
      // Validate message
      if (!SyncAwareMessageUtils.validateMessage(message)) {
        throw new Error('Invalid sync-aware message format');
      }

      // Get target agent's tenant
      const targetTenantId = await this.wsService.getAgentTenant(targetAgentId);
      const sourceTenantId = syncMetadata.tenantId;

      // Check cross-tenant permissions
      if (sourceTenantId && targetTenantId && sourceTenantId !== targetTenantId) {
        if (!options.allowCrossTenant || !syncMetadata.crossTenantAllowed) {
          throw new Error('Cross-tenant messaging not allowed');
        }

        const isAllowed = await this.validateCrossTenantDelivery(
          sourceTenantId,
          targetTenantId,
          message
        );
        if (!isAllowed) {
          throw new Error('Cross-tenant delivery denied by security policy');
        }
      }

      // Create message sync status
      const syncStatus: MessageSyncStatus = {
        messageId: this.getMessageId(message),
        syncId: syncMetadata.syncId,
        status: 'queued',
        deliveredTo: [],
        failedDeliveries: [],
        acknowledgedBy: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        expiresAt: options.maxRetries ? Date.now() + (options.maxRetries * this.config.retryDelay * 2) : undefined
      };

      // Store sync status in Redis
      await this.storeSyncStatus(syncStatus);

      // Queue message for delivery
      await this.queueMessageForDelivery(targetAgentId, message, options);

      // Initialize delivery metrics
      if (this.config.enableMetrics) {
        this.initializeDeliveryMetrics(message, startTime);
      }

      this.logger.debug(`Queued sync-aware message ${syncStatus.messageId} for agent ${targetAgentId}`);
      return syncStatus;

    } catch (error) {
      this.logger.error(`Failed to send sync-aware message:`, error);
      throw error;
    }
  }

  /**
   * Broadcast sync-aware message to all agents in a tenant
   */
  async broadcastToTenantSync(
    tenantId: string,
    message: SyncAwareA2AMessage,
    options: {
      excludeAgents?: string[];
      priority?: 'low' | 'medium' | 'high' | 'critical';
      requiresAck?: boolean;
    } = {}
  ): Promise<MessageSyncStatus[]> {
    try {
      // Get all connected agents for the tenant
      const connectedAgents = await this.wsService.getConnectedAgents();
      const tenantAgents = [];

      for (const agentId of connectedAgents) {
        const agentTenantId = await this.wsService.getAgentTenant(agentId);
        if (agentTenantId === tenantId && !options.excludeAgents?.includes(agentId)) {
          tenantAgents.push(agentId);
        }
      }

      // Send to each agent in the tenant
      const syncStatuses: MessageSyncStatus[] = [];
      for (const agentId of tenantAgents) {
        try {
          const syncStatus = await this.sendSyncAwareMessage(agentId, message, {
            allowCrossTenant: false, // Same tenant
            priority: options.priority,
            requiresAck: options.requiresAck
          });
          syncStatuses.push(syncStatus);
        } catch (error) {
          this.logger.warn(`Failed to send message to agent ${agentId}:`, error);
        }
      }

      this.logger.debug(`Broadcasted sync-aware message to ${syncStatuses.length} agents in tenant ${tenantId}`);
      return syncStatuses;

    } catch (error) {
      this.logger.error(`Failed to broadcast to tenant:`, error);
      throw error;
    }
  }

  /**
   * Broadcast sync-aware message across multiple tenants
   */
  async broadcastCrossTenant(
    targetTenantIds: string[],
    message: SyncAwareA2AMessage,
    options: {
      sourceTenantId: string;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      requiresAck?: boolean;
    }
  ): Promise<Record<string, MessageSyncStatus[]>> {
    try {
      // Validate cross-tenant permissions
      for (const targetTenantId of targetTenantIds) {
        const isAllowed = await this.validateCrossTenantDelivery(
          options.sourceTenantId,
          targetTenantId,
          message
        );
        if (!isAllowed) {
          throw new Error(`Cross-tenant delivery to ${targetTenantId} denied`);
        }
      }

      // Broadcast to each target tenant
      const results: Record<string, MessageSyncStatus[]> = {};
      for (const tenantId of targetTenantIds) {
        try {
          const syncStatuses = await this.broadcastToTenantSync(tenantId, message, {
            priority: options.priority,
            requiresAck: options.requiresAck
          });
          results[tenantId] = syncStatuses;
        } catch (error) {
          this.logger.warn(`Failed to broadcast to tenant ${tenantId}:`, error);
          results[tenantId] = [];
        }
      }

      this.logger.debug(`Cross-tenant broadcast completed for ${targetTenantIds.length} tenants`);
      return results;

    } catch (error) {
      this.logger.error(`Failed to broadcast cross-tenant:`, error);
      throw error;
    }
  }

  /**
   * Synchronize message queues across Redis instances
   */
  async synchronizeMessageQueues(tenantId?: string): Promise<void> {
    try {
      const keyPatterns = this.redisConfig.getKeyspatterns();
      const queueKey = tenantId 
        ? keyPatterns.queues.syncOperations(tenantId)
        : keyPatterns.queues.syncOperations();

      // Get all queued messages
      const queuedMessages = await this.redisService.lrange(queueKey, 0, -1);
      
      for (const messageData of queuedMessages) {
        try {
          const queuedMessage = JSON.parse(messageData);
          await this.processQueuedMessage(queuedMessage);
        } catch (error) {
          this.logger.warn('Failed to process queued message:', error);
        }
      }

      this.logger.debug(`Synchronized message queues for ${tenantId || 'global'}`);
    } catch (error) {
      this.logger.error('Failed to synchronize message queues:', error);
    }
  }

  /**
   * Implement failover mechanisms for message delivery
   */
  async handleDeliveryFailover(
    message: SyncAwareA2AMessage,
    failedTargets: string[],
    error: Error
  ): Promise<void> {
    try {
      const syncMetadata = SyncAwareMessageUtils.extractSyncMetadata(message);
      const messageId = this.getMessageId(message);

      // Check if we have failover nodes configured
      if (!syncMetadata.failoverNodes || syncMetadata.failoverNodes.length === 0) {
        throw new Error('No failover nodes configured');
      }

      // Try failover nodes
      for (const failoverNode of syncMetadata.failoverNodes) {
        try {
          await this.deliverToFailoverNode(failoverNode, message);
          
          // Update sync status
          await this.updateSyncStatus(messageId, {
            status: 'delivered',
            deliveredTo: [failoverNode],
            updatedAt: Date.now()
          });

          this.logger.debug(`Message ${messageId} delivered via failover node ${failoverNode}`);
          return;
        } catch (failoverError) {
          this.logger.warn(`Failover node ${failoverNode} also failed:`, failoverError);
        }
      }

      // All failover attempts failed, queue for dead letter
      if (syncMetadata.deadLetterQueue) {
        await this.sendToDeadLetterQueue(message, error);
      }

      // Update sync status as failed
      await this.updateSyncStatus(messageId, {
        status: 'failed',
        failedDeliveries: failedTargets.map(target => ({
          target,
          error: error.message,
          timestamp: Date.now(),
          retryCount: syncMetadata.retryCount
        })),
        updatedAt: Date.now()
      });

    } catch (error) {
      this.logger.error('Failed to handle delivery failover:', error);
    }
  }

  /**
   * Get message synchronization status
   */
  async getMessageSyncStatus(messageId: string): Promise<MessageSyncStatus | null> {
    try {
      const keyPatterns = this.redisConfig.getKeyspatterns();
      const statusKey = `${keyPatterns.globalSync.state('message', messageId)}:status`;
      
      const statusData = await this.redisService.get(statusKey);
      return statusData ? JSON.parse(statusData) : null;
    } catch (error) {
      this.logger.error('Failed to get message sync status:', error);
      return null;
    }
  }

  /**
   * Get delivery metrics for a message
   */
  async getDeliveryMetrics(messageId: string): Promise<MessageDeliveryMetrics | null> {
    return this.deliveryMetrics.get(messageId) || null;
  }

  /**
   * Configure cross-tenant routing rules
   */
  async configureCrossTenantRouting(config: CrossTenantRoutingConfig): Promise<void> {
    try {
      this.crossTenantConfigs.set(config.sourceTenantId, config);
      
      // Store in Redis for persistence
      const keyPatterns = this.redisConfig.getKeyspatterns();
      const configKey = `${keyPatterns.tenantSync.state(config.sourceTenantId, 'routing', 'config')}`;
      await this.redisService.set(configKey, JSON.stringify(config));

      this.logger.debug(`Configured cross-tenant routing for tenant ${config.sourceTenantId}`);
    } catch (error) {
      this.logger.error('Failed to configure cross-tenant routing:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async initializeMessageQueues(): Promise<void> {
    // Subscribe to Redis channels for message synchronization
    const keyPatterns = this.redisConfig.getKeyspatterns();
    
    await this.redisService.psubscribe(
      keyPatterns.patterns.channelAll,
      async (message) => {
        await this.handleRedisMessage(message);
      }
    );
  }

  private async loadCrossTenantConfigs(): Promise<void> {
    try {
      const keyPatterns = this.redisConfig.getKeyspatterns();
      const configPattern = `${keyPatterns.patterns.tenantAll('*')}:routing:config`;
      
      const configKeys = await this.redisService.keys(configPattern);
      for (const key of configKeys) {
        try {
          const configData = await this.redisService.get(key);
          if (configData) {
            const config: CrossTenantRoutingConfig = JSON.parse(configData);
            this.crossTenantConfigs.set(config.sourceTenantId, config);
          }
        } catch (error) {
          this.logger.warn(`Failed to load config from key ${key}:`, error);
        }
      }

      this.logger.debug(`Loaded ${this.crossTenantConfigs.size} cross-tenant routing configurations`);
    } catch (error) {
      this.logger.error('Failed to load cross-tenant configs:', error);
    }
  }

  private startMessageProcessor(): void {
    setInterval(async () => {
      await this.processMessageQueues();
    }, 1000); // Process every second
  }

  private startMetricsCollection(): void {
    if (!this.config.enableMetrics) return;

    setInterval(() => {
      this.collectAndReportMetrics();
    }, 60000); // Collect metrics every minute
  }

  private async processMessageQueues(): Promise<void> {
    for (const [agentId, messages] of this.messageQueue.entries()) {
      if (messages.length === 0) continue;

      const message = messages.shift();
      if (!message) continue;

      try {
        await this.deliverMessage(agentId, message);
      } catch (error) {
        this.logger.warn(`Failed to deliver message to ${agentId}:`, error);
        await this.handleDeliveryFailure(agentId, message, error);
      }
    }
  }

  private async queueMessageForDelivery(
    targetAgentId: string,
    message: SyncAwareA2AMessage,
    options: any
  ): Promise<void> {
    if (!this.messageQueue.has(targetAgentId)) {
      this.messageQueue.set(targetAgentId, []);
    }

    const queue = this.messageQueue.get(targetAgentId)!;
    if (queue.length >= this.config.maxQueueSize) {
      throw new Error(`Message queue full for agent ${targetAgentId}`);
    }

    queue.push(message);

    // Also store in Redis for persistence
    const keyPatterns = this.redisConfig.getKeyspatterns();
    const syncMetadata = SyncAwareMessageUtils.extractSyncMetadata(message);
    const queueKey = keyPatterns.queues.syncOperations(syncMetadata.tenantId);
    
    await this.redisService.lpush(queueKey, JSON.stringify({
      targetAgentId,
      message,
      options,
      queuedAt: Date.now()
    }));
  }

  private async deliverMessage(agentId: string, message: SyncAwareA2AMessage): Promise<void> {
    const messageId = this.getMessageId(message);
    this.activeDeliveries.add(messageId);

    try {
      // Convert sync-aware message to format expected by existing WebSocket service
      const wsMessage = this.convertToWebSocketMessage(message);
      
      // Deliver via existing WebSocket service
      const delivered = await this.wsService.sendMessage(agentId, wsMessage);
      
      if (delivered) {
        await this.updateSyncStatus(messageId, {
          status: 'delivered',
          deliveredTo: [agentId],
          updatedAt: Date.now()
        });

        // Update metrics
        if (this.config.enableMetrics) {
          this.updateDeliveryMetrics(messageId, true);
        }
      } else {
        throw new Error('Message delivery failed');
      }
    } finally {
      this.activeDeliveries.delete(messageId);
    }
  }

  private async validateCrossTenantDelivery(
    sourceTenantId: string,
    targetTenantId: string,
    message: SyncAwareA2AMessage
  ): Promise<boolean> {
    const config = this.crossTenantConfigs.get(sourceTenantId);
    if (!config) {
      return false; // No cross-tenant config means no cross-tenant access
    }

    // Check if target tenant is allowed
    if (!config.targetTenantIds.includes(targetTenantId)) {
      return false;
    }

    // Apply routing rules
    for (const rule of config.routingRules) {
      try {
        // Simple rule evaluation - can be enhanced with JSONPath
        if (rule.condition === 'always' && rule.action === 'deny') {
          return false;
        }
        if (rule.condition === 'always' && rule.action === 'allow') {
          return true;
        }
      } catch (error) {
        this.logger.warn('Failed to evaluate routing rule:', error);
      }
    }

    // Check security policy
    const messageType = this.getMessageType(message);
    if (!config.securityPolicy.allowedMessageTypes.includes(messageType)) {
      return false;
    }

    return true;
  }

  private async storeSyncStatus(status: MessageSyncStatus): Promise<void> {
    const keyPatterns = this.redisConfig.getKeyspatterns();
    const statusKey = `${keyPatterns.globalSync.state('message', status.messageId)}:status`;
    
    await this.redisService.set(
      statusKey,
      JSON.stringify(status),
      'EX',
      3600 // 1 hour TTL
    );
  }

  private async updateSyncStatus(
    messageId: string,
    updates: Partial<MessageSyncStatus>
  ): Promise<void> {
    const currentStatus = await this.getMessageSyncStatus(messageId);
    if (!currentStatus) return;

    const updatedStatus = { ...currentStatus, ...updates };
    await this.storeSyncStatus(updatedStatus);
  }

  private initializeDeliveryMetrics(message: SyncAwareA2AMessage, startTime: number): void {
    const messageId = this.getMessageId(message);
    const syncMetadata = SyncAwareMessageUtils.extractSyncMetadata(message);
    
    const metrics: MessageDeliveryMetrics = {
      messageId,
      syncId: syncMetadata.syncId,
      tenantId: syncMetadata.tenantId,
      messageType: this.getMessageType(message),
      deliveryAttempts: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      averageDeliveryTime: 0,
      maxDeliveryTime: 0,
      minDeliveryTime: Number.MAX_SAFE_INTEGER,
      deliveryStartTime: startTime,
      errorCodes: {},
      routingPath: []
    };

    this.deliveryMetrics.set(messageId, metrics);
  }

  private updateDeliveryMetrics(messageId: string, success: boolean): void {
    const metrics = this.deliveryMetrics.get(messageId);
    if (!metrics) return;

    const deliveryTime = Date.now() - metrics.deliveryStartTime;
    
    metrics.deliveryAttempts++;
    if (success) {
      metrics.successfulDeliveries++;
    } else {
      metrics.failedDeliveries++;
    }

    metrics.maxDeliveryTime = Math.max(metrics.maxDeliveryTime, deliveryTime);
    metrics.minDeliveryTime = Math.min(metrics.minDeliveryTime, deliveryTime);
    metrics.averageDeliveryTime = 
      (metrics.averageDeliveryTime * (metrics.deliveryAttempts - 1) + deliveryTime) / metrics.deliveryAttempts;
    metrics.deliveryEndTime = Date.now();
  }

  private convertToWebSocketMessage(message: SyncAwareA2AMessage): any {
    // Convert sync-aware message to format expected by existing WebSocket service
    if ('header' in message) {
      return {
        id: message.header.id,
        type: message.header.type,
        payload: message.body.content,
        metadata: message.body.metadata
      };
    } else {
      return {
        id: message.id,
        type: message.type,
        payload: message.payload,
        metadata: message.metadata
      };
    }
  }

  private getMessageId(message: SyncAwareA2AMessage): string {
    return 'header' in message ? message.header.id : message.id;
  }

  private getMessageType(message: SyncAwareA2AMessage): string {
    return 'header' in message ? message.header.type : message.type;
  }

  private async handleRedisMessage(message: any): Promise<void> {
    try {
      const data = JSON.parse(message.message);
      // Handle different types of Redis messages for sync coordination
      switch (data.type) {
        case 'queue_sync':
          await this.synchronizeMessageQueues(data.tenantId);
          break;
        case 'failover_trigger':
          await this.handleDeliveryFailover(data.message, data.failedTargets, new Error(data.error));
          break;
        default:
          this.logger.debug(`Unknown Redis message type: ${data.type}`);
      }
    } catch (error) {
      this.logger.warn('Failed to handle Redis message:', error);
    }
  }

  private async processQueuedMessage(queuedMessage: any): Promise<void> {
    const { targetAgentId, message, options } = queuedMessage;
    
    try {
      await this.deliverMessage(targetAgentId, message);
    } catch (error) {
      await this.handleDeliveryFailure(targetAgentId, message, error);
    }
  }

  private async handleDeliveryFailure(
    agentId: string,
    message: SyncAwareA2AMessage,
    error: Error
  ): Promise<void> {
    const syncMetadata = SyncAwareMessageUtils.extractSyncMetadata(message);
    
    if (syncMetadata.retryCount < syncMetadata.maxRetries) {
      // Increment retry count and re-queue
      syncMetadata.retryCount++;
      syncMetadata.lastSyncAttempt = Date.now();
      
      setTimeout(async () => {
        await this.queueMessageForDelivery(agentId, message, {});
      }, this.config.retryDelay * syncMetadata.retryCount);
    } else {
      // Max retries exceeded, handle failover
      await this.handleDeliveryFailover(message, [agentId], error);
    }
  }

  private async deliverToFailoverNode(node: string, message: SyncAwareA2AMessage): Promise<void> {
    // Implement failover node delivery logic
    // This could involve sending to a different Redis instance, message broker, etc.
    throw new Error('Failover node delivery not implemented');
  }

  private async sendToDeadLetterQueue(message: SyncAwareA2AMessage, error: Error): Promise<void> {
    const keyPatterns = this.redisConfig.getKeyspatterns();
    const deadLetterKey = keyPatterns.queues.deadLetter;
    
    await this.redisService.lpush(deadLetterKey, JSON.stringify({
      message,
      error: error.message,
      timestamp: Date.now()
    }));
  }

  private collectAndReportMetrics(): void {
    const totalMetrics = Array.from(this.deliveryMetrics.values());
    
    const summary = {
      totalMessages: totalMetrics.length,
      successfulDeliveries: totalMetrics.reduce((sum, m) => sum + m.successfulDeliveries, 0),
      failedDeliveries: totalMetrics.reduce((sum, m) => sum + m.failedDeliveries, 0),
      averageDeliveryTime: totalMetrics.reduce((sum, m) => sum + m.averageDeliveryTime, 0) / totalMetrics.length,
      activeDeliveries: this.activeDeliveries.size,
      queuedMessages: Array.from(this.messageQueue.values()).reduce((sum, queue) => sum + queue.length, 0)
    };

    this.logger.debug('Message delivery metrics:', summary);
  }

  private async cleanup(): Promise<void> {
    // Clean up resources
    this.messageQueue.clear();
    this.deliveryMetrics.clear();
    this.crossTenantConfigs.clear();
    this.activeDeliveries.clear();

    // Unsubscribe from Redis channels
    const keyPatterns = this.redisConfig.getKeyspatterns();
    await this.redisService.punsubscribe(keyPatterns.patterns.channelAll);
  }
}