"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.drizzleTaskRepository = exports.DrizzleTaskRepository = void 0;
/**
 * Task Repository - Drizzle ORM Implementation
 * Provides data access for Task and Pipeline entities
 */
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../client");
const schema_1 = require("../schema");
/**
 * Task Repository - provides data access for Task entities
 */
class DrizzleTaskRepository {
    /**
     * Create a new task
     */
    async createTask(data) {
        const [task] = await client_1.db.insert(schema_1.tasks).values(data).returning();
        return task;
    }
    /**
     * Find tasks created after a certain date
     */
    async findTasksCreatedAfter(date, userId) {
        return client_1.db
            .select()
            .from(schema_1.tasks)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(schema_1.tasks.createdAt, date), (0, drizzle_orm_1.eq)(schema_1.tasks.userId, userId), (0, drizzle_orm_1.isNull)(schema_1.tasks.deletedAt)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.tasks.createdAt));
    }
    /**
     * Find task by ID
     */
    async findTaskById(id) {
        const [task] = await client_1.db
            .select()
            .from(schema_1.tasks)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.id, id), (0, drizzle_orm_1.isNull)(schema_1.tasks.deletedAt)));
        return task ?? null;
    }
    /**
     * Find tasks by user ID
     */
    async findTasksByUserId(userId) {
        return client_1.db
            .select()
            .from(schema_1.tasks)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.userId, userId), (0, drizzle_orm_1.isNull)(schema_1.tasks.deletedAt)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.tasks.createdAt));
    }
    /**
     * Find tasks by pipeline ID
     */
    async findTasksByPipelineId(pipelineId) {
        return client_1.db
            .select()
            .from(schema_1.tasks)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.pipelineId, pipelineId), (0, drizzle_orm_1.isNull)(schema_1.tasks.deletedAt)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.tasks.createdAt));
    }
    /**
     * Find tasks by status (unscoped - for system services)
     */
    async findTasksByStatusUnscoped(status) {
        return client_1.db
            .select()
            .from(schema_1.tasks)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.status, status), (0, drizzle_orm_1.isNull)(schema_1.tasks.deletedAt)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.tasks.createdAt));
    }
    /**
     * Find tasks by status
     */
    async findTasksByStatus(status, userId) {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.tasks.status, status), (0, drizzle_orm_1.isNull)(schema_1.tasks.deletedAt)];
        conditions.push((0, drizzle_orm_1.eq)(schema_1.tasks.userId, userId));
        return client_1.db
            .select()
            .from(schema_1.tasks)
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.tasks.createdAt));
    }
    /**
     * Find tasks by multiple statuses
     */
    async findTasksByStatuses(statuses, userId) {
        const conditions = [(0, drizzle_orm_1.inArray)(schema_1.tasks.status, statuses), (0, drizzle_orm_1.isNull)(schema_1.tasks.deletedAt)];
        conditions.push((0, drizzle_orm_1.eq)(schema_1.tasks.userId, userId));
        return client_1.db
            .select()
            .from(schema_1.tasks)
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.tasks.createdAt));
    }
    /**
     * Find tasks assigned to agent
     */
    async findTasksAssignedToAgent(agentId) {
        return client_1.db
            .select()
            .from(schema_1.tasks)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.assignedToId, agentId), (0, drizzle_orm_1.isNull)(schema_1.tasks.deletedAt)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.tasks.createdAt));
    }
    /**
     * Find tasks by priority
     */
    async findTasksByPriority(priority, userId) {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.tasks.priority, priority), (0, drizzle_orm_1.isNull)(schema_1.tasks.deletedAt)];
        conditions.push((0, drizzle_orm_1.eq)(schema_1.tasks.userId, userId));
        return client_1.db
            .select()
            .from(schema_1.tasks)
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.tasks.createdAt));
    }
    /**
     * Update task
     */
    async updateTask(id, data) {
        const [task] = await client_1.db
            .update(schema_1.tasks)
            .set({ ...data, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.tasks.id, id))
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
        const [task] = await client_1.db.update(schema_1.tasks).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.tasks.id, id)).returning();
        return task ?? null;
    }
    /**
     * Assign task to agent
     */
    async assignTask(id, agentId) {
        const [task] = await client_1.db
            .update(schema_1.tasks)
            .set({ assignedToId: agentId, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.tasks.id, id))
            .returning();
        return task ?? null;
    }
    /**
     * Soft delete task
     */
    async softDeleteTask(id) {
        const result = await client_1.db
            .update(schema_1.tasks)
            .set({ deletedAt: new Date(), updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.tasks.id, id))
            .returning();
        return result.length > 0;
    }
    /**
     * Hard delete task
     */
    async hardDeleteTask(id) {
        const result = await client_1.db.delete(schema_1.tasks).where((0, drizzle_orm_1.eq)(schema_1.tasks.id, id)).returning();
        return result.length > 0;
    }
    /**
     * Count tasks by status
     */
    async countTasksByStatus(userId) {
        const conditions = [(0, drizzle_orm_1.isNull)(schema_1.tasks.deletedAt)];
        if (userId) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.tasks.userId, userId));
        }
        const result = await client_1.db
            .select({
            status: schema_1.tasks.status,
            count: (0, drizzle_orm_1.sql) `cast(count(*) as integer)`,
        })
            .from(schema_1.tasks)
            .where((0, drizzle_orm_1.and)(...conditions))
            .groupBy(schema_1.tasks.status);
        return result;
    }
    /**
     * Create a pipeline
     */
    async createPipeline(data) {
        const [pipeline] = await client_1.db.insert(schema_1.pipelines).values(data).returning();
        return pipeline;
    }
    /**
     * Find pipeline by ID
     */
    async findPipelineById(id) {
        const [pipeline] = await client_1.db
            .select()
            .from(schema_1.pipelines)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.pipelines.id, id), (0, drizzle_orm_1.isNull)(schema_1.pipelines.deletedAt)));
        return pipeline ?? null;
    }
    /**
     * Find pipelines by user ID
     */
    async findPipelinesByUserId(userId) {
        return client_1.db
            .select()
            .from(schema_1.pipelines)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.pipelines.userId, userId), (0, drizzle_orm_1.isNull)(schema_1.pipelines.deletedAt)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.pipelines.createdAt));
    }
    /**
     * Update pipeline
     */
    async updatePipeline(id, data) {
        const [pipeline] = await client_1.db
            .update(schema_1.pipelines)
            .set({ ...data, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.pipelines.id, id))
            .returning();
        return pipeline ?? null;
    }
    /**
     * Soft delete pipeline
     */
    async softDeletePipeline(id) {
        const result = await client_1.db
            .update(schema_1.pipelines)
            .set({ deletedAt: new Date(), updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.pipelines.id, id))
            .returning();
        return result.length > 0;
    }
    /**
     * Create task execution
     */
    async createExecution(data) {
        const [execution] = await client_1.db.insert(schema_1.taskExecutions).values(data).returning();
        return execution;
    }
    /**
     * Find executions by task ID
     */
    async findExecutionsByTaskId(taskId) {
        return client_1.db
            .select()
            .from(schema_1.taskExecutions)
            .where((0, drizzle_orm_1.eq)(schema_1.taskExecutions.taskId, taskId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.taskExecutions.startedAt));
    }
    /**
     * Delete all executions for a task.
     */
    async deleteExecutionsByTaskId(taskId) {
        const deleted = await client_1.db
            .delete(schema_1.taskExecutions)
            .where((0, drizzle_orm_1.eq)(schema_1.taskExecutions.taskId, taskId))
            .returning();
        return deleted.length;
    }
    /**
     * Update execution
     */
    async updateExecution(id, data) {
        const [execution] = await client_1.db
            .update(schema_1.taskExecutions)
            .set(data)
            .where((0, drizzle_orm_1.eq)(schema_1.taskExecutions.id, id))
            .returning();
        return execution ?? null;
    }
    /**
     * Complete execution
     */
    async completeExecution(id, output) {
        const [execution] = await client_1.db
            .update(schema_1.taskExecutions)
            .set({
            status: 'COMPLETED',
            output,
            completedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.taskExecutions.id, id))
            .returning();
        return execution ?? null;
    }
    /**
     * Fail execution
     */
    async failExecution(id, error) {
        const [execution] = await client_1.db
            .update(schema_1.taskExecutions)
            .set({
            status: 'FAILED',
            error,
            completedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.taskExecutions.id, id))
            .returning();
        return execution ?? null;
    }
}
exports.DrizzleTaskRepository = DrizzleTaskRepository;
// Export singleton instance
exports.drizzleTaskRepository = new DrizzleTaskRepository();
//# sourceMappingURL=task.repository.js.map