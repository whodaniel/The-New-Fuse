/**
 * Task Repository - Drizzle ORM Implementation
 * Provides data access for Task and Pipeline entities
 */
import { and, desc, eq, gte, inArray, isNull, sql } from 'drizzle-orm';
import { db } from '../client.js';
import { pipelines, taskExecutions, tasks } from '../schema.js';
/**
 * Task Repository - provides data access for Task entities
 */
export class DrizzleTaskRepository {
    appendTaskScopeConditions(conditions, scope) {
        if (!scope)
            return;
        if (scope.tenantId) {
            conditions.push(eq(tasks.tenantId, scope.tenantId));
        }
        if (scope.workspaceId) {
            conditions.push(eq(tasks.workspaceId, scope.workspaceId));
        }
    }
    appendPipelineScopeConditions(conditions, scope) {
        if (!scope)
            return;
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
    async createTask(data) {
        const [task] = await db.insert(tasks).values(data).returning();
        return task;
    }
    /**
     * Find tasks created after a certain date
     */
    async findTasksCreatedAfter(date, userId, scope) {
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
    async findTaskById(id, scope) {
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
    async findTasksByUserId(userId, scope) {
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
    async findTasksByPipelineId(pipelineId) {
        return db
            .select()
            .from(tasks)
            .where(and(eq(tasks.pipelineId, pipelineId), isNull(tasks.deletedAt)))
            .orderBy(desc(tasks.createdAt));
    }
    /**
     * Find tasks by status (unscoped - for system services)
     */
    async findTasksByStatusUnscoped(status) {
        return db
            .select()
            .from(tasks)
            .where(and(eq(tasks.status, status), isNull(tasks.deletedAt)))
            .orderBy(desc(tasks.createdAt));
    }
    /**
     * Find tasks by status
     */
    async findTasksByStatus(status, userId, scope) {
        const conditions = [eq(tasks.status, status), isNull(tasks.deletedAt)];
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
    async findTasksByStatuses(statuses, userId, scope) {
        const conditions = [inArray(tasks.status, statuses), isNull(tasks.deletedAt)];
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
    async findTasksAssignedToAgent(agentId) {
        return db
            .select()
            .from(tasks)
            .where(and(eq(tasks.assignedToId, agentId), isNull(tasks.deletedAt)))
            .orderBy(desc(tasks.createdAt));
    }
    /**
     * Find tasks by priority
     */
    async findTasksByPriority(priority, userId, scope) {
        const conditions = [eq(tasks.priority, priority), isNull(tasks.deletedAt)];
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
    async updateTask(id, data) {
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
    async updateTaskStatus(id, status) {
        const updateData = {
            status,
            updatedAt: new Date(),
        };
        // Set timestamps based on status
        if (status === 'IN_PROGRESS' || status === 'RUNNING') {
            updateData.startTime = new Date();
        }
        else if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') {
            updateData.endTime = new Date();
        }
        const [task] = await db.update(tasks).set(updateData).where(eq(tasks.id, id)).returning();
        return task ?? null;
    }
    /**
     * Assign task to agent
     */
    async assignTask(id, agentId) {
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
    async softDeleteTask(id) {
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
    async hardDeleteTask(id) {
        const result = await db.delete(tasks).where(eq(tasks.id, id)).returning();
        return result.length > 0;
    }
    /**
     * Count tasks by status
     */
    async countTasksByStatus(userId, scope) {
        const conditions = [isNull(tasks.deletedAt)];
        if (userId) {
            conditions.push(eq(tasks.userId, userId));
        }
        this.appendTaskScopeConditions(conditions, scope);
        const result = await db
            .select({
            status: tasks.status,
            count: sql `cast(count(*) as integer)`,
        })
            .from(tasks)
            .where(and(...conditions))
            .groupBy(tasks.status);
        return result;
    }
    /**
     * Create a pipeline
     */
    async createPipeline(data) {
        const [pipeline] = await db.insert(pipelines).values(data).returning();
        return pipeline;
    }
    /**
     * Find pipeline by ID
     */
    async findPipelineById(id) {
        const [pipeline] = await db
            .select()
            .from(pipelines)
            .where(and(eq(pipelines.id, id), isNull(pipelines.deletedAt)));
        return pipeline ?? null;
    }
    /**
     * Find pipelines by user ID
     */
    async findPipelinesByUserId(userId, scope) {
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
    async updatePipeline(id, data) {
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
    async softDeletePipeline(id) {
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
    async createExecution(data) {
        const [execution] = await db.insert(taskExecutions).values(data).returning();
        return execution;
    }
    /**
     * Find executions by task ID
     */
    async findExecutionsByTaskId(taskId) {
        return db
            .select()
            .from(taskExecutions)
            .where(eq(taskExecutions.taskId, taskId))
            .orderBy(desc(taskExecutions.startedAt));
    }
    /**
     * Delete all executions for a task.
     */
    async deleteExecutionsByTaskId(taskId) {
        const deleted = await db
            .delete(taskExecutions)
            .where(eq(taskExecutions.taskId, taskId))
            .returning();
        return deleted.length;
    }
    /**
     * Update execution
     */
    async updateExecution(id, data) {
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
    async completeExecution(id, output) {
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
    async failExecution(id, error) {
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
//# sourceMappingURL=task.repository.js.map