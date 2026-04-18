// @ts-nocheck
/**
 * Task Service - Migrated to Drizzle ORM
 * Provides task management operations using the Drizzle repository
 */
import { Injectable, Logger } from '@nestjs/common';
// @ts-ignore
// @ts-ignore
import type { NewTask, NewTaskExecution, Task, TaskExecution } from '@the-new-fuse/database';
import { DatabaseService } from '@the-new-fuse/database';
import type { TaskExecutionLogEntry, TaskExecutionLogPayload } from './task.types';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Find tasks that are stuck (running for more than 30 minutes)
   */
  async findStuckTasks(userId: string): Promise<Task[]> {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const allTasks = await this.db.tasks.findTasksByStatus('IN_PROGRESS', userId);
    return allTasks.filter((task) => task.startTime && new Date(task.startTime) < thirtyMinutesAgo);
  }

  /**
   * Find tasks that are stuck across all users.
   */
  async findStuckTasksUnscoped(): Promise<Task[]> {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const allTasks = await this.db.tasks.findTasksByStatusUnscoped('IN_PROGRESS');
    return allTasks.filter((task) => task.startTime && new Date(task.startTime) < thirtyMinutesAgo);
  }

  /**
   * Find all active tasks across all users (for system services)
   */
  async findActiveTasks(): Promise<Task[]> {
    try {
      return await this.db.tasks.findTasksByStatusUnscoped('IN_PROGRESS');
    } catch (error) {
      if (!this.isLegacyTaskSchemaError(error)) {
        throw error;
      }

      this.logger.warn(
        'Falling back to legacy tasks schema for active task discovery (missing modern task columns).'
      );
      return this.queryLegacyTasksByStatus('IN_PROGRESS');
    }
  }

  /**
   * Update a task
   */
  async updateTask(taskId: string, updates: Partial<NewTask>): Promise<Task | null> {
    return this.db.tasks.updateTask(taskId, updates);
  }

  /**
   * Get task by ID
   */
  async getTaskById(taskId: string): Promise<Task | null> {
    return this.db.tasks.findTaskById(taskId);
  }

  /**
   * Get task by ID scoped to a specific user.
   */
  async getTaskByIdForUser(taskId: string, userId: string): Promise<Task | null> {
    const task = await this.getTaskById(taskId);
    if (!task) return null;
    return task.userId === userId ? task : null;
  }

  /**
   * Create a new task
   */
  async createTask(data: NewTask): Promise<Task> {
    return this.db.tasks.createTask(data);
  }

  /**
   * List tasks for a user with optional status filter and pagination.
   */
  async listTasks(
    userId: string,
    options?: { status?: string; page?: number; limit?: number }
  ): Promise<{ tasks: Task[]; total: number }> {
    const { status, page = 1, limit = 20 } = options || {};
    const allTasks = status
      ? await this.db.tasks.findTasksByStatus(status, userId)
      : await this.db.tasks.findTasksByUserId(userId);

    const safePage = Math.max(page, 1);
    const safeLimit = Math.max(limit, 1);
    const offset = (safePage - 1) * safeLimit;
    const paged = allTasks.slice(offset, offset + safeLimit);

    return {
      tasks: paged,
      total: allTasks.length,
    };
  }

  /**
   * Get pending tasks ordered by priority
   */
  async getPendingTasks(userId: string): Promise<Task[]> {
    const tasks = await this.db.tasks.findTasksByStatus('PENDING', userId);
    const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return tasks.sort((a, b) => {
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 4;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 4;
      return aPriority - bPriority;
    });
  }

  /**
   * Get task executions for a task
   */
  async getTaskExecutions(taskId: string): Promise<TaskExecution[]> {
    return this.db.tasks.findExecutionsByTaskId(taskId);
  }

  /**
   * Convert task execution records into normalized execution logs.
   */
  async getExecutionLogs(taskId: string): Promise<TaskExecutionLogEntry[]> {
    const executions = await this.getTaskExecutions(taskId);
    return executions
      .map((execution) => this.mapExecutionToLog(execution))
      .filter((entry): entry is TaskExecutionLogEntry => entry !== null);
  }

  /**
   * Append an execution log entry by recording a task execution row.
   */
  async appendExecutionLog(
    taskId: string,
    payload: TaskExecutionLogPayload
  ): Promise<TaskExecutionLogEntry> {
    const now = new Date();
    const logEntry: TaskExecutionLogEntry = {
      id: `log_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      level: payload.level,
      message: payload.message,
      actor: payload.actor,
      source: payload.source,
      stage: payload.stage,
      metadata: payload.metadata ?? {},
      timestamp: now.toISOString(),
    };

    await this.db.tasks.createExecution({
      taskId,
      status: `LOG_${payload.level.toUpperCase()}`,
      output: logEntry as any,
      startedAt: now,
      completedAt: now,
    });

    return logEntry;
  }

  /**
   * Delete tasks by pipeline ID
   */
  async deleteTasks(pipelineId: string): Promise<void> {
    const tasks = await this.db.tasks.findTasksByPipelineId(pipelineId);
    for (const task of tasks) {
      await this.db.tasks.hardDeleteTask(task.id);
    }
  }

  /**
   * Delete task executions by task ID
   */
  async deleteTaskExecutions(taskId: string): Promise<void> {
    await this.db.tasks.deleteExecutionsByTaskId(taskId);
  }

  /**
   * Update task status
   */
  async updateTaskStatus(taskId: string, status: string): Promise<Task | null> {
    try {
      return await this.db.tasks.updateTaskStatus(taskId, status);
    } catch (error) {
      if (!this.isLegacyTaskSchemaError(error)) {
        throw error;
      }

      this.logger.warn(
        `Falling back to legacy tasks schema for task status update (task=${taskId}, status=${status}).`
      );
      return this.updateLegacyTaskStatus(taskId, status);
    }
  }

  /**
   * Assign task to an agent
   */
  async assignTask(taskId: string, agentId: string): Promise<Task | null> {
    return this.db.tasks.assignTask(taskId, agentId);
  }

  /**
   * Create a task execution record
   */
  async createExecution(data: NewTaskExecution): Promise<TaskExecution> {
    return this.db.tasks.createExecution(data);
  }

  /**
   * Complete a task execution
   */
  async completeExecution(executionId: string, output: any): Promise<TaskExecution | null> {
    return this.db.tasks.completeExecution(executionId, output);
  }

  /**
   * Fail a task execution
   */
  async failExecution(executionId: string, error: string): Promise<TaskExecution | null> {
    return this.db.tasks.failExecution(executionId, error);
  }

  /**
   * Get task count by status
   */
  async countTasksByStatus(userId?: string): Promise<{ status: string; count: number }[]> {
    return this.db.tasks.countTasksByStatus(userId);
  }

  private mapExecutionToLog(execution: TaskExecution): TaskExecutionLogEntry | null {
    const output = execution.output as Record<string, unknown> | null;
    if (!output || typeof output !== 'object') return null;

    const level = output.level;
    const message = output.message;
    const actor = output.actor;
    const source = output.source;
    const timestamp = output.timestamp;

    if (
      (level !== 'info' && level !== 'warn' && level !== 'error') ||
      typeof message !== 'string' ||
      typeof actor !== 'string' ||
      typeof source !== 'string' ||
      typeof timestamp !== 'string'
    ) {
      return null;
    }

    return {
      id: typeof output.id === 'string' ? output.id : execution.id,
      level,
      message,
      actor,
      source,
      stage: typeof output.stage === 'string' ? output.stage : undefined,
      metadata:
        output.metadata && typeof output.metadata === 'object'
          ? (output.metadata as Record<string, unknown>)
          : {},
      timestamp,
    };
  }
}
