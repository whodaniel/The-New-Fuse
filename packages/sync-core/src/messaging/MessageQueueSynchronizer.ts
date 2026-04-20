import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { SyncRedisConfig } from '../config/SyncRedisConfig.js';
import {
  SyncAwareA2AMessage,
  MessageQueueSyncConfig,
  MessageSyncStatus,
  SyncAwareMessageUtils
} from './SyncAwareA2AMessage.js';

export interface QueueSyncMetrics {
  totalQueues: number;
  totalMessages: number;
  syncedMessages: number;
  failedSyncs: number;
  averageSyncTime: number;
  lastSyncTime: number;
  conflictCount: number;
}

export interface QueueConflict {
  queueName: string;
  messageId: string;
  conflictType: 'duplicate' | 'version' | 'ordering' | 'checksum';
  localMessage: SyncAwareA2AMessage;
  remoteMessage: SyncAwareA2AMessage;
  detectedAt: number;
  resolvedAt?: number;
  resolution?: 'local_wins' | 'remote_wins' | 'merge' | 'manual';
}

/**
 * Message Queue Synchronizer
 * Implements message queue synchronization using existing Redis infrastructure
 */
@Injectable()
export class MessageQueueSynchronizer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MessageQueueSynchronizer.name);
  
  private queueConfigs: Map<string, MessageQueueSyncConfig> = new Map();
  private syncMetrics: QueueSyncMetrics = {
    totalQueues: 0,
    totalMessages: 0,
    syncedMessages: 0,
    failedSyncs: 0,
    averageSyncTime: 0,
    lastSyncTime: 0,
    conflictCount: 0
  };
  
  private activeSyncs: Set<string> = new Set();
  private queueConflicts: Map<string, QueueConflict> = new Map();
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private readonly redisService: UnifiedRedisService,
    private readonly redisConfig: SyncRedisConfig
  ) {}

  async onModuleInit(): Promise<void> {
    await this.loadQueueConfigurations();
    await this.initializeQueueSynchronization();
    this.startMetricsCollection();
    this.logger.log('MessageQueueSynchronizer initialized');
  }

  async onModuleDestroy(): Promise<void> {
    await this.cleanup();
    this.logger.log('MessageQueueSynchronizer destroyed');
  }

  /**
   * Configure message queue synchronization
   */
  async configureQueueSync(config: MessageQueueSyncConfig): Promise<void> {
    try {
      this.queueConfigs.set(config.queueName, config);
      
      // Store configuration in Redis for persistence
      const keyPatterns = this.redisConfig.getKeyspatterns();
      const configKey = `${keyPatterns.globalSync.state('queue_config', config.queueName)}`;
      await this.redisService.set(configKey, JSON.stringify(config));

      // Start synchronization for this queue
      await this.startQueueSync(config);

      this.logger.debug(`Configured queue synchronization for ${config.queueName}`);
    } catch (error) {
      this.logger.error(`Failed to configure queue sync for ${config.queueName}:`, error);
      throw error;
    }
  }

  /**
   * Synchronize a specific message queue
   */
  async synchronizeQueue(queueName: string, tenantId?: string): Promise<void> {
    const syncId = `${queueName}_${tenantId || 'global'}_${Date.now()}`;
    
    if (this.activeSyncs.has(syncId)) {
      this.logger.debug(`Sync already in progress for queue ${queueName}`);
      return;
    }

    this.activeSyncs.add(syncId);
    const startTime = Date.now();

    try {
      const config = this.queueConfigs.get(queueName);
      if (!config) {
        throw new Error(`No configuration found for queue ${queueName}`);
      }

      // Get queue keys
      const keyPatterns = this.redisConfig.getKeyspatterns();
      const queueKey = tenantId 
        ? keyPatterns.queues.syncOperations(tenantId)
        : keyPatterns.queues.syncOperations();

      // Get all messages in the queue
      const messages = await this.getQueueMessages(queueKey);
      
      // Synchronize based on sync mode
      switch (config.syncMode) {
        case 'immediate':
          await this.syncImmediate(queueName, messages, config);
          break;
        case 'batch':
          await this.syncBatch(queueName, messages, config);
          break;
        case 'scheduled':
          await this.syncScheduled(queueName, messages, config);
          break;
        default:
          throw new Error(`Unknown sync mode: ${config.syncMode}`);
      }

      // Update metrics
      this.updateSyncMetrics(startTime, messages.length, true);
      this.logger.debug(`Synchronized queue ${queueName} with ${messages.length} messages`);

    } catch (error) {
      this.updateSyncMetrics(startTime, 0, false);
      this.logger.error(`Failed to synchronize queue ${queueName}:`, error);
      throw error;
    } finally {
      this.activeSyncs.delete(syncId);
    }
  }

  /**
   * Synchronize all configured queues
   */
  async synchronizeAllQueues(): Promise<void> {
    const syncPromises: Promise<void>[] = [];

    for (const [queueName, config] of this.queueConfigs.entries()) {
      if (config.tenantId) {
        syncPromises.push(this.synchronizeQueue(queueName, config.tenantId));
      } else {
        syncPromises.push(this.synchronizeQueue(queueName));
      }
    }

    try {
      await Promise.allSettled(syncPromises);
      this.logger.debug(`Synchronized ${this.queueConfigs.size} queues`);
    } catch (error) {
      this.logger.error('Failed to synchronize all queues:', error);
    }
  }

  /**
   * Handle queue conflicts
   */
  async resolveQueueConflict(conflictId: string, resolution: 'local_wins' | 'remote_wins' | 'merge' | 'manual'): Promise<void> {
    try {
      const conflict = this.queueConflicts.get(conflictId);
      if (!conflict) {
        throw new Error(`Conflict ${conflictId} not found`);
      }

      let resolvedMessage: SyncAwareA2AMessage;

      switch (resolution) {
        case 'local_wins':
          resolvedMessage = conflict.localMessage;
          break;
        case 'remote_wins':
          resolvedMessage = conflict.remoteMessage;
          break;
        case 'merge':
          resolvedMessage = await this.mergeMessages(conflict.localMessage, conflict.remoteMessage);
          break;
        case 'manual':
          // Queue for manual resolution
          await this.queueManualResolution(conflict);
          return;
        default:
          throw new Error(`Unknown resolution strategy: ${resolution}`);
      }

      // Apply resolved message to queue
      await this.applyResolvedMessage(conflict.queueName, resolvedMessage);

      // Update conflict record
      conflict.resolvedAt = Date.now();
      conflict.resolution = resolution;

      // Store resolution in Redis
      const keyPatterns = this.redisConfig.getKeyspatterns();
      const conflictKey = `${keyPatterns.globalSync.conflicts}:${conflictId}`;
      await this.redisService.set(conflictKey, JSON.stringify(conflict));

      this.logger.debug(`Resolved queue conflict ${conflictId} using ${resolution}`);
    } catch (error) {
      this.logger.error(`Failed to resolve queue conflict ${conflictId}:`, error);
      throw error;
    }
  }

  /**
   * Get queue synchronization metrics
   */
  getQueueSyncMetrics(): QueueSyncMetrics {
    return { ...this.syncMetrics };
  }

  /**
   * Get active queue conflicts
   */
  getActiveConflicts(): QueueConflict[] {
    return Array.from(this.queueConflicts.values()).filter(c => !c.resolvedAt);
  }

  /**
   * Clean up expired messages from queues
   */
  async cleanupExpiredMessages(): Promise<void> {
    try {
      const now = Date.now();
      let cleanedCount = 0;

      for (const [queueName, config] of this.queueConfigs.entries()) {
        const keyPatterns = this.redisConfig.getKeyspatterns();
        const queueKey = config.tenantId 
          ? keyPatterns.queues.syncOperations(config.tenantId)
          : keyPatterns.queues.syncOperations();

        // Get all messages
        const messages = await this.getQueueMessages(queueKey);
        const expiredMessages: string[] = [];

        for (const messageData of messages) {
          try {
            const message = JSON.parse(messageData);
            const messageAge = now - (message.queuedAt || 0);
            
            if (messageAge > config.retentionPolicy.maxAge) {
              expiredMessages.push(messageData);
            }
          } catch (error) {
            // Invalid message format, mark for removal
            expiredMessages.push(messageData);
          }
        }

        // Remove expired messages
        for (const expiredMessage of expiredMessages) {
          await this.redisService.lrem(queueKey, 1, expiredMessage);
          cleanedCount++;
        }
      }

      this.logger.debug(`Cleaned up ${cleanedCount} expired messages`);
    } catch (error) {
      this.logger.error('Failed to cleanup expired messages:', error);
    }
  }

  /**
   * Private helper methods
   */
  private async loadQueueConfigurations(): Promise<void> {
    try {
      const keyPatterns = this.redisConfig.getKeyspatterns();
      const configPattern = `${keyPatterns.globalSync.state('queue_config', '*')}`;
      
      const configKeys = await this.redisService.keys(configPattern);
      for (const key of configKeys) {
        try {
          const configData = await this.redisService.get(key);
          if (configData) {
            const config: MessageQueueSyncConfig = JSON.parse(configData);
            this.queueConfigs.set(config.queueName, config);
          }
        } catch (error) {
          this.logger.warn(`Failed to load queue config from key ${key}:`, error);
        }
      }

      this.syncMetrics.totalQueues = this.queueConfigs.size;
      this.logger.debug(`Loaded ${this.queueConfigs.size} queue configurations`);
    } catch (error) {
      this.logger.error('Failed to load queue configurations:', error);
    }
  }

  private async initializeQueueSynchronization(): Promise<void> {
    // Subscribe to Redis channels for queue sync events
    const keyPatterns = this.redisConfig.getKeyspatterns();
    
    await this.redisService.psubscribe(
      keyPatterns.channels.globalSync,
      async (message) => {
        await this.handleQueueSyncMessage(message);
      }
    );

    // Start synchronization for all configured queues
    for (const config of this.queueConfigs.values()) {
      await this.startQueueSync(config);
    }
  }

  private async startQueueSync(config: MessageQueueSyncConfig): Promise<void> {
    // Clear existing interval if any
    const existingInterval = this.syncIntervals.get(config.queueName);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Set up synchronization based on mode
    switch (config.syncMode) {
      case 'immediate':
        // No interval needed for immediate mode
        break;
      case 'batch':
        if (config.batchTimeout) {
          const interval = setInterval(async () => {
            await this.synchronizeQueue(config.queueName, config.tenantId);
          }, config.batchTimeout);
          this.syncIntervals.set(config.queueName, interval);
        }
        break;
      case 'scheduled':
        // For scheduled mode, you would typically use a cron library
        // For now, we'll use a simple interval
        const interval = setInterval(async () => {
          await this.synchronizeQueue(config.queueName, config.tenantId);
        }, 60000); // Every minute
        this.syncIntervals.set(config.queueName, interval);
        break;
    }
  }

  private async getQueueMessages(queueKey: string): Promise<string[]> {
    return await this.redisService.lrange(queueKey, 0, -1);
  }

  private async syncImmediate(
    queueName: string,
    messages: string[],
    config: MessageQueueSyncConfig
  ): Promise<void> {
    // Process each message immediately
    for (const messageData of messages) {
      try {
        await this.processQueueMessage(queueName, messageData, config);
      } catch (error) {
        this.logger.warn(`Failed to process message in immediate sync:`, error);
      }
    }
  }

  private async syncBatch(
    queueName: string,
    messages: string[],
    config: MessageQueueSyncConfig
  ): Promise<void> {
    const batchSize = config.batchSize || 50;
    
    // Process messages in batches
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      const batchPromises = batch.map(messageData => 
        this.processQueueMessage(queueName, messageData, config)
      );
      
      try {
        await Promise.allSettled(batchPromises);
      } catch (error) {
        this.logger.warn(`Failed to process batch in queue ${queueName}:`, error);
      }
    }
  }

  private async syncScheduled(
    queueName: string,
    messages: string[],
    config: MessageQueueSyncConfig
  ): Promise<void> {
    // For scheduled sync, we process all messages at once
    // This could be enhanced with more sophisticated scheduling logic
    await this.syncBatch(queueName, messages, config);
  }

  private async processQueueMessage(
    queueName: string,
    messageData: string,
    config: MessageQueueSyncConfig
  ): Promise<void> {
    try {
      const queuedMessage = JSON.parse(messageData);
      const message: SyncAwareA2AMessage = queuedMessage.message;
      
      // Check for conflicts
      const conflict = await this.detectMessageConflict(queueName, message);
      if (conflict) {
        await this.handleMessageConflict(conflict);
        return;
      }

      // Process the message
      await this.applyQueueMessage(queueName, message);
      
      // Update sync status
      const messageId = SyncAwareMessageUtils.extractSyncMetadata(message).syncId;
      await this.updateMessageSyncStatus(messageId, 'completed');

    } catch (error) {
      this.logger.error(`Failed to process queue message:`, error);
      throw error;
    }
  }

  private async detectMessageConflict(
    queueName: string,
    message: SyncAwareA2AMessage
  ): Promise<QueueConflict | null> {
    try {
      const syncMetadata = SyncAwareMessageUtils.extractSyncMetadata(message);
      const messageId = 'header' in message ? message.header.id : message.id;
      
      // Check for existing message with same ID
      const keyPatterns = this.redisConfig.getKeyspatterns();
      const existingKey = `${keyPatterns.globalSync.state('message', messageId)}`;
      const existingData = await this.redisService.get(existingKey);
      
      if (existingData) {
        const existingMessage: SyncAwareA2AMessage = JSON.parse(existingData);
        const existingSyncMetadata = SyncAwareMessageUtils.extractSyncMetadata(existingMessage);
        
        // Check for version conflict
        if (existingSyncMetadata.syncVersion !== syncMetadata.syncVersion) {
          return {
            queueName,
            messageId,
            conflictType: 'version',
            localMessage: existingMessage,
            remoteMessage: message,
            detectedAt: Date.now()
          };
        }
        
        // Check for checksum conflict
        const existingChecksum = SyncAwareMessageUtils.calculateChecksum(existingMessage);
        const newChecksum = SyncAwareMessageUtils.calculateChecksum(message);
        
        if (existingChecksum !== newChecksum) {
          return {
            queueName,
            messageId,
            conflictType: 'checksum',
            localMessage: existingMessage,
            remoteMessage: message,
            detectedAt: Date.now()
          };
        }
      }
      
      return null;
    } catch (error) {
      this.logger.error('Failed to detect message conflict:', error);
      return null;
    }
  }

  private async handleMessageConflict(conflict: QueueConflict): Promise<void> {
    const conflictId = `${conflict.queueName}_${conflict.messageId}_${conflict.detectedAt}`;
    this.queueConflicts.set(conflictId, conflict);
    this.syncMetrics.conflictCount++;

    // Store conflict in Redis
    const keyPatterns = this.redisConfig.getKeyspatterns();
    const conflictKey = `${keyPatterns.globalSync.conflicts}:${conflictId}`;
    await this.redisService.set(conflictKey, JSON.stringify(conflict));

    // Try automatic resolution based on queue config
    const config = this.queueConfigs.get(conflict.queueName);
    if (config) {
      await this.resolveQueueConflict(conflictId, config.conflictResolution);
    }

    this.logger.warn(`Queue conflict detected: ${conflictId}`);
  }

  private async applyQueueMessage(queueName: string, message: SyncAwareA2AMessage): Promise<void> {
    // Store message state for future conflict detection
    const messageId = 'header' in message ? message.header.id : message.id;
    const keyPatterns = this.redisConfig.getKeyspatterns();
    const messageKey = `${keyPatterns.globalSync.state('message', messageId)}`;
    
    await this.redisService.set(messageKey, JSON.stringify(message));
    
    // Publish sync event
    await this.redisService.publish(keyPatterns.channels.globalSync, JSON.stringify({
      type: 'message_synced',
      queueName,
      messageId,
      timestamp: Date.now()
    }));
  }

  private async mergeMessages(
    localMessage: SyncAwareA2AMessage,
    remoteMessage: SyncAwareA2AMessage
  ): Promise<SyncAwareA2AMessage> {
    // Simple merge strategy - can be enhanced with more sophisticated merging
    const localSyncMetadata = SyncAwareMessageUtils.extractSyncMetadata(localMessage);
    const remoteSyncMetadata = SyncAwareMessageUtils.extractSyncMetadata(remoteMessage);
    
    // Use the message with the latest timestamp
    const useRemote = remoteSyncMetadata.syncTimestamp > localSyncMetadata.syncTimestamp;
    const baseMessage = useRemote ? remoteMessage : localMessage;
    
    // Merge sync metadata
    const mergedSyncMetadata = {
      ...localSyncMetadata,
      ...remoteSyncMetadata,
      syncVersion: Math.max(localSyncMetadata.syncVersion, remoteSyncMetadata.syncVersion) + 1,
      syncTimestamp: Date.now(),
      syncState: 'completed' as const
    };
    
    return SyncAwareMessageUtils.toSyncAware(baseMessage, mergedSyncMetadata);
  }

  private async queueManualResolution(conflict: QueueConflict): Promise<void> {
    const keyPatterns = this.redisConfig.getKeyspatterns();
    const manualQueueKey = `${keyPatterns.queues.syncOperations()}:manual_resolution`;
    
    await this.redisService.lpush(manualQueueKey, JSON.stringify(conflict));
  }

  private async applyResolvedMessage(queueName: string, message: SyncAwareA2AMessage): Promise<void> {
    await this.applyQueueMessage(queueName, message);
  }

  private async updateMessageSyncStatus(messageId: string, status: string): Promise<void> {
    const keyPatterns = this.redisConfig.getKeyspatterns();
    const statusKey = `${keyPatterns.globalSync.state('message', messageId)}:status`;
    
    const currentStatus = await this.redisService.get(statusKey);
    if (currentStatus) {
      const statusData = JSON.parse(currentStatus);
      statusData.status = status;
      statusData.updatedAt = Date.now();
      
      await this.redisService.set(statusKey, JSON.stringify(statusData));
    }
  }

  private async handleQueueSyncMessage(message: any): Promise<void> {
    try {
      const data = JSON.parse(message.message);
      
      switch (data.type) {
        case 'queue_sync_request':
          await this.synchronizeQueue(data.queueName, data.tenantId);
          break;
        case 'conflict_resolution':
          await this.resolveQueueConflict(data.conflictId, data.resolution);
          break;
        case 'cleanup_request':
          await this.cleanupExpiredMessages();
          break;
        default:
          this.logger.debug(`Unknown queue sync message type: ${data.type}`);
      }
    } catch (error) {
      this.logger.warn('Failed to handle queue sync message:', error);
    }
  }

  private updateSyncMetrics(startTime: number, messageCount: number, success: boolean): void {
    const syncTime = Date.now() - startTime;
    
    this.syncMetrics.lastSyncTime = Date.now();
    this.syncMetrics.totalMessages += messageCount;
    
    if (success) {
      this.syncMetrics.syncedMessages += messageCount;
    } else {
      this.syncMetrics.failedSyncs++;
    }
    
    // Update average sync time
    const totalSyncs = this.syncMetrics.syncedMessages + this.syncMetrics.failedSyncs;
    if (totalSyncs > 0) {
      this.syncMetrics.averageSyncTime = 
        (this.syncMetrics.averageSyncTime * (totalSyncs - 1) + syncTime) / totalSyncs;
    }
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      this.collectMetrics();
    }, 60000); // Collect metrics every minute
  }

  private collectMetrics(): void {
    this.syncMetrics.totalQueues = this.queueConfigs.size;
    
    // Log metrics periodically
    this.logger.debug('Queue sync metrics:', this.syncMetrics);
  }

  private async cleanup(): Promise<void> {
    // Clear all intervals
    for (const interval of this.syncIntervals.values()) {
      clearInterval(interval);
    }
    this.syncIntervals.clear();

    // Clear data structures
    this.queueConfigs.clear();
    this.queueConflicts.clear();
    this.activeSyncs.clear();

    // Unsubscribe from Redis channels
    const keyPatterns = this.redisConfig.getKeyspatterns();
    await this.redisService.punsubscribe(keyPatterns.channels.globalSync);
  }
}