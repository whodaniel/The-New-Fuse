import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '@the-new-fuse/database';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { PromptTemplateServiceImpl } from '@the-new-fuse/prompt-templating';
import { EventEmitter } from 'events';
import {
  ConflictResolution,
  ConflictResolutionStrategy,
  SyncConflictData,
  SyncMetrics,
  SyncOperation,
  SyncResourceType,
  SyncStateData,
  TenantSyncContext,
} from '../types';

export interface AgentState {
  id: string;
  status: string;
  metadata?: Record<string, any>;
  lastUpdate: Date;
}

export interface WebSocketMessage {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  userId?: string;
  agentId?: string;
  priority?: number;
  requiresAck?: boolean;
}

export interface IWebSocketService {
  sendMessage(userId: string, message: WebSocketMessage): Promise<boolean>;
  broadcastToAllUsers(message: WebSocketMessage): Promise<number>;
}

export interface SyncOrchestratorConfig {
  syncChannelPrefix: string;
  conflictChannelPrefix: string;
  batchSize: number;
  syncTimeout: number;
  retryAttempts: number;
  tenantIsolationEnabled: boolean;
}

@Injectable()
export class SyncOrchestrator extends EventEmitter implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SyncOrchestrator.name);

  private readonly config: SyncOrchestratorConfig = {
    syncChannelPrefix: 'sync:',
    conflictChannelPrefix: 'conflict:',
    batchSize: 50,
    syncTimeout: 30000,
    retryAttempts: 3,
    tenantIsolationEnabled: true,
  };

  private metrics: SyncMetrics = {
    operations: {
      sync: 0,
      conflicts: 0,
      fileChanges: 0,
      clockSync: 0,
    },
    performance: {
      avgSyncLatency: 0,
      maxSyncLatency: 0,
      conflictRate: 0,
      successRate: 0,
    },
    resources: {
      activeTenants: 0,
      watchedFiles: 0,
      syncedResources: 0,
      pendingOperations: 0,
    },
  };

  private activeSyncOperations: Map<string, SyncOperation> = new Map();
  private tenantContexts: Map<string, TenantSyncContext> = new Map();

  constructor(
    private readonly redisService: UnifiedRedisService,
    @Inject('IWebSocketService') private readonly wsService: IWebSocketService,
    private readonly dbService: DatabaseService,
    private readonly promptTemplateService: PromptTemplateServiceImpl
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    await this.initializeChannelSubscriptions();
    await this.loadTenantContexts();
    this.startMetricsCollection();
    this.logger.log('SyncOrchestrator initialized');
  }

  async onModuleDestroy(): Promise<void> {
    await this.cleanup();
    this.logger.log('SyncOrchestrator destroyed');
  }

  /**
   * Initialize Redis channel subscriptions for sync operations
   */
  private async initializeChannelSubscriptions(): Promise<void> {
    // Subscribe to sync events
    await this.redisService.psubscribe(`${this.config.syncChannelPrefix}*`, async (message) => {
      await this.handleSyncMessage(message);
    });

    // Subscribe to conflict events
    await this.redisService.psubscribe(`${this.config.conflictChannelPrefix}*`, async (message) => {
      await this.handleConflictMessage(message);
    });

    this.logger.log('Channel subscriptions initialized');
  }

  /**
   * Load tenant contexts from database
   */
  private async loadTenantContexts(): Promise<void> {
    try {
      // Load tenant information from existing User table with tenant patterns
      const users = await this.dbService.user.findMany({
        select: {
          id: true,
          role: true,
          // Add tenant-related fields as they exist in your schema
        },
      });

      for (const user of users) {
        const tenantId = user.id; // Using user ID as tenant ID for now
        const context: TenantSyncContext = {
          tenantId,
          userId: user.id,
          permissions: this.getUserPermissions(user.role),
          isolationLevel: 'strict',
        };
        this.tenantContexts.set(tenantId, context);
      }

      this.metrics.resources.activeTenants = this.tenantContexts.size;
      this.logger.log(`Loaded ${this.tenantContexts.size} tenant contexts`);
    } catch (error) {
      this.logger.error('Failed to load tenant contexts:', error);
    }
  }

  /**
   * Sync tenant-specific data across all instances
   */
  async syncTenantData(tenantId: string, dataType: SyncResourceType, data: any): Promise<void> {
    const startTime = Date.now();

    try {
      // Validate tenant context
      const context = this.tenantContexts.get(tenantId);
      if (!context) {
        throw new Error(`Tenant context not found: ${tenantId}`);
      }

      // Create sync operation
      const operation: SyncOperation = {
        id: this.generateOperationId(),
        type: 'sync',
        resourceType: dataType,
        resourceId: data.id || this.generateResourceId(),
        tenantId,
        data,
        priority: this.getSyncPriority(dataType),
        retryCount: 0,
        maxRetries: this.config.retryAttempts,
        createdAt: new Date(),
      };

      // Store operation state
      this.activeSyncOperations.set(operation.id, operation);

      // Create or update sync state in database
      await this.updateSyncState(operation);

      // Publish sync event to Redis
      const channel = `${this.config.syncChannelPrefix}${tenantId}:${dataType}`;
      await this.redisService.publish(channel, {
        operation,
        timestamp: Date.now(),
      });

      // Send real-time updates via WebSocket
      await this.broadcastSyncUpdate(tenantId, operation);

      // Update metrics
      this.updateSyncMetrics(startTime, true);
      this.metrics.operations.sync++;
      this.emit('sync_operation_completed', {
        agentId: tenantId,
        operation: { type: dataType },
        duration: Date.now() - startTime,
        tenantId,
      });
      this.logger.debug(`Synced ${dataType} for tenant ${tenantId}`);
    } catch (error) {
      this.updateSyncMetrics(startTime, false);
      this.emit('sync_operation_failed', {
        agentId: tenantId,
        operation: { type: dataType },
        error,
        tenantId,
      });
      this.logger.error(`Failed to sync tenant data:`, error);
      throw error;
    }
  }

  /**
   * Sync global data across all tenants
   */
  async syncGlobalData(dataType: SyncResourceType, data: any): Promise<void> {
    const startTime = Date.now();

    try {
      const operation: SyncOperation = {
        id: this.generateOperationId(),
        type: 'sync',
        resourceType: dataType,
        resourceId: data.id || this.generateResourceId(),
        data,
        priority: this.getSyncPriority(dataType),
        retryCount: 0,
        maxRetries: this.config.retryAttempts,
        createdAt: new Date(),
      };

      // Store operation state
      this.activeSyncOperations.set(operation.id, operation);

      // Update sync state in database
      await this.updateSyncState(operation);

      // Publish to global sync channel
      const channel = `${this.config.syncChannelPrefix}global:${dataType}`;
      await this.redisService.publish(channel, {
        operation,
        timestamp: Date.now(),
      });

      // Broadcast to all connected users
      try {
        await this.wsService.broadcastToAllUsers({
          id: this.generateMessageId(),
          type: 'sync_update',
          payload: {
            operation,
            dataType,
            global: true,
          },
          timestamp: Date.now(),
          priority: 2, // HIGH priority
        });
      } catch (error) {
        // Log WebSocket errors but don't fail the sync operation
        this.logger.warn('Failed to broadcast global sync update via WebSocket:', error);
      }

      this.updateSyncMetrics(startTime, true);
      this.metrics.operations.sync++;

      this.logger.debug(`Synced global ${dataType}`);
    } catch (error) {
      this.updateSyncMetrics(startTime, false);
      this.logger.error(`Failed to sync global data:`, error);
      throw error;
    }
  }

  /**
   * Sync agent state via existing AgentWebSocketService
   */
  async syncAgentState(agentId: string, state: AgentState): Promise<void> {
    try {
      // Update agent in database using existing patterns
      const updatedAgent = await this.dbService.agent.update({
        where: { id: agentId },
        data: {
          status: state.status as any, // Cast to match your AgentStatus enum
          metadata: state.metadata as any,
          updatedAt: new Date(),
        },
      });

      // Determine tenant ID from agent (assuming agent has user relationship)
      const tenantId = updatedAgent.userId || 'global';

      // Sync via tenant-aware method
      const { id, ...restOfState } = state;
      await this.syncTenantData(tenantId, 'agent', {
        ...restOfState,
        updatedAgent,
      });

      this.logger.debug(`Synced agent state for agent ${agentId}`);
    } catch (error) {
      this.logger.error(`Failed to sync agent state:`, error);
      throw error;
    }
  }

  /**
   * Sync prompt templates using existing PromptTemplateServiceImpl
   */
  async syncPromptTemplates(templates: any[]): Promise<void> {
    try {
      for (const template of templates) {
        // Update template using existing service
        if (template.id) {
          await this.promptTemplateService.updateTemplate(template.id, template);
        } else {
          await this.promptTemplateService.createTemplate(template);
        }

        // Sync template data
        await this.syncGlobalData('template', template);
      }

      this.logger.debug(`Synced ${templates.length} prompt templates`);
    } catch (error) {
      this.logger.error(`Failed to sync prompt templates:`, error);
      throw error;
    }
  }

  /**
   * Resolve synchronization conflicts
   */
  async resolveConflict(conflict: SyncConflictData): Promise<ConflictResolution> {
    try {
      const strategy = this.determineResolutionStrategy(conflict);
      let resolvedData: any;

      switch (strategy) {
        case 'latest_wins':
          resolvedData = this.resolveLatestWins(conflict);
          break;
        case 'merge':
          resolvedData = await this.resolveMerge(conflict);
          break;
        case 'manual':
          // Queue for manual resolution
          await this.queueManualResolution(conflict);
          return { strategy, resolvedData: null };
        case 'rollback':
          resolvedData = await this.resolveRollback(conflict);
          break;
        default:
          throw new Error(`Unknown resolution strategy: ${strategy}`);
      }

      // Update conflict in database
      await this.updateConflictResolution(conflict.id, {
        resolution: resolvedData,
        resolvedAt: new Date(),
        resolvedBy: 'system',
      });

      // Sync resolved data
      if (conflict.tenantId) {
        await this.syncTenantData(
          conflict.tenantId,
          conflict.resourceType as SyncResourceType,
          resolvedData
        );
      } else {
        await this.syncGlobalData(conflict.resourceType as SyncResourceType, resolvedData);
      }

      this.metrics.operations.conflicts++;
      this.logger.debug(`Resolved conflict ${conflict.id} using ${strategy}`);

      return { strategy, resolvedData };
    } catch (error) {
      this.logger.error(`Failed to resolve conflict:`, error);
      throw error;
    }
  }

  /**
   * Handle incoming sync messages from Redis
   */
  private async handleSyncMessage(message: any): Promise<void> {
    try {
      const { operation } = JSON.parse(message.message);

      // Process sync operation
      await this.processSyncOperation(operation);
    } catch (error) {
      this.logger.error('Error handling sync message:', error);
    }
  }

  /**
   * Handle incoming conflict messages from Redis
   */
  private async handleConflictMessage(message: any): Promise<void> {
    try {
      const conflict = JSON.parse(message.message);

      // Auto-resolve if possible, otherwise queue for manual resolution
      await this.resolveConflict(conflict);
    } catch (error) {
      this.logger.error('Error handling conflict message:', error);
    }
  }

  /**
   * Process sync operation
   */
  private async processSyncOperation(operation: SyncOperation): Promise<void> {
    try {
      // Check for conflicts
      const existingState = await this.getSyncState(
        operation.resourceType,
        operation.resourceId,
        operation.tenantId
      );

      if (existingState && this.hasConflict(operation, existingState)) {
        await this.createConflict(operation, existingState);
        return;
      }

      // Apply sync operation
      await this.applySyncOperation(operation);

      // Clean up
      this.activeSyncOperations.delete(operation.id);
    } catch (error) {
      this.logger.error('Error processing sync operation:', error);
      await this.retrySyncOperation(operation);
    }
  }

  /**
   * Update sync state in database
   */
  private async updateSyncState(operation: SyncOperation): Promise<void> {
    const checksum = this.calculateChecksum(operation.data);

    await this.dbService.syncState.upsert({
      where: {
        resourceType_resourceId_tenantId: {
          resourceType: operation.resourceType,
          resourceId: operation.resourceId,
          tenantId: (operation.tenantId ?? null) as any,
        },
      },
      create: {
        id: operation.id,
        resourceType: operation.resourceType,
        resourceId: operation.resourceId,
        tenantId: (operation.tenantId ?? null) as any,
        version: 1,
        checksum,
        lastSync: new Date(),
        syncedBy: 'sync-orchestrator',
        metadata: operation.data as any,
      },
      update: {
        version: {
          increment: 1,
        },
        checksum,
        lastSync: new Date(),
        syncedBy: 'sync-orchestrator',
        metadata: operation.data as any,
      },
    });
  }

  /**
   * Get sync state from database
   */
  private async getSyncState(
    resourceType: string,
    resourceId: string,
    tenantId?: string
  ): Promise<any | null> {
    return this.dbService.syncState.findUnique({
      where: {
        resourceType_resourceId_tenantId: {
          resourceType,
          resourceId,
          tenantId: (tenantId || null) as any,
        },
      },
    });
  }

  /**
   * Broadcast sync update via WebSocket
   */
  private async broadcastSyncUpdate(tenantId: string, operation: SyncOperation): Promise<void> {
    try {
      const context = this.tenantContexts.get(tenantId);
      if (!context) return;

      // Send to specific user if tenant context has userId
      if (context.userId) {
        await this.wsService.sendMessage(context.userId, {
          id: this.generateMessageId(),
          type: 'sync_update',
          payload: {
            operation,
            tenantId,
            resourceType: operation.resourceType,
          },
          timestamp: Date.now(),
          priority: 2, // HIGH priority
        });
      }
    } catch (error) {
      // Log WebSocket errors but don't fail the sync operation
      this.logger.warn('Failed to broadcast sync update via WebSocket:', error);
    }
  }

  /**
   * Utility methods
   */
  private getUserPermissions(role: any): string[] {
    // Map user roles to permissions based on your existing UserRole enum
    const rolePermissions: Record<string, string[]> = {
      ADMIN: ['read', 'write', 'delete', 'sync'],
      USER: ['read', 'write', 'sync'],
      VIEWER: ['read'],
    };

    return rolePermissions[role] || ['read'];
  }

  private getSyncPriority(dataType: SyncResourceType): number {
    const priorities: Partial<Record<SyncResourceType, number>> = {
      agent: 1, // Highest priority
      task: 2,
      workflow: 2,
      template: 3,
      config: 3,
      user: 4,
      file: 5, // Lowest priority
      // CMS and other resource types default to priority 10
    };

    return priorities[dataType] || 10;
  }

  private determineResolutionStrategy(conflict: SyncConflictData): ConflictResolutionStrategy {
    // Simple strategy determination - can be enhanced with more sophisticated logic
    switch (conflict.conflictType) {
      case 'version':
        return 'latest_wins';
      case 'checksum':
        return 'merge';
      case 'concurrent':
        return 'manual';
      default:
        return 'latest_wins';
    }
  }

  private resolveLatestWins(conflict: SyncConflictData): any {
    // Return the version with the latest timestamp
    const localTime = new Date(conflict.localVersion.timestamp || 0);
    const remoteTime = new Date(conflict.remoteVersion.timestamp || 0);

    return localTime > remoteTime ? conflict.localVersion : conflict.remoteVersion;
  }

  private async resolveMerge(conflict: SyncConflictData): Promise<any> {
    // Simple merge strategy - can be enhanced with more sophisticated merging
    return {
      ...conflict.localVersion,
      ...conflict.remoteVersion,
      mergedAt: new Date(),
      mergeStrategy: 'simple_merge',
    };
  }

  private async resolveRollback(conflict: SyncConflictData): Promise<any> {
    // Rollback to a previous known good state
    const syncState = await this.getSyncState(
      conflict.resourceType,
      conflict.resourceId,
      conflict.tenantId
    );

    return syncState?.metadata || conflict.localVersion;
  }

  private async queueManualResolution(conflict: SyncConflictData): Promise<void> {
    // Queue conflict for manual resolution
    await this.redisService.lpush('manual_conflicts', JSON.stringify(conflict));
  }

  private async updateConflictResolution(
    conflictId: string,
    resolution: Partial<SyncConflictData>
  ): Promise<void> {
    await this.dbService.syncConflict.update({
      where: { id: conflictId },
      data: {
        resolvedAt: resolution.resolvedAt,
        resolvedBy: resolution.resolvedBy,
        resolution: resolution as any,
      },
    });
  }

  private hasConflict(operation: SyncOperation, existingState: SyncStateData): boolean {
    const operationChecksum = this.calculateChecksum(operation.data);
    return existingState.checksum !== operationChecksum;
  }

  private async createConflict(
    operation: SyncOperation,
    existingState: SyncStateData
  ): Promise<void> {
    const conflict: SyncConflictData = {
      id: this.generateOperationId(),
      resourceType: operation.resourceType,
      resourceId: operation.resourceId,
      tenantId: operation.tenantId,
      conflictType: 'checksum',
      localVersion: existingState.metadata,
      remoteVersion: operation.data,
      createdAt: new Date(),
    };

    // Store conflict in database
    await this.dbService.syncConflict.create({
      data: {
        id: conflict.id,
        resourceType: conflict.resourceType,
        resourceId: conflict.resourceId,
        tenantId: conflict.tenantId,
        conflictType: conflict.conflictType,
        localVersion: conflict.localVersion as any,
        remoteVersion: conflict.remoteVersion as any,
        createdAt: conflict.createdAt,
      },
    });

    // Publish conflict event
    const channel = `${this.config.conflictChannelPrefix}${operation.tenantId || 'global'}`;
    await this.redisService.publish(channel, conflict);
  }

  private async applySyncOperation(operation: SyncOperation): Promise<void> {
    // Apply the sync operation based on resource type
    switch (operation.resourceType) {
      case 'agent':
        await this.applyAgentSync(operation);
        break;
      case 'template':
        await this.applyTemplateSync(operation);
        break;
      case 'task':
        await this.applyTaskSync(operation);
        break;
      case 'workflow':
        await this.applyWorkflowSync(operation);
        break;
      default:
        this.logger.warn(`Unknown resource type for sync: ${operation.resourceType}`);
    }
  }

  private async applyAgentSync(operation: SyncOperation): Promise<void> {
    // Update agent using existing database patterns
    await this.dbService.agent.upsert({
      where: { id: operation.resourceId },
      update: {
        ...operation.data,
        updatedAt: new Date(),
      },
      create: {
        id: operation.resourceId,
        ...operation.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  private async applyTemplateSync(operation: SyncOperation): Promise<void> {
    // Update template using existing service
    if (operation.data.id) {
      await this.promptTemplateService.updateTemplate(operation.data.id, operation.data);
    } else {
      await this.promptTemplateService.createTemplate(operation.data);
    }
  }

  private async applyTaskSync(operation: SyncOperation): Promise<void> {
    // Update task using existing database patterns
    await this.dbService.task.upsert({
      where: { id: operation.resourceId },
      update: {
        ...operation.data,
        updatedAt: new Date(),
      },
      create: {
        id: operation.resourceId,
        ...operation.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  private async applyWorkflowSync(operation: SyncOperation): Promise<void> {
    // Update workflow using existing database patterns
    await this.dbService.workflow.upsert({
      where: { id: operation.resourceId },
      update: {
        ...operation.data,
        updatedAt: new Date(),
      },
      create: {
        id: operation.resourceId,
        ...operation.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  private async retrySyncOperation(operation: SyncOperation): Promise<void> {
    if (operation.retryCount >= operation.maxRetries) {
      this.logger.error(`Max retries exceeded for operation ${operation.id}`);
      this.activeSyncOperations.delete(operation.id);
      return;
    }

    operation.retryCount++;
    operation.scheduledAt = new Date(Date.now() + operation.retryCount * 1000);

    // Re-queue operation
    setTimeout(async () => {
      await this.processSyncOperation(operation);
    }, operation.retryCount * 1000);
  }

  private calculateChecksum(data: any): string {
    // Simple checksum calculation - can be enhanced with more sophisticated hashing
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  private generateOperationId(): string {
    return `sync_op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateResourceId(): string {
    return `resource_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateSyncMetrics(startTime: number, success: boolean): void {
    const latency = Date.now() - startTime;

    this.metrics.performance.maxSyncLatency = Math.max(
      this.metrics.performance.maxSyncLatency,
      latency
    );

    // Update average latency
    const totalOps = this.metrics.operations.sync + this.metrics.operations.conflicts;
    this.metrics.performance.avgSyncLatency =
      totalOps > 0
        ? (this.metrics.performance.avgSyncLatency * (totalOps - 1) + latency) / totalOps
        : latency;

    // Update success rate
    if (success) {
      this.metrics.performance.successRate =
        (this.metrics.performance.successRate * (totalOps - 1) + 100) / totalOps;
    } else {
      this.metrics.performance.successRate =
        (this.metrics.performance.successRate * (totalOps - 1)) / totalOps;
    }
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      this.collectMetrics();
    }, 60000); // Collect metrics every minute
  }

  private collectMetrics(): void {
    this.metrics.resources.pendingOperations = this.activeSyncOperations.size;
    this.metrics.resources.syncedResources = this.activeSyncOperations.size;

    // Log metrics periodically
    this.logger.debug('Sync metrics:', this.metrics);
  }

  private async cleanup(): Promise<void> {
    // Clean up active operations
    this.activeSyncOperations.clear();

    // Unsubscribe from Redis channels
    await this.redisService.punsubscribe(`${this.config.syncChannelPrefix}*`);
    await this.redisService.punsubscribe(`${this.config.conflictChannelPrefix}*`);
  }

  /**
   * Public API methods for monitoring and management
   */
  getMetrics(): SyncMetrics {
    return { ...this.metrics };
  }

  getActiveTenants(): string[] {
    return Array.from(this.tenantContexts.keys());
  }

  async getActiveOperations(): Promise<SyncOperation[]> {
    return Array.from(this.activeSyncOperations.values());
  }

  async getTenantContext(tenantId: string): Promise<TenantSyncContext | null> {
    return this.tenantContexts.get(tenantId) || null;
  }
}
