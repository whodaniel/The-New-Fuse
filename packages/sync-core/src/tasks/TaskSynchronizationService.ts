import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { PrismaService } from '@the-new-fuse/database';
import { SyncOrchestrator } from '../services/SyncOrchestrator';
import {
  SyncOperation,
  SyncResourceType,
  TenantSyncContext,
  ConflictResolution
} from '../types';

export interface TaskSyncData {
  id: string;
  type: string;
  status: string;
  priority: string;
  data?: any;
  result?: any;
  error?: string;
  startTime?: Date;
  endTime?: Date;
  pipelineId: string;
  agentId?: string;
  userId: string;
  dependencies?: string[];
  metadata?: Record<string, any>;
  version: number;
  lastModified: Date;
  modifiedBy: string;
}

export interface TaskExecutionSyncData {
  id: string;
  taskId: string;
  status: string;
  output?: any;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  executionContext?: Record<string, any>;
  version: number;
  lastModified: Date;
}

export interface TaskDependencyUpdate {
  taskId: string;
  dependencies: string[];
  dependents: string[];
  updateType: 'add' | 'remove' | 'reorder';
  timestamp: Date;
}

export interface TaskNotification {
  id: string;
  type: 'task_created' | 'task_updated' | 'task_completed' | 'task_failed' | 'dependency_changed';
  taskId: string;
  userId: string;
  tenantId?: string;
  data: any;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  requiresAck?: boolean;
}

export interface IWebSocketService {
  sendMessage(userId: string, message: any): Promise<boolean>;
  broadcastToAllUsers(message: any): Promise<number>;
  broadcastToTenant(tenantId: string, message: any): Promise<number>;
}

@Injectable()
export class TaskSynchronizationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TaskSynchronizationService.name);
  
  private readonly config = {
    taskChannelPrefix: 'task_sync:',
    executionChannelPrefix: 'task_execution:',
    dependencyChannelPrefix: 'task_dependency:',
    notificationChannelPrefix: 'task_notification:',
    conflictResolutionTimeout: 30000,
    batchSize: 50,
    maxRetries: 3
  };

  private taskDependencyGraph: Map<string, Set<string>> = new Map();
  private activeTaskOperations: Map<string, SyncOperation> = new Map();
  private pendingNotifications: Map<string, TaskNotification[]> = new Map();

  constructor(
    private readonly redisService: UnifiedRedisService,
    @Inject('IWebSocketService') private readonly wsService: IWebSocketService,
    private readonly dbService: PrismaService,
    private readonly syncOrchestrator: SyncOrchestrator
  ) {}

  async onModuleInit(): Promise<void> {
    await this.initializeChannelSubscriptions();
    await this.loadTaskDependencies();
    this.startNotificationProcessor();
    this.logger.log('TaskSynchronizationService initialized');
  }

  async onModuleDestroy(): Promise<void> {
    await this.cleanup();
    this.logger.log('TaskSynchronizationService destroyed');
  }

  /**
   * Initialize Redis channel subscriptions for task synchronization
   */
  private async initializeChannelSubscriptions(): Promise<void> {
    // Subscribe to task sync events
    await this.redisService.psubscribe(
      `${this.config.taskChannelPrefix}*`,
      async (message) => {
        await this.handleTaskSyncMessage(message);
      }
    );

    // Subscribe to task execution events
    await this.redisService.psubscribe(
      `${this.config.executionChannelPrefix}*`,
      async (message) => {
        await this.handleTaskExecutionMessage(message);
      }
    );

    // Subscribe to dependency change events
    await this.redisService.psubscribe(
      `${this.config.dependencyChannelPrefix}*`,
      async (message) => {
        await this.handleDependencyChangeMessage(message);
      }
    );

    this.logger.log('Task synchronization channels initialized');
  }

  /**
   * Load existing task dependencies into memory for fast access
   */
  private async loadTaskDependencies(): Promise<void> {
    try {
      // Load task relationships from existing workflow system
      const workflows = await this.dbService.workflow.findMany({
        include: {
          steps: {
            select: {
              id: true,
              nextSteps: true,
              conditions: true
            }
          }
        }
      });

      for (const workflow of workflows) {
        for (const step of workflow.steps) {
          if (step.nextSteps && step.nextSteps.length > 0) {
            this.taskDependencyGraph.set(step.id, new Set(step.nextSteps));
          }
        }
      }

      this.logger.log(`Loaded dependencies for ${this.taskDependencyGraph.size} tasks`);
    } catch (error) {
      this.logger.error('Failed to load task dependencies:', error);
    }
  }

  /**
   * Sync task data with real-time updates
   */
  async syncTaskData(taskData: TaskSyncData, tenantId?: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Update task in database with optimistic locking
      const updatedTask = await this.updateTaskWithVersioning(taskData);
      
      // Create sync operation
      const operation: SyncOperation = {
        id: this.generateOperationId(),
        type: 'sync',
        resourceType: 'task',
        resourceId: taskData.id,
        tenantId,
        data: {
          ...taskData,
          updatedTask,
          syncTimestamp: new Date()
        },
        priority: this.getTaskSyncPriority(taskData.priority),
        retryCount: 0,
        maxRetries: this.config.maxRetries,
        createdAt: new Date()
      };

      // Store operation
      this.activeTaskOperations.set(operation.id, operation);

      // Sync via orchestrator
      if (tenantId) {
        await this.syncOrchestrator.syncTenantData(tenantId, 'task', operation.data);
      } else {
        await this.syncOrchestrator.syncGlobalData('task', operation.data);
      }

      // Publish task sync event
      const channel = `${this.config.taskChannelPrefix}${tenantId || 'global'}`;
      await this.redisService.publish(channel, {
        operation,
        taskData,
        timestamp: Date.now()
      });

      // Send real-time notifications
      await this.sendTaskNotification({
        id: this.generateNotificationId(),
        type: 'task_updated',
        taskId: taskData.id,
        userId: taskData.userId,
        tenantId,
        data: taskData,
        priority: this.mapTaskPriorityToNotificationPriority(taskData.priority),
        timestamp: new Date()
      });

      // Update dependent tasks if status changed
      if (taskData.status === 'COMPLETED' || taskData.status === 'FAILED') {
        await this.updateDependentTasks(taskData.id, taskData.status, tenantId);
      }

      this.logger.debug(`Synced task ${taskData.id} in ${Date.now() - startTime}ms`);
    } catch (error) {
      this.logger.error(`Failed to sync task data:`, error);
      throw error;
    }
  }

  /**
   * Sync task execution data
   */
  async syncTaskExecution(executionData: TaskExecutionSyncData, tenantId?: string): Promise<void> {
    try {
      // Update task execution in database
      const updatedExecution = await this.updateTaskExecutionWithVersioning(executionData);

      // Create sync operation
      const operation: SyncOperation = {
        id: this.generateOperationId(),
        type: 'sync',
        resourceType: 'task',
        resourceId: executionData.taskId,
        tenantId,
        data: {
          execution: executionData,
          updatedExecution,
          syncTimestamp: new Date()
        },
        priority: 2, // High priority for execution updates
        retryCount: 0,
        maxRetries: this.config.maxRetries,
        createdAt: new Date()
      };

      // Sync via orchestrator
      if (tenantId) {
        await this.syncOrchestrator.syncTenantData(tenantId, 'task', operation.data);
      } else {
        await this.syncOrchestrator.syncGlobalData('task', operation.data);
      }

      // Publish execution sync event
      const channel = `${this.config.executionChannelPrefix}${tenantId || 'global'}`;
      await this.redisService.publish(channel, {
        operation,
        executionData,
        timestamp: Date.now()
      });

      // Send real-time notification for execution completion
      if (executionData.completedAt) {
        const task = await this.dbService.task.findUnique({
          where: { id: executionData.taskId }
        });

        if (task) {
          const notification: TaskNotification = {
            id: this.generateNotificationId(),
            type: executionData.error ? 'task_failed' : 'task_completed',
            taskId: executionData.taskId,
            userId: task.userId,
            tenantId,
            data: executionData,
            priority: executionData.error ? 'high' : 'medium',
            timestamp: new Date(),
            requiresAck: executionData.error // Require acknowledgment for failures
          };

          await this.sendTaskNotification(notification);
        }
      }

      this.logger.debug(`Synced task execution ${executionData.id}`);
    } catch (error) {
      this.logger.error(`Failed to sync task execution:`, error);
      throw error;
    }
  }

  /**
   * Update task dependencies and sync changes
   */
  async updateTaskDependencies(
    taskId: string,
    dependencies: string[],
    tenantId?: string
  ): Promise<void> {
    try {
      const oldDependencies = this.taskDependencyGraph.get(taskId) || new Set();
      const newDependencies = new Set(dependencies);

      // Update in-memory graph
      this.taskDependencyGraph.set(taskId, newDependencies);

      // Create dependency update
      const dependencyUpdate: TaskDependencyUpdate = {
        taskId,
        dependencies,
        dependents: this.getDependentTasks(taskId),
        updateType: 'reorder', // Simplified for now
        timestamp: new Date()
      };

      // Sync dependency changes
      const operation: SyncOperation = {
        id: this.generateOperationId(),
        type: 'sync',
        resourceType: 'task',
        resourceId: taskId,
        tenantId,
        data: {
          dependencyUpdate,
          syncTimestamp: new Date()
        },
        priority: 3, // Medium priority for dependency updates
        retryCount: 0,
        maxRetries: this.config.maxRetries,
        createdAt: new Date()
      };

      // Sync via orchestrator
      if (tenantId) {
        await this.syncOrchestrator.syncTenantData(tenantId, 'task', operation.data);
      } else {
        await this.syncOrchestrator.syncGlobalData('task', operation.data);
      }

      // Publish dependency change event
      const channel = `${this.config.dependencyChannelPrefix}${tenantId || 'global'}`;
      await this.redisService.publish(channel, {
        operation,
        dependencyUpdate,
        timestamp: Date.now()
      });

      // Notify affected users
      const affectedTasks = [...dependencies, ...dependencyUpdate.dependents];
      for (const affectedTaskId of affectedTasks) {
        try {
          const task = await this.dbService.task.findUnique({
            where: { id: affectedTaskId }
          });

          if (task) {
            const notification: TaskNotification = {
              id: this.generateNotificationId(),
              type: 'dependency_changed',
              taskId: affectedTaskId,
              userId: task.userId,
              tenantId,
              data: dependencyUpdate,
              priority: 'medium',
              timestamp: new Date()
            };

            await this.sendTaskNotification(notification);
          }
        } catch (error) {
          this.logger.error(`Failed to notify user for task ${affectedTaskId}:`, error);
        }
      }

      this.logger.debug(`Updated dependencies for task ${taskId}`);
    } catch (error) {
      this.logger.error(`Failed to update task dependencies:`, error);
      throw error;
    }
  }

  /**
   * Handle simultaneous task updates with conflict resolution
   */
  async resolveTaskConflict(
    taskId: string,
    localVersion: TaskSyncData,
    remoteVersion: TaskSyncData,
    tenantId?: string
  ): Promise<ConflictResolution> {
    try {
      // Determine resolution strategy based on conflict type
      let resolvedData: TaskSyncData;
      let strategy: string;

      // Check if it's a status conflict
      if (localVersion.status !== remoteVersion.status) {
        // Use timestamp-based resolution for status conflicts
        if (localVersion.lastModified > remoteVersion.lastModified) {
          resolvedData = localVersion;
          strategy = 'latest_wins_local';
        } else {
          resolvedData = remoteVersion;
          strategy = 'latest_wins_remote';
        }
      } else {
        // Merge non-conflicting fields
        resolvedData = {
          ...localVersion,
          ...remoteVersion,
          // Keep the latest timestamp
          lastModified: localVersion.lastModified > remoteVersion.lastModified 
            ? localVersion.lastModified 
            : remoteVersion.lastModified,
          // Increment version
          version: Math.max(localVersion.version, remoteVersion.version) + 1,
          // Merge metadata
          metadata: {
            ...localVersion.metadata,
            ...remoteVersion.metadata,
            conflictResolved: true,
            conflictResolvedAt: new Date(),
            originalVersions: {
              local: localVersion.version,
              remote: remoteVersion.version
            }
          }
        };
        strategy = 'merge';
      }

      // Apply resolved data
      await this.syncTaskData(resolvedData, tenantId);

      // Log conflict resolution
      this.logger.log(`Resolved task conflict for ${taskId} using strategy: ${strategy}`);

      return {
        strategy: strategy as any,
        resolvedData,
        metadata: {
          conflictType: 'task_update',
          resolutionTimestamp: new Date(),
          localVersion: localVersion.version,
          remoteVersion: remoteVersion.version
        }
      };
    } catch (error) {
      this.logger.error(`Failed to resolve task conflict:`, error);
      throw error;
    }
  }

  /**
   * Send real-time task notifications
   */
  private async sendTaskNotification(notification: TaskNotification): Promise<void> {
    try {
      // Add to pending notifications for batching
      const userNotifications = this.pendingNotifications.get(notification.userId) || [];
      userNotifications.push(notification);
      this.pendingNotifications.set(notification.userId, userNotifications);

      // Send immediate notification for high priority
      if (notification.priority === 'urgent' || notification.priority === 'high') {
        await this.flushUserNotifications(notification.userId);
      } else {
        // For lower priority, batch notifications
        if (userNotifications.length >= 5) {
          await this.flushUserNotifications(notification.userId);
        }
      }

      // Publish notification event
      const channel = `${this.config.notificationChannelPrefix}${notification.tenantId || 'global'}`;
      await this.redisService.publish(channel, notification);

      this.logger.debug(`Queued task notification ${notification.id} for user ${notification.userId}`);
    } catch (error) {
      this.logger.error(`Failed to send task notification:`, error);
    }
  }

  /**
   * Flush pending notifications for a user
   */
  private async flushUserNotifications(userId: string): Promise<void> {
    const notifications = this.pendingNotifications.get(userId);
    if (!notifications || notifications.length === 0) return;

    try {
      // Send via WebSocket
      await this.wsService.sendMessage(userId, {
        id: this.generateMessageId(),
        type: 'task_notifications',
        payload: {
          notifications,
          count: notifications.length,
          timestamp: Date.now()
        },
        timestamp: Date.now(),
        priority: 2 // HIGH priority
      });

      // Clear pending notifications
      this.pendingNotifications.delete(userId);

      this.logger.debug(`Flushed ${notifications.length} notifications for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to flush notifications for user ${userId}:`, error);
    }
  }

  /**
   * Update dependent tasks when a task completes or fails
   */
  private async updateDependentTasks(
    taskId: string,
    status: string,
    tenantId?: string
  ): Promise<void> {
    const dependentTasks = this.getDependentTasks(taskId);
    
    for (const dependentTaskId of dependentTasks) {
      try {
        const dependentTask = await this.dbService.task.findUnique({
          where: { id: dependentTaskId }
        });

        if (!dependentTask) continue;

        // Check if all dependencies are completed
        const dependencies = this.taskDependencyGraph.get(dependentTaskId) || new Set();
        const allDependenciesCompleted = await this.checkAllDependenciesCompleted(
          Array.from(dependencies)
        );

        // Update task status if dependencies are met
        if (allDependenciesCompleted && dependentTask.status === 'PENDING') {
          const updatedTaskData: TaskSyncData = {
            id: dependentTaskId,
            type: dependentTask.type,
            status: 'IN_PROGRESS',
            priority: dependentTask.priority,
            data: dependentTask.data,
            pipelineId: dependentTask.pipelineId,
            agentId: dependentTask.agentId || undefined,
            userId: dependentTask.userId,
            version: 1, // Will be updated by versioning system
            lastModified: new Date(),
            modifiedBy: 'dependency_system'
          };

          await this.syncTaskData(updatedTaskData, tenantId);
        }
      } catch (error) {
        this.logger.error(`Failed to update dependent task ${dependentTaskId}:`, error);
      }
    }
  }

  /**
   * Check if all task dependencies are completed
   */
  private async checkAllDependenciesCompleted(dependencies: string[]): Promise<boolean> {
    if (dependencies.length === 0) return true;

    try {
      const tasks = await this.dbService.task.findMany({
        where: {
          id: { in: dependencies }
        },
        select: {
          id: true,
          status: true
        }
      });

      return tasks.every(task => task.status === 'COMPLETED');
    } catch (error) {
      this.logger.error('Failed to check dependencies:', error);
      return false;
    }
  }

  /**
   * Get tasks that depend on the given task
   */
  private getDependentTasks(taskId: string): string[] {
    const dependents: string[] = [];
    
    for (const [dependentId, dependencies] of this.taskDependencyGraph.entries()) {
      if (dependencies.has(taskId)) {
        dependents.push(dependentId);
      }
    }
    
    return dependents;
  }

  /**
   * Update task with optimistic locking
   */
  private async updateTaskWithVersioning(taskData: TaskSyncData): Promise<any> {
    try {
      // Use Prisma's optimistic locking pattern
      const result = await this.dbService.$executeRaw`
        UPDATE tasks 
        SET 
          type = ${taskData.type},
          status = ${taskData.status}::task_status,
          priority = ${taskData.priority}::task_priority,
          data = ${JSON.stringify(taskData.data)},
          result = ${JSON.stringify(taskData.result)},
          error = ${taskData.error},
          start_time = ${taskData.startTime},
          end_time = ${taskData.endTime},
          updated_at = ${new Date()}
        WHERE id = ${taskData.id}
        RETURNING *
      `;

      return result;
    } catch (error) {
      this.logger.error('Failed to update task with versioning:', error);
      throw error;
    }
  }

  /**
   * Update task execution with versioning
   */
  private async updateTaskExecutionWithVersioning(executionData: TaskExecutionSyncData): Promise<any> {
    try {
      const result = await this.dbService.$executeRaw`
        UPDATE task_executions 
        SET 
          status = ${executionData.status},
          output = ${JSON.stringify(executionData.output)},
          error = ${executionData.error},
          completed_at = ${executionData.completedAt}
        WHERE id = ${executionData.id}
        RETURNING *
      `;

      return result;
    } catch (error) {
      this.logger.error('Failed to update task execution with versioning:', error);
      throw error;
    }
  }

  /**
   * Message handlers
   */
  private async handleTaskSyncMessage(message: any): Promise<void> {
    try {
      const { operation, taskData } = JSON.parse(message.message);
      
      // Process incoming task sync
      await this.processIncomingTaskSync(operation, taskData);
    } catch (error) {
      this.logger.error('Error handling task sync message:', error);
    }
  }

  private async handleTaskExecutionMessage(message: any): Promise<void> {
    try {
      const { operation, executionData } = JSON.parse(message.message);
      
      // Process incoming execution sync
      await this.processIncomingExecutionSync(operation, executionData);
    } catch (error) {
      this.logger.error('Error handling task execution message:', error);
    }
  }

  private async handleDependencyChangeMessage(message: any): Promise<void> {
    try {
      const { operation, dependencyUpdate } = JSON.parse(message.message);
      
      // Process incoming dependency change
      await this.processIncomingDependencyChange(operation, dependencyUpdate);
    } catch (error) {
      this.logger.error('Error handling dependency change message:', error);
    }
  }

  /**
   * Process incoming sync operations
   */
  private async processIncomingTaskSync(operation: SyncOperation, taskData: TaskSyncData): Promise<void> {
    // Check for conflicts and apply changes
    const existingTask = await this.dbService.task.findUnique({
      where: { id: taskData.id }
    });

    if (existingTask) {
      // Check for version conflicts
      const existingVersion = (existingTask as any).version || 1;
      if (taskData.version <= existingVersion) {
        // Handle conflict
        await this.resolveTaskConflict(
          taskData.id,
          taskData,
          existingTask as any,
          operation.tenantId
        );
        return;
      }
    }

    // Apply the sync operation
    await this.updateTaskWithVersioning(taskData);
  }

  private async processIncomingExecutionSync(operation: SyncOperation, executionData: TaskExecutionSyncData): Promise<void> {
    // Apply execution sync
    await this.updateTaskExecutionWithVersioning(executionData);
  }

  private async processIncomingDependencyChange(operation: SyncOperation, dependencyUpdate: TaskDependencyUpdate): Promise<void> {
    // Update in-memory dependency graph
    this.taskDependencyGraph.set(
      dependencyUpdate.taskId,
      new Set(dependencyUpdate.dependencies)
    );
  }

  /**
   * Start notification processor for batching
   */
  private startNotificationProcessor(): void {
    // Process notifications every 2 seconds
    setInterval(async () => {
      try {
        // Flush all pending notifications
        for (const userId of this.pendingNotifications.keys()) {
          await this.flushUserNotifications(userId);
        }
      } catch (error) {
        this.logger.error('Error in notification processor:', error);
      }
    }, 2000); // Flush every 2 seconds for better responsiveness
  }

  /**
   * Utility methods
   */
  private getTaskSyncPriority(taskPriority: string): number {
    const priorities: Record<string, number> = {
      URGENT: 1,
      HIGH: 2,
      MEDIUM: 3,
      LOW: 4
    };
    return priorities[taskPriority] || 3;
  }

  private mapTaskPriorityToNotificationPriority(taskPriority: string): 'low' | 'medium' | 'high' | 'urgent' {
    const mapping: Record<string, 'low' | 'medium' | 'high' | 'urgent'> = {
      URGENT: 'urgent',
      HIGH: 'high',
      MEDIUM: 'medium',
      LOW: 'low'
    };
    return mapping[taskPriority] || 'medium';
  }

  private generateOperationId(): string {
    return `task_op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateNotificationId(): string {
    return `task_notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `task_msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async cleanup(): Promise<void> {
    // Clean up active operations
    this.activeTaskOperations.clear();
    this.pendingNotifications.clear();
    
    // Unsubscribe from Redis channels
    await this.redisService.punsubscribe(`${this.config.taskChannelPrefix}*`);
    await this.redisService.punsubscribe(`${this.config.executionChannelPrefix}*`);
    await this.redisService.punsubscribe(`${this.config.dependencyChannelPrefix}*`);
  }

  /**
   * Public API methods
   */
  async getTaskSyncStatus(taskId: string): Promise<any> {
    const operation = Array.from(this.activeTaskOperations.values())
      .find(op => op.resourceId === taskId);
    
    return {
      taskId,
      hasPendingSync: !!operation,
      lastSyncOperation: operation,
      dependencyCount: this.taskDependencyGraph.get(taskId)?.size || 0,
      dependentCount: this.getDependentTasks(taskId).length
    };
  }

  async getTaskDependencies(taskId: string): Promise<string[]> {
    return Array.from(this.taskDependencyGraph.get(taskId) || new Set());
  }

  async getTaskDependents(taskId: string): Promise<string[]> {
    return this.getDependentTasks(taskId);
  }
}