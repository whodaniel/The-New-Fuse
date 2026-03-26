/**
 * Task Service - Migrated to Drizzle ORM
 * Provides task management operations using the Drizzle repository
 */
import { Injectable, Logger } from '@nestjs/common';
import type { NewTask, NewTaskExecution, Task, TaskExecution } from '@the-new-fuse/database';
import { DatabaseService, sql } from '@the-new-fuse/database';
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
    const allTasks = await this.findActiveTasksByUser(userId);
    return allTasks.filter((task) => {
      const startedAt = this.getTaskStartTime(task);
      return startedAt ? startedAt < thirtyMinutesAgo : false;
    });
  }

  /**
   * Find tasks that are stuck across all users.
   */
  async findStuckTasksUnscoped(): Promise<Task[]> {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const allTasks = await this.findActiveTasks();
    return allTasks.filter((task) => {
      const startedAt = this.getTaskStartTime(task);
      return startedAt ? startedAt < thirtyMinutesAgo : false;
    });
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

    try {
      await this.db.tasks.createExecution({
        taskId,
        status: `LOG_${payload.level.toUpperCase()}`,
        output: logEntry as any,
        startedAt: now,
        completedAt: now,
      });
    } catch (error) {
      if (!this.isLegacyExecutionSchemaError(error)) {
        throw error;
      }

      await this.appendLegacyExecutionLog(taskId, logEntry);
    }

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

  private async findActiveTasksByUser(userId: string): Promise<Task[]> {
    try {
      return await this.db.tasks.findTasksByStatus('IN_PROGRESS', userId);
    } catch (error) {
      if (!this.isLegacyTaskSchemaError(error)) {
        throw error;
      }

      this.logger.warn(
        `Falling back to legacy tasks schema for user active task discovery (user=${userId}).`
      );
      return this.queryLegacyTasksByStatus('IN_PROGRESS', userId);
    }
  }

  private normalizeSqlRows(result: unknown): Array<Record<string, unknown>> {
    if (Array.isArray(result)) {
      return result.map((row) => this.asObject(row));
    }

    const payload = this.asObject(result);
    if (Array.isArray(payload.rows)) {
      return payload.rows.map((row) => this.asObject(row));
    }

    return [];
  }

  private asObject(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private asStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.map((entry) => String(entry ?? '').trim()).filter((entry) => entry.length > 0);
  }

  private getTaskStartTime(task: Partial<Task> & Record<string, unknown>): Date | null {
    const candidates = [task.startTime, task.updatedAt, task.createdAt] as Array<unknown>;
    for (const candidate of candidates) {
      if (!candidate) continue;
      const parsed = candidate instanceof Date ? candidate : new Date(String(candidate));
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return null;
  }

  private isLegacyTaskSchemaError(error: unknown): boolean {
    const message = String((error as Error | undefined)?.message || '').toLowerCase();
    return (
      message.includes('column "data" does not exist') ||
      message.includes('column "user_id" does not exist') ||
      message.includes('column "deleted_at" does not exist') ||
      message.includes('column "start_time" does not exist') ||
      message.includes('column "end_time" does not exist')
    );
  }

  private isLegacyExecutionSchemaError(error: unknown): boolean {
    const message = String((error as Error | undefined)?.message || '').toLowerCase();
    return (
      message.includes('relation "task_executions" does not exist') ||
      message.includes('column "task_id" does not exist') ||
      message.includes('column "started_at" does not exist') ||
      message.includes('column "completed_at" does not exist') ||
      this.isLegacyTaskSchemaError(error)
    );
  }

  private mapLegacyTaskRow(row: Record<string, unknown>): Task {
    const metadata = this.asObject(row.metadata);
    const normalized: Record<string, unknown> = {
      id: String(row.id || ''),
      title: String(row.title || ''),
      description: row.description ? String(row.description) : null,
      status: String(row.status || 'PENDING'),
      priority: String(row.priority || 'MEDIUM'),
      type: String(row.type || ''),
      createdAt: row.createdAt ? new Date(String(row.createdAt)) : new Date(),
      updatedAt: row.updatedAt ? new Date(String(row.updatedAt)) : new Date(),
      startTime: row.updatedAt
        ? new Date(String(row.updatedAt))
        : row.createdAt
          ? new Date(String(row.createdAt))
          : null,
      endTime: row.completedAt ? new Date(String(row.completedAt)) : null,
      userId: String(row.createdBy || ''),
      metadata,
      error: row.error ? String(row.error) : null,
      completedAt: row.completedAt ? new Date(String(row.completedAt)) : null,
      assignedToId: row.assignedTo ? String(row.assignedTo) : null,
      tags: this.asStringArray(row.tags),
      dependencies: this.asStringArray(row.dependencies),
    };
    return normalized as unknown as Task;
  }

  private async queryLegacyTasksByStatus(status: string, userId?: string): Promise<Task[]> {
    const result = userId
      ? await this.db.client.execute(sql`
          SELECT
            "id",
            "title",
            "description",
            "status",
            "priority",
            "type",
            "createdAt",
            "updatedAt",
            "completedAt",
            "createdBy",
            "assignedTo",
            "metadata",
            "tags",
            "dependencies",
            "error"
          FROM "tasks"
          WHERE "status" = ${status}
            AND "createdBy" = ${userId}
          ORDER BY "updatedAt" DESC
        `)
      : await this.db.client.execute(sql`
          SELECT
            "id",
            "title",
            "description",
            "status",
            "priority",
            "type",
            "createdAt",
            "updatedAt",
            "completedAt",
            "createdBy",
            "assignedTo",
            "metadata",
            "tags",
            "dependencies",
            "error"
          FROM "tasks"
          WHERE "status" = ${status}
          ORDER BY "updatedAt" DESC
        `);

    return this.normalizeSqlRows(result).map((row) => this.mapLegacyTaskRow(row));
  }

  private async updateLegacyTaskStatus(taskId: string, status: string): Promise<Task | null> {
    const nowIso = new Date().toISOString();
    const completedAt =
      status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED' ? nowIso : null;

    const result = await this.db.client.execute(sql`
      UPDATE "tasks"
      SET
        "status" = ${status},
        "updatedAt" = ${nowIso},
        "completedAt" = ${completedAt}
      WHERE "id" = ${taskId}
      RETURNING
        "id",
        "title",
        "description",
        "status",
        "priority",
        "type",
        "createdAt",
        "updatedAt",
        "completedAt",
        "createdBy",
        "assignedTo",
        "metadata",
        "tags",
        "dependencies",
        "error"
    `);

    const row = this.normalizeSqlRows(result)[0];
    return row ? this.mapLegacyTaskRow(row) : null;
  }

  private async appendLegacyExecutionLog(
    taskId: string,
    logEntry: TaskExecutionLogEntry
  ): Promise<void> {
    const currentRows = this.normalizeSqlRows(
      await this.db.client.execute(sql`
        SELECT "metadata"
        FROM "tasks"
        WHERE "id" = ${taskId}
        LIMIT 1
      `)
    );
    const current = currentRows[0];
    if (!current) {
      return;
    }

    const metadata = this.asObject(current.metadata);
    const currentLogs = Array.isArray(metadata.executionLogs) ? metadata.executionLogs : [];
    const nextLogs = [...currentLogs, logEntry].slice(-200);
    const nextMetadata = {
      ...metadata,
      executionLogs: nextLogs,
      lastExecutionLogAt: logEntry.timestamp,
    };

    await this.db.client.execute(sql`
      UPDATE "tasks"
      SET
        "metadata" = ${JSON.stringify(nextMetadata)}::jsonb,
        "updatedAt" = ${new Date().toISOString()}
      WHERE "id" = ${taskId}
    `);
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
