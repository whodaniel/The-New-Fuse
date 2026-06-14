"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TaskService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskService = void 0;
// @ts-nocheck
/**
 * Task Service - Migrated to Drizzle ORM
 * Provides task management operations using the Drizzle repository
 */
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
let TaskService = TaskService_1 = class TaskService {
    constructor(db) {
        this.db = db;
        this.logger = new common_1.Logger(TaskService_1.name);
    }
    /**
     * Find tasks that are stuck (running for more than 30 minutes)
     */
    async findStuckTasks(userId) {
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        const allTasks = await this.db.tasks.findTasksByStatus('IN_PROGRESS', userId);
        return allTasks.filter((task) => task.startTime && new Date(task.startTime) < thirtyMinutesAgo);
    }
    /**
     * Find tasks that are stuck across all users.
     */
    async findStuckTasksUnscoped() {
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        const allTasks = await this.db.tasks.findTasksByStatusUnscoped('IN_PROGRESS');
        return allTasks.filter((task) => task.startTime && new Date(task.startTime) < thirtyMinutesAgo);
    }
    /**
     * Find all active tasks across all users (for system services)
     */
    async findActiveTasks() {
        try {
            return await this.db.tasks.findTasksByStatusUnscoped('IN_PROGRESS');
        }
        catch (error) {
            if (!this.isLegacyTaskSchemaError(error)) {
                throw error;
            }
            this.logger.warn('Falling back to legacy tasks schema for active task discovery (missing modern task columns).');
            return this.queryLegacyTasksByStatus('IN_PROGRESS');
        }
    }
    /**
     * Update a task
     */
    async updateTask(taskId, updates) {
        return this.db.tasks.updateTask(taskId, updates);
    }
    /**
     * Get task by ID
     */
    async getTaskById(taskId, scope) {
        return this.db.tasks.findTaskById(taskId, scope);
    }
    /**
     * Get task by ID scoped to a specific user.
     */
    async getTaskByIdForUser(taskId, userId, scope) {
        const task = await this.getTaskById(taskId, scope);
        if (!task)
            return null;
        return task.userId === userId ? task : null;
    }
    /**
     * Create a new task
     */
    async createTask(data) {
        return this.db.tasks.createTask(data);
    }
    /**
     * List tasks for a user with optional status filter and pagination.
     */
    async listTasks(userId, options) {
        const { status, page = 1, limit = 20, tenantId, workspaceId } = options || {};
        const scope = { tenantId, workspaceId };
        const allTasks = status
            ? await this.db.tasks.findTasksByStatus(status, userId, scope)
            : await this.db.tasks.findTasksByUserId(userId, scope);
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
    async getPendingTasks(userId) {
        const tasks = await this.db.tasks.findTasksByStatus('PENDING', userId);
        const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return tasks.sort((a, b) => {
            const aPriority = priorityOrder[a.priority] ?? 4;
            const bPriority = priorityOrder[b.priority] ?? 4;
            return aPriority - bPriority;
        });
    }
    /**
     * Get task executions for a task
     */
    async getTaskExecutions(taskId) {
        return this.db.tasks.findExecutionsByTaskId(taskId);
    }
    /**
     * Convert task execution records into normalized execution logs.
     */
    async getExecutionLogs(taskId) {
        const executions = await this.getTaskExecutions(taskId);
        return executions
            .map((execution) => this.mapExecutionToLog(execution))
            .filter((entry) => entry !== null);
    }
    /**
     * Append an execution log entry by recording a task execution row.
     */
    async appendExecutionLog(taskId, payload) {
        const now = new Date();
        const logEntry = {
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
            output: logEntry,
            startedAt: now,
            completedAt: now,
        });
        return logEntry;
    }
    /**
     * Delete tasks by pipeline ID
     */
    async deleteTasks(pipelineId) {
        const tasks = await this.db.tasks.findTasksByPipelineId(pipelineId);
        for (const task of tasks) {
            await this.db.tasks.hardDeleteTask(task.id);
        }
    }
    /**
     * Delete task executions by task ID
     */
    async deleteTaskExecutions(taskId) {
        await this.db.tasks.deleteExecutionsByTaskId(taskId);
    }
    /**
     * Update task status
     */
    async updateTaskStatus(taskId, status) {
        try {
            return await this.db.tasks.updateTaskStatus(taskId, status);
        }
        catch (error) {
            if (!this.isLegacyTaskSchemaError(error)) {
                throw error;
            }
            this.logger.warn(`Falling back to legacy tasks schema for task status update (task=${taskId}, status=${status}).`);
            return this.updateLegacyTaskStatus(taskId, status);
        }
    }
    /**
     * Assign task to an agent
     */
    async assignTask(taskId, agentId) {
        return this.db.tasks.assignTask(taskId, agentId);
    }
    /**
     * Create a task execution record
     */
    async createExecution(data) {
        return this.db.tasks.createExecution(data);
    }
    /**
     * Complete a task execution
     */
    async completeExecution(executionId, output) {
        return this.db.tasks.completeExecution(executionId, output);
    }
    /**
     * Fail a task execution
     */
    async failExecution(executionId, error) {
        return this.db.tasks.failExecution(executionId, error);
    }
    /**
     * Get task count by status
     */
    async countTasksByStatus(userId) {
        return this.db.tasks.countTasksByStatus(userId);
    }
    mapExecutionToLog(execution) {
        const output = execution.output;
        if (!output || typeof output !== 'object')
            return null;
        const level = output.level;
        const message = output.message;
        const actor = output.actor;
        const source = output.source;
        const timestamp = output.timestamp;
        if ((level !== 'info' && level !== 'warn' && level !== 'error') ||
            typeof message !== 'string' ||
            typeof actor !== 'string' ||
            typeof source !== 'string' ||
            typeof timestamp !== 'string') {
            return null;
        }
        return {
            id: typeof output.id === 'string' ? output.id : execution.id,
            level,
            message,
            actor,
            source,
            stage: typeof output.stage === 'string' ? output.stage : undefined,
            metadata: output.metadata && typeof output.metadata === 'object'
                ? output.metadata
                : {},
            timestamp,
        };
    }
};
exports.TaskService = TaskService;
exports.TaskService = TaskService = TaskService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.DatabaseService])
], TaskService);
//# sourceMappingURL=task.service.js.map