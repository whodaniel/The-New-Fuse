import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '@the-new-fuse/database';
import { SyncOrchestrator } from '../services/SyncOrchestrator';
import {
  TaskExecutionSyncData,
  TaskSyncData,
  TaskSynchronizationService,
} from './TaskSynchronizationService';

export interface EnhancedTaskData {
  id: string;
  type: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  data?: any;
  result?: any;
  error?: string;
  startTime?: Date;
  endTime?: Date;
  pipelineId: string;
  agentId?: string;
  userId: string;

  // Enhanced fields for real-time sync
  dependencies?: string[];
  dependents?: string[];
  estimatedDuration?: number;
  actualDuration?: number;
  progress?: number;
  tags?: string[];
  metadata?: Record<string, any>;

  // Sync tracking
  version: number;
  lastModified: Date;
  modifiedBy: string;
  syncStatus?: 'synced' | 'pending' | 'conflict';
}

export interface TaskExecutionContext {
  id: string;
  taskId: string;
  agentId?: string;
  environment?: Record<string, any>;
  resources?: {
    cpu?: number;
    memory?: number;
    storage?: number;
  };
  timeout?: number;
  retryPolicy?: {
    maxRetries: number;
    backoffStrategy: 'linear' | 'exponential';
    baseDelay: number;
  };
}

export interface WorkflowTaskIntegration {
  workflowId: string;
  workflowStepId: string;
  stepOrder: number;
  conditions?: Record<string, any>;
  transformations?: Record<string, any>;
}

@Injectable()
export class EnhancedTaskManagementService implements OnModuleInit {
  private readonly logger = new Logger(EnhancedTaskManagementService.name);

  private taskCache: Map<string, EnhancedTaskData> = new Map();
  private executionContexts: Map<string, TaskExecutionContext> = new Map();
  private workflowIntegrations: Map<string, WorkflowTaskIntegration> = new Map();

  constructor(
    private readonly dbService: DatabaseService,
    private readonly taskSyncService: TaskSynchronizationService,
    private readonly syncOrchestrator: SyncOrchestrator
  ) {}

  async onModuleInit(): Promise<void> {
    await this.loadExistingTasks();
    await this.loadWorkflowIntegrations();
    this.logger.log('EnhancedTaskManagementService initialized');
  }

  /**
   * Load existing tasks into cache for fast access
   */
  private async loadExistingTasks(): Promise<void> {
    try {
      const tasks = await this.dbService.task.findMany({
        where: {
          deletedAt: null,
        },
        include: {
          taskExecutions: {
            orderBy: { startedAt: 'desc' },
            take: 1,
          },
        },
      });

      for (const task of tasks) {
        const enhancedTask: EnhancedTaskData = {
          id: task.id,
          type: task.type,
          status: task.status as any,
          priority: task.priority as any,
          data: task.data,
          result: task.result,
          error: task.error,
          startTime: task.startTime,
          endTime: task.endTime,
          pipelineId: task.pipelineId,
          agentId: task.agentId || undefined,
          userId: task.userId,
          version: 1, // Initialize version
          lastModified: task.updatedAt,
          modifiedBy: 'system',
          syncStatus: 'synced',
        };

        this.taskCache.set(task.id, enhancedTask);
      }

      this.logger.log(`Loaded ${tasks.length} existing tasks into cache`);
    } catch (error) {
      this.logger.error('Failed to load existing tasks:', error);
    }
  }

  /**
   * Load workflow integrations for task dependency management
   */
  private async loadWorkflowIntegrations(): Promise<void> {
    try {
      const workflows = await this.dbService.workflow.findMany({
        include: {
          steps: true,
        },
      });

      for (const workflow of workflows) {
        for (const step of workflow.steps) {
          // Map workflow steps to tasks (assuming step IDs correspond to task IDs)
          const integration: WorkflowTaskIntegration = {
            workflowId: workflow.id,
            workflowStepId: step.id,
            stepOrder: step.order,
            conditions: step.conditions as any,
            transformations: step.transformations as any,
          };

          this.workflowIntegrations.set(step.id, integration);
        }
      }

      this.logger.log(`Loaded ${this.workflowIntegrations.size} workflow integrations`);
    } catch (error) {
      this.logger.error('Failed to load workflow integrations:', error);
    }
  }

  /**
   * Create a new task with real-time synchronization
   */
  async createTask(
    taskData: Omit<EnhancedTaskData, 'id' | 'version' | 'lastModified' | 'modifiedBy'>,
    tenantId?: string
  ): Promise<EnhancedTaskData> {
    try {
      // Create task in database
      const createdTask = await this.dbService.task.create({
        data: {
          type: taskData.type,
          status: taskData.status,
          priority: taskData.priority,
          data: taskData.data,
          pipeline: { connect: { id: taskData.pipelineId } },
          agent: taskData.agentId ? { connect: { id: taskData.agentId } } : undefined,
          user: { connect: { id: taskData.userId } },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Create enhanced task data
      const enhancedTask: EnhancedTaskData = {
        ...taskData,
        id: createdTask.id,
        version: 1,
        lastModified: new Date(),
        modifiedBy: taskData.userId,
        syncStatus: 'pending',
      };

      // Add to cache
      this.taskCache.set(enhancedTask.id, enhancedTask);

      // Sync task data
      await this.syncTaskData(enhancedTask, tenantId);

      // Update dependencies if specified
      if (taskData.dependencies && taskData.dependencies.length > 0) {
        await this.taskSyncService.updateTaskDependencies(
          enhancedTask.id,
          taskData.dependencies,
          tenantId
        );
      }

      this.logger.debug(`Created task ${enhancedTask.id}`);
      return enhancedTask;
    } catch (error) {
      this.logger.error('Failed to create task:', error);
      throw error;
    }
  }

  /**
   * Update an existing task with real-time synchronization
   */
  async updateTask(
    taskId: string,
    updates: Partial<EnhancedTaskData>,
    userId: string,
    tenantId?: string
  ): Promise<EnhancedTaskData> {
    try {
      const existingTask = this.taskCache.get(taskId);
      if (!existingTask) {
        throw new Error(`Task ${taskId} not found`);
      }

      // Create updated task data
      const updatedTask: EnhancedTaskData = {
        ...existingTask,
        ...updates,
        id: taskId, // Ensure ID doesn't change
        version: existingTask.version + 1,
        lastModified: new Date(),
        modifiedBy: userId,
        syncStatus: 'pending',
      };

      // Update in cache
      this.taskCache.set(taskId, updatedTask);

      // Sync task data
      await this.syncTaskData(updatedTask, tenantId);

      // Handle dependency updates
      if (updates.dependencies !== undefined) {
        await this.taskSyncService.updateTaskDependencies(taskId, updates.dependencies, tenantId);
      }

      // Handle status changes that affect workflow
      if (updates.status && updates.status !== existingTask.status) {
        await this.handleStatusChange(updatedTask, existingTask.status, tenantId);
      }

      this.logger.debug(`Updated task ${taskId}`);
      return updatedTask;
    } catch (error) {
      this.logger.error(`Failed to update task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Execute a task with real-time progress tracking
   */
  async executeTask(
    taskId: string,
    executionContext?: Partial<TaskExecutionContext>,
    tenantId?: string
  ): Promise<string> {
    try {
      const task = this.taskCache.get(taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      if (task.status !== 'PENDING') {
        throw new Error(`Task ${taskId} is not in PENDING status`);
      }

      // Create execution context
      const execContext: TaskExecutionContext = {
        id: this.generateExecutionId(),
        taskId,
        agentId: task.agentId,
        environment: executionContext?.environment || {},
        resources: executionContext?.resources || {},
        timeout: executionContext?.timeout || 300000, // 5 minutes default
        retryPolicy: executionContext?.retryPolicy || {
          maxRetries: 3,
          backoffStrategy: 'exponential',
          baseDelay: 1000,
        },
      };

      // Store execution context
      this.executionContexts.set(execContext.id, execContext);

      // Create task execution record
      const taskExecution = await this.dbService.taskExecution.create({
        data: {
          id: execContext.id,
          task: { connect: { id: taskId } },
          status: 'RUNNING',
          startedAt: new Date(),
        },
      });

      // Update task status to IN_PROGRESS
      await this.updateTask(
        taskId,
        {
          status: 'IN_PROGRESS',
          startTime: new Date(),
          progress: 0,
        },
        task.userId,
        tenantId
      );

      // Sync execution data
      const executionSyncData: TaskExecutionSyncData = {
        id: execContext.id,
        taskId,
        status: 'RUNNING',
        startedAt: new Date(),
        executionContext: execContext,
        version: 1,
        lastModified: new Date(),
      };

      await this.taskSyncService.syncTaskExecution(executionSyncData, tenantId);

      this.logger.debug(`Started execution ${execContext.id} for task ${taskId}`);
      return execContext.id;
    } catch (error) {
      this.logger.error(`Failed to execute task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Complete a task execution with results
   */
  async completeTaskExecution(
    executionId: string,
    result?: any,
    error?: string,
    tenantId?: string
  ): Promise<void> {
    try {
      const execContext = this.executionContexts.get(executionId);
      if (!execContext) {
        throw new Error(`Execution context ${executionId} not found`);
      }

      const task = this.taskCache.get(execContext.taskId);
      if (!task) {
        throw new Error(`Task ${execContext.taskId} not found`);
      }

      const completedAt = new Date();
      const duration = task.startTime ? completedAt.getTime() - task.startTime.getTime() : 0;

      // Update task execution in database
      await this.dbService.taskExecution.update({
        where: { id: executionId },
        data: {
          status: error ? 'FAILED' : 'COMPLETED',
          output: result ? JSON.stringify(result) : null,
          error,
          completedAt,
        },
      });

      // Update task status
      const finalStatus = error ? 'FAILED' : 'COMPLETED';
      await this.updateTask(
        execContext.taskId,
        {
          status: finalStatus,
          result,
          error,
          endTime: completedAt,
          actualDuration: duration,
          progress: error ? task.progress : 100,
        },
        task.userId,
        tenantId
      );

      // Sync execution completion
      const executionSyncData: TaskExecutionSyncData = {
        id: executionId,
        taskId: execContext.taskId,
        status: error ? 'FAILED' : 'COMPLETED',
        output: result,
        error,
        startedAt: task.startTime || new Date(),
        completedAt,
        executionContext: execContext,
        version: 2,
        lastModified: new Date(),
      };

      await this.taskSyncService.syncTaskExecution(executionSyncData, tenantId);

      // Clean up execution context
      this.executionContexts.delete(executionId);

      this.logger.debug(`Completed execution ${executionId} for task ${execContext.taskId}`);
    } catch (error) {
      this.logger.error(`Failed to complete task execution ${executionId}:`, error);
      throw error;
    }
  }

  /**
   * Update task progress with real-time sync
   */
  async updateTaskProgress(
    taskId: string,
    progress: number,
    metadata?: Record<string, any>,
    tenantId?: string
  ): Promise<void> {
    try {
      const task = this.taskCache.get(taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      // Update task with progress
      await this.updateTask(
        taskId,
        {
          progress: Math.max(0, Math.min(100, progress)),
          metadata: {
            ...task.metadata,
            ...metadata,
            lastProgressUpdate: new Date(),
          },
        },
        task.userId,
        tenantId
      );

      this.logger.debug(`Updated progress for task ${taskId}: ${progress}%`);
    } catch (error) {
      this.logger.error(`Failed to update task progress:`, error);
      throw error;
    }
  }

  /**
   * Get task with real-time sync status
   */
  async getTask(taskId: string): Promise<EnhancedTaskData | null> {
    const task = this.taskCache.get(taskId);
    if (!task) {
      // Try to load from database
      try {
        const dbTask = await this.dbService.task.findUnique({
          where: { id: taskId },
          include: {
            taskExecutions: {
              orderBy: { startedAt: 'desc' },
              take: 1,
            },
          },
        });

        if (dbTask) {
          const enhancedTask: EnhancedTaskData = {
            id: dbTask.id,
            type: dbTask.type,
            status: dbTask.status as any,
            priority: dbTask.priority as any,
            data: dbTask.data,
            result: dbTask.result,
            error: dbTask.error,
            startTime: dbTask.startTime,
            endTime: dbTask.endTime,
            pipelineId: dbTask.pipelineId,
            agentId: dbTask.agentId || undefined,
            userId: dbTask.userId,
            version: 1,
            lastModified: dbTask.updatedAt,
            modifiedBy: 'system',
            syncStatus: 'synced',
          };

          this.taskCache.set(taskId, enhancedTask);
          return enhancedTask;
        }
      } catch (error) {
        this.logger.error(`Failed to load task ${taskId} from database:`, error);
      }
    }

    return task || null;
  }

  /**
   * Get tasks for a user with filtering and real-time status
   */
  async getUserTasks(
    userId: string,
    filters?: {
      status?: string[];
      priority?: string[];
      pipelineId?: string;
      agentId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<EnhancedTaskData[]> {
    try {
      const whereClause: any = {
        userId,
        deletedAt: null,
      };

      if (filters?.status) {
        whereClause.status = { in: filters.status };
      }

      if (filters?.priority) {
        whereClause.priority = { in: filters.priority };
      }

      if (filters?.pipelineId) {
        whereClause.pipelineId = filters.pipelineId;
      }

      if (filters?.agentId) {
        whereClause.agentId = filters.agentId;
      }

      const tasks = await this.dbService.task.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        include: {
          taskExecutions: {
            orderBy: { startedAt: 'desc' },
            take: 1,
          },
        },
      });

      const enhancedTasks: EnhancedTaskData[] = [];

      for (const task of tasks) {
        let enhancedTask = this.taskCache.get(task.id);

        if (!enhancedTask) {
          enhancedTask = {
            id: task.id,
            type: task.type,
            status: task.status as any,
            priority: task.priority as any,
            data: task.data,
            result: task.result,
            error: task.error,
            startTime: task.startTime,
            endTime: task.endTime,
            pipelineId: task.pipelineId,
            agentId: task.agentId || undefined,
            userId: task.userId,
            version: 1,
            lastModified: task.updatedAt,
            modifiedBy: 'system',
            syncStatus: 'synced',
          };

          this.taskCache.set(task.id, enhancedTask);
        }

        enhancedTasks.push(enhancedTask);
      }

      return enhancedTasks;
    } catch (error) {
      this.logger.error(`Failed to get tasks for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get task dependencies and dependents
   */
  async getTaskRelationships(taskId: string): Promise<{
    dependencies: string[];
    dependents: string[];
    workflowIntegration?: WorkflowTaskIntegration;
  }> {
    const dependencies = await this.taskSyncService.getTaskDependencies(taskId);
    const dependents = await this.taskSyncService.getTaskDependents(taskId);
    const workflowIntegration = this.workflowIntegrations.get(taskId);

    return {
      dependencies,
      dependents,
      workflowIntegration,
    };
  }

  /**
   * Private helper methods
   */
  private async syncTaskData(task: EnhancedTaskData, tenantId?: string): Promise<void> {
    const syncData: TaskSyncData = {
      id: task.id,
      type: task.type,
      status: task.status,
      priority: task.priority,
      data: task.data,
      result: task.result,
      error: task.error,
      startTime: task.startTime,
      endTime: task.endTime,
      pipelineId: task.pipelineId,
      agentId: task.agentId,
      userId: task.userId,
      dependencies: task.dependencies,
      metadata: {
        ...task.metadata,
        progress: task.progress,
        estimatedDuration: task.estimatedDuration,
        actualDuration: task.actualDuration,
        tags: task.tags,
      },
      version: task.version,
      lastModified: task.lastModified,
      modifiedBy: task.modifiedBy,
    };

    await this.taskSyncService.syncTaskData(syncData, tenantId);

    // Update sync status
    task.syncStatus = 'synced';
  }

  private async handleStatusChange(
    updatedTask: EnhancedTaskData,
    previousStatus: string,
    tenantId?: string
  ): Promise<void> {
    // Handle workflow integration when task status changes
    const workflowIntegration = this.workflowIntegrations.get(updatedTask.id);

    if (workflowIntegration) {
      // Update workflow step status
      try {
        await this.dbService.workflowStep.update({
          where: { id: workflowIntegration.workflowStepId },
          data: {
            lastExecutedAt: new Date(),
            statistics: {
              lastStatus: updatedTask.status,
              lastExecution: new Date(),
              previousStatus,
            },
          },
        });

        // If task completed, check if workflow can proceed
        if (updatedTask.status === 'COMPLETED') {
          await this.checkWorkflowProgression(workflowIntegration, tenantId);
        }
      } catch (error) {
        this.logger.error('Failed to update workflow integration:', error);
      }
    }
  }

  private async checkWorkflowProgression(
    integration: WorkflowTaskIntegration,
    tenantId?: string
  ): Promise<void> {
    // Check if all previous steps in workflow are completed
    // This is a simplified implementation - can be enhanced with more complex workflow logic
    try {
      const workflow = await this.dbService.workflow.findUnique({
        where: { id: integration.workflowId },
        include: {
          steps: {
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!workflow) return;

      // Find next steps that can be executed
      const currentStepIndex = workflow.steps.findIndex(
        (step) => step.id === integration.workflowStepId
      );

      if (currentStepIndex >= 0 && currentStepIndex < workflow.steps.length - 1) {
        const nextStep = workflow.steps[currentStepIndex + 1];

        // Check if next step has a corresponding task
        const nextTask = this.taskCache.get(nextStep.id);
        if (nextTask && nextTask.status === 'PENDING') {
          // Trigger next task
          await this.updateTask(
            nextTask.id,
            { status: 'PENDING' }, // Keep as pending but mark as ready
            'workflow_system',
            tenantId
          );
        }
      }
    } catch (error) {
      this.logger.error('Failed to check workflow progression:', error);
    }
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Public API methods for monitoring and management
   */
  async getTaskSyncMetrics(): Promise<any> {
    return {
      cachedTasks: this.taskCache.size,
      activeExecutions: this.executionContexts.size,
      workflowIntegrations: this.workflowIntegrations.size,
      syncStatuses: {
        synced: Array.from(this.taskCache.values()).filter((t) => t.syncStatus === 'synced').length,
        pending: Array.from(this.taskCache.values()).filter((t) => t.syncStatus === 'pending')
          .length,
        conflict: Array.from(this.taskCache.values()).filter((t) => t.syncStatus === 'conflict')
          .length,
      },
    };
  }

  async getActiveExecutions(): Promise<TaskExecutionContext[]> {
    return Array.from(this.executionContexts.values());
  }

  async refreshTaskCache(): Promise<void> {
    this.taskCache.clear();
    await this.loadExistingTasks();
  }
}
