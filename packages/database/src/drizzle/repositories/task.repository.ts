/**
 * Task Repository - Drizzle ORM Implementation
 * Provides data access for Task and Pipeline entities
 */
import { and, desc, eq, gte, inArray, isNull, sql } from 'drizzle-orm';
import { db } from '../client.js';
import { pipelines, taskExecutions, tasks } from '../schema.js';
import type {
  NewPipeline,
  NewTask,
  NewTaskExecution,
  Pipeline,
  Task,
  TaskExecution,
} from '../types/index.js';

type TaskScope = {
  tenantId?: string;
  workspaceId?: string;
};

/**
 * Task Repository - provides data access for Task entities
 */
export class DrizzleTaskRepository {
  private appendTaskScopeConditions(conditions: any[], scope?: TaskScope): void {
    if (!scope) return;
    if (scope.tenantId) {
      conditions.push(eq(tasks.tenantId, scope.tenantId));
    }
    if (scope.workspaceId) {
      conditions.push(eq(tasks.workspaceId, scope.workspaceId));
    }
  }

  private appendPipelineScopeConditions(conditions: any[], scope?: TaskScope): void {
    if (!scope) return;
    if (scope.tenantId) {
      conditions.push(eq(pipelines.tenantId, scope.tenantId));
    }
    if (scope.workspaceId) {
      conditions.push(eq(pipelines.workspaceId, scope.workspaceId));
    }
  }

  /**
   * Create a new task
   */
  async createTask(data: NewTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(data).returning();
    return task;
  }

  /**
   * Find tasks created after a certain date
   */
  async findTasksCreatedAfter(date: Date, userId: string, scope?: TaskScope): Promise<Task[]> {
    const conditions = [
      gte(tasks.createdAt, date),
      eq(tasks.userId, userId),
      isNull(tasks.deletedAt),
    ];
    this.appendTaskScopeConditions(conditions, scope);

    return db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(desc(tasks.createdAt));
  }

  /**
   * Find task by ID
   */
  async findTaskById(id: string, scope?: TaskScope): Promise<Task | null> {
    const conditions = [eq(tasks.id, id), isNull(tasks.deletedAt)];
    this.appendTaskScopeConditions(conditions, scope);

    const [task] = await db
      .select()
      .from(tasks)
      .where(and(...conditions));

    return task ?? null;
  }

  /**
   * Find tasks by user ID
   */
  async findTasksByUserId(userId: string, scope?: TaskScope): Promise<Task[]> {
    const conditions = [eq(tasks.userId, userId), isNull(tasks.deletedAt)];
    this.appendTaskScopeConditions(conditions, scope);

    return db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(desc(tasks.createdAt));
  }

  /**
   * Find tasks by pipeline ID
   */
  async findTasksByPipelineId(pipelineId: string): Promise<Task[]> {
    return db
      .select()
      .from(tasks)
      .where(and(eq(tasks.pipelineId, pipelineId), isNull(tasks.deletedAt)))
      .orderBy(desc(tasks.createdAt));
  }

  /**
   * Find tasks by status (unscoped - for system services)
   */
  async findTasksByStatusUnscoped(status: string): Promise<Task[]> {
    return db
      .select()
      .from(tasks)
      .where(and(eq(tasks.status, status as any), isNull(tasks.deletedAt)))
      .orderBy(desc(tasks.createdAt));
  }

  /**
   * Find tasks by status
   */
  async findTasksByStatus(status: string, userId?: string, scope?: TaskScope): Promise<Task[]> {
    const conditions = [eq(tasks.status, status as any), isNull(tasks.deletedAt)];

    if (userId) {
      conditions.push(eq(tasks.userId, userId));
    }
    this.appendTaskScopeConditions(conditions, scope);

    return db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(desc(tasks.createdAt));
  }

  /**
   * Find tasks by multiple statuses
   */
  async findTasksByStatuses(
    statuses: string[],
    userId?: string,
    scope?: TaskScope
  ): Promise<Task[]> {
    const conditions = [inArray(tasks.status, statuses as any[]), isNull(tasks.deletedAt)];

    if (userId) {
      conditions.push(eq(tasks.userId, userId));
    }
    this.appendTaskScopeConditions(conditions, scope);

    return db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(desc(tasks.createdAt));
  }

  /**
   * Find tasks assigned to agent
   */
  async findTasksAssignedToAgent(agentId: string): Promise<Task[]> {
    return db
      .select()
      .from(tasks)
      .where(and(eq(tasks.assignedToId, agentId), isNull(tasks.deletedAt)))
      .orderBy(desc(tasks.createdAt));
  }

  /**
   * Find tasks by priority
   */
  async findTasksByPriority(priority: string, userId?: string, scope?: TaskScope): Promise<Task[]> {
    const conditions = [eq(tasks.priority, priority as any), isNull(tasks.deletedAt)];

    if (userId) {
      conditions.push(eq(tasks.userId, userId));
    }
    this.appendTaskScopeConditions(conditions, scope);

    return db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(desc(tasks.createdAt));
  }

  /**
   * Update task
   */
  async updateTask(id: string, data: Partial<NewTask>): Promise<Task | null> {
    const [task] = await db
      .update(tasks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();

    return task ?? null;
  }

  /**
   * Update task status
   */
  async updateTaskStatus(id: string, status: string): Promise<Task | null> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    // Set timestamps based on status
    if (status === 'IN_PROGRESS' || status === 'RUNNING') {
      updateData.startTime = new Date();
    } else if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') {
      updateData.endTime = new Date();
    }

    const [task] = await db.update(tasks).set(updateData).where(eq(tasks.id, id)).returning();

    return task ?? null;
  }

  /**
   * Assign task to agent
   */
  async assignTask(id: string, agentId: string): Promise<Task | null> {
    const [task] = await db
      .update(tasks)
      .set({ assignedToId: agentId, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();

    return task ?? null;
  }

  /**
   * Soft delete task
   */
  async softDeleteTask(id: string): Promise<boolean> {
    const result = await db
      .update(tasks)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();

    return result.length > 0;
  }

  /**
   * Hard delete task
   */
  async hardDeleteTask(id: string): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id)).returning();
    return result.length > 0;
  }

  /**
   * Count tasks by status
   */
  async countTasksByStatus(
    userId?: string,
    scope?: TaskScope
  ): Promise<{ status: string; count: number }[]> {
    const conditions = [isNull(tasks.deletedAt)];

    if (userId) {
      conditions.push(eq(tasks.userId, userId));
    }
    this.appendTaskScopeConditions(conditions, scope);

    const result = await db
      .select({
        status: tasks.status,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(tasks)
      .where(and(...conditions))
      .groupBy(tasks.status);

    return result;
  }

  /**
   * Create a pipeline
   */
  async createPipeline(data: NewPipeline): Promise<Pipeline> {
    const [pipeline] = await db.insert(pipelines).values(data).returning();
    return pipeline;
  }

  /**
   * Find pipeline by ID
   */
  async findPipelineById(id: string): Promise<Pipeline | null> {
    const [pipeline] = await db
      .select()
      .from(pipelines)
      .where(and(eq(pipelines.id, id), isNull(pipelines.deletedAt)));

    return pipeline ?? null;
  }

  /**
   * Find pipelines by user ID
   */
  async findPipelinesByUserId(userId: string, scope?: TaskScope): Promise<Pipeline[]> {
    const conditions = [eq(pipelines.userId, userId), isNull(pipelines.deletedAt)];
    this.appendPipelineScopeConditions(conditions, scope);

    return db
      .select()
      .from(pipelines)
      .where(and(...conditions))
      .orderBy(desc(pipelines.createdAt));
  }

  /**
   * Update pipeline
   */
  async updatePipeline(id: string, data: Partial<NewPipeline>): Promise<Pipeline | null> {
    const [pipeline] = await db
      .update(pipelines)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(pipelines.id, id))
      .returning();

    return pipeline ?? null;
  }

  /**
   * Soft delete pipeline
   */
  async softDeletePipeline(id: string): Promise<boolean> {
    const result = await db
      .update(pipelines)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(pipelines.id, id))
      .returning();

    return result.length > 0;
  }

  /**
   * Create task execution
   */
  async createExecution(data: NewTaskExecution): Promise<TaskExecution> {
    const [execution] = await db.insert(taskExecutions).values(data).returning();
    return execution;
  }

  /**
   * Find executions by task ID
   */
  async findExecutionsByTaskId(taskId: string): Promise<TaskExecution[]> {
    return db
      .select()
      .from(taskExecutions)
      .where(eq(taskExecutions.taskId, taskId))
      .orderBy(desc(taskExecutions.startedAt));
  }

  /**
   * Delete all executions for a task.
   */
  async deleteExecutionsByTaskId(taskId: string): Promise<number> {
    const deleted = await db
      .delete(taskExecutions)
      .where(eq(taskExecutions.taskId, taskId))
      .returning();
    return deleted.length;
  }

  /**
   * Update execution
   */
  async updateExecution(
    id: string,
    data: Partial<NewTaskExecution>
  ): Promise<TaskExecution | null> {
    const [execution] = await db
      .update(taskExecutions)
      .set(data)
      .where(eq(taskExecutions.id, id))
      .returning();

    return execution ?? null;
  }

  /**
   * Complete execution
   */
  async completeExecution(id: string, output: any): Promise<TaskExecution | null> {
    const [execution] = await db
      .update(taskExecutions)
      .set({
        status: 'COMPLETED',
        output,
        completedAt: new Date(),
      })
      .where(eq(taskExecutions.id, id))
      .returning();

    return execution ?? null;
  }

  /**
   * Fail execution
   */
  async failExecution(id: string, error: string): Promise<TaskExecution | null> {
    const [execution] = await db
      .update(taskExecutions)
      .set({
        status: 'FAILED',
        error,
        completedAt: new Date(),
      })
      .where(eq(taskExecutions.id, id))
      .returning();

    return execution ?? null;
  }
}

// Export singleton instance
export const drizzleTaskRepository = new DrizzleTaskRepository();
