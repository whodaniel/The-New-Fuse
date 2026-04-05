"use strict";
/**
 * Workflow Repository - Persistence Layer for Unified Workflow Engine
 *
 * Provides database operations for workflows and executions
 * Integrates with existing Drizzle schema and database structure
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowRepository = void 0;
const WorkflowTypes_js_1 = require("../types/WorkflowTypes.js");
const errorUtils_js_1 = require("../utils/errorUtils.js");
class WorkflowRepository {
    drizzle; // DrizzleClient;
    logger;
    config;
    cache = new Map();
    constructor(drizzle /* DrizzleClient */, config, logger) {
        this.drizzle = drizzle;
        this.config = config;
        this.logger = logger;
        if (config.enableCaching) {
            this.startCacheCleanup();
        }
    }
    /**
     * Workflow CRUD operations
     */
    async createWorkflow(workflow) {
        const dbWorkflow = await this.drizzle.workflow.create({
            data: {
                name: workflow.name,
                description: workflow.description,
                status: workflow.status,
                agentId: workflow.agentId,
                userId: workflow.userId,
                definition: workflow.definition,
                metadata: workflow.metadata,
                version: workflow.version,
                isTemplate: workflow.isTemplate,
                tags: workflow.tags
            },
            include: {
                agent: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        status: true
                    }
                },
                steps: {
                    orderBy: { order: 'asc' }
                }
            }
        });
        const unifiedWorkflow = this.convertDbToUnified(dbWorkflow);
        this.invalidateCache(`workflow:${dbWorkflow.id}`);
        this.logger.info(`📝 Workflow created: ${workflow.name} (${dbWorkflow.id})`);
        return unifiedWorkflow;
    }
    async getWorkflow(id) {
        const cacheKey = `workflow:${id}`;
        if (this.config.enableCaching) {
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return cached;
            }
        }
        const dbWorkflow = await this.drizzle.workflow.findUnique({
            where: { id },
            include: {
                agent: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        status: true
                    }
                },
                steps: {
                    orderBy: { order: 'asc' }
                },
                executions: {
                    orderBy: { startedAt: 'desc' },
                    take: 5,
                    select: {
                        id: true,
                        status: true,
                        startedAt: true,
                        completedAt: true,
                        error: true
                    }
                }
            }
        });
        if (!dbWorkflow) {
            return null;
        }
        const unifiedWorkflow = this.convertDbToUnified(dbWorkflow);
        if (this.config.enableCaching) {
            this.setCache(cacheKey, unifiedWorkflow);
        }
        return unifiedWorkflow;
    }
    async updateWorkflow(id, updates) {
        const dbWorkflow = await this.drizzle.workflow.update({
            where: { id },
            data: {
                name: updates.name,
                description: updates.description,
                status: updates.status,
                definition: updates.definition,
                metadata: updates.metadata,
                version: updates.version,
                isTemplate: updates.isTemplate,
                tags: updates.tags,
                updatedAt: new Date()
            },
            include: {
                agent: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        status: true
                    }
                },
                steps: {
                    orderBy: { order: 'asc' }
                }
            }
        });
        const unifiedWorkflow = this.convertDbToUnified(dbWorkflow);
        this.invalidateCache(`workflow:${id}`);
        this.logger.info(`📝 Workflow updated: ${dbWorkflow.name} (${id})`);
        return unifiedWorkflow;
    }
    async deleteWorkflow(id) {
        try {
            await this.drizzle.workflow.delete({
                where: { id }
            });
            this.invalidateCache(`workflow:${id}`);
            this.logger.info(`🗑️ Workflow deleted: ${id}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to delete workflow ${id}: ${(0, errorUtils_js_1.getErrorMessage)(error)}`);
            return false;
        }
    }
    async queryWorkflows(query) {
        const where = {};
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } }
            ];
        }
        if (query.status && query.status.length > 0) {
            where.status = { in: query.status };
        }
        if (query.agentId) {
            where.agentId = query.agentId;
        }
        if (query.userId) {
            where.userId = query.userId;
        }
        if (query.tags && query.tags.length > 0) {
            where.tags = { hasSome: query.tags };
        }
        if (query.createdAfter) {
            where.createdAt = { ...where.createdAt, gte: query.createdAfter };
        }
        if (query.createdBefore) {
            where.createdAt = { ...where.createdAt, lte: query.createdBefore };
        }
        const orderBy = {};
        if (query.sortBy) {
            orderBy[query.sortBy] = query.sortOrder || 'desc';
        }
        else {
            orderBy.updatedAt = 'desc';
        }
        const [workflows, total] = await Promise.all([
            this.drizzle.workflow.findMany({
                where,
                include: {
                    agent: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                            status: true
                        }
                    },
                    _count: {
                        select: {
                            steps: true,
                            executions: true
                        }
                    }
                },
                orderBy,
                skip: query.offset || 0,
                take: query.limit || 50
            }),
            this.drizzle.workflow.count({ where })
        ]);
        return {
            workflows: workflows.map((wf) => this.convertDbToUnified(wf)),
            total
        };
    }
    /**
     * Execution operations
     */
    async createExecution(execution) {
        const dbExecution = await this.drizzle.workflowExecution.create({
            data: {
                workflowId: execution.workflowId,
                status: execution.status,
                triggeredBy: execution.triggeredBy,
                input: execution.input,
                startedAt: execution.startedAt
            }
        });
        const unifiedExecution = this.convertDbExecutionToUnified(dbExecution);
        this.logger.debug(`🚀 Execution created: ${dbExecution.id}`);
        return unifiedExecution;
    }
    async getExecution(id) {
        const dbExecution = await this.drizzle.workflowExecution.findUnique({
            where: { id },
            include: {
                workflow: {
                    select: {
                        id: true,
                        name: true,
                        definition: true
                    }
                }
            }
        });
        if (!dbExecution) {
            return null;
        }
        return this.convertDbExecutionToUnified(dbExecution);
    }
    async updateExecution(id, updates) {
        const dbExecution = await this.drizzle.workflowExecution.update({
            where: { id },
            data: {
                status: updates.status,
                output: updates.output,
                error: updates.error ? updates.error.message : null,
                completedAt: updates.completedAt
            }
        });
        return this.convertDbExecutionToUnified(dbExecution);
    }
    async queryExecutions(query) {
        const where = {};
        if (query.workflowId) {
            where.workflowId = query.workflowId;
        }
        if (query.status && query.status.length > 0) {
            where.status = { in: query.status };
        }
        if (query.triggeredBy) {
            where.triggeredBy = query.triggeredBy;
        }
        if (query.startedAfter) {
            where.startedAt = { ...where.startedAt, gte: query.startedAfter };
        }
        if (query.startedBefore) {
            where.startedAt = { ...where.startedAt, lte: query.startedBefore };
        }
        if (query.hasErrors !== undefined) {
            if (query.hasErrors) {
                where.error = { not: null };
            }
            else {
                where.error = null;
            }
        }
        const orderBy = {};
        if (query.sortBy) {
            orderBy[query.sortBy] = query.sortOrder || 'desc';
        }
        else {
            orderBy.startedAt = 'desc';
        }
        const [executions, total] = await Promise.all([
            this.drizzle.workflowExecution.findMany({
                where,
                include: {
                    workflow: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
                orderBy,
                skip: query.offset || 0,
                take: query.limit || 50
            }),
            this.drizzle.workflowExecution.count({ where })
        ]);
        return {
            executions: executions.map((ex) => this.convertDbExecutionToUnified(ex)),
            total
        };
    }
    /**
     * Statistics and analytics
     */
    async getWorkflowStatistics(workflowId) {
        const where = workflowId ? { workflowId } : {};
        const [totalWorkflows, activeWorkflows, totalExecutions, completedExecutions, failedExecutions, executionsByStatus] = await Promise.all([
            this.drizzle.workflow.count(workflowId ? { where: { id: workflowId } } : {}),
            this.drizzle.workflow.count({
                where: {
                    ...(workflowId && { id: workflowId }),
                    status: WorkflowTypes_js_1.WorkflowStatus.PUBLISHED
                }
            }),
            this.drizzle.workflowExecution.count({ where }),
            this.drizzle.workflowExecution.count({
                where: { ...where, status: WorkflowTypes_js_1.WorkflowExecutionStatus.COMPLETED }
            }),
            this.drizzle.workflowExecution.count({
                where: { ...where, status: WorkflowTypes_js_1.WorkflowExecutionStatus.FAILED }
            }),
            this.drizzle.workflowExecution.groupBy({
                by: ['status'],
                where,
                _count: { id: true }
            })
        ]);
        return {
            totalWorkflows,
            activeWorkflows,
            totalExecutions,
            completedExecutions,
            failedExecutions,
            successRate: totalExecutions > 0 ? (completedExecutions / totalExecutions) * 100 : 0,
            executionsByStatus: executionsByStatus.reduce((acc, { status, _count }) => {
                acc[status] = _count.id;
                return acc;
            }, {})
        };
    }
    /**
     * Bulk operations
     */
    async bulkUpdateWorkflowStatus(ids, status) {
        const result = await this.drizzle.workflow.updateMany({
            where: { id: { in: ids } },
            data: { status, updatedAt: new Date() }
        });
        // Invalidate cache for all updated workflows
        ids.forEach(id => this.invalidateCache(`workflow:${id}`));
        this.logger.info(`📝 Bulk updated ${result.count} workflows to status: ${status}`);
        return result.count;
    }
    async cleanupOldExecutions(retentionDays) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        const result = await this.drizzle.workflowExecution.deleteMany({
            where: {
                startedAt: { lt: cutoffDate },
                status: { in: [WorkflowTypes_js_1.WorkflowExecutionStatus.COMPLETED, WorkflowTypes_js_1.WorkflowExecutionStatus.FAILED] }
            }
        });
        this.logger.info(`🧹 Cleaned up ${result.count} old executions older than ${retentionDays} days`);
        return result.count;
    }
    /**
     * Helper methods
     */
    convertDbToUnified(dbWorkflow) {
        return {
            id: dbWorkflow.id,
            name: dbWorkflow.name,
            description: dbWorkflow.description,
            definition: dbWorkflow.definition || {
                version: '1.0.0',
                nodes: [],
                connections: [],
                variables: [],
                triggers: [],
                settings: {
                    parallel: false,
                    maxConcurrentExecutions: 1,
                    timeoutMs: 300000,
                    retryPolicy: { enabled: false, maxAttempts: 3, delayMs: 1000, backoffMultiplier: 2, maxDelayMs: 30000 },
                    errorHandling: { onError: 'stop', captureErrors: true, notifyOnError: true },
                    logging: { level: 'info', includeInputs: true, includeOutputs: true, includeTiming: true, retentionDays: 30 },
                    notifications: { onStart: false, onComplete: true, onError: true, channels: [] }
                }
            },
            status: dbWorkflow.status,
            agentId: dbWorkflow.agentId,
            userId: dbWorkflow.userId,
            version: dbWorkflow.version || '1.0.0',
            tags: dbWorkflow.tags || [],
            isTemplate: dbWorkflow.isTemplate || false,
            createdAt: dbWorkflow.createdAt,
            updatedAt: dbWorkflow.updatedAt,
            lastExecutedAt: dbWorkflow.lastExecutedAt,
            executionCount: dbWorkflow._count?.executions || 0,
            statistics: {
                totalExecutions: dbWorkflow._count?.executions || 0,
                successfulExecutions: 0,
                failedExecutions: 0,
                averageExecutionTime: 0,
                successRate: 0,
                performance: {
                    averageCpuUsage: 0,
                    averageMemoryUsage: 0,
                    peakMemoryUsage: 0,
                    throughput: 0,
                    bottleneckNodes: []
                }
            },
            metadata: dbWorkflow.metadata || {
                category: 'general',
                tags: [],
                author: 'system',
                dependencies: [],
                integrations: [],
                customProperties: {}
            }
        };
    }
    convertDbExecutionToUnified(dbExecution) {
        return {
            id: dbExecution.id,
            workflowId: dbExecution.workflowId,
            status: dbExecution.status,
            triggeredBy: dbExecution.triggeredBy || 'system',
            triggerType: 'manual',
            input: dbExecution.input || {},
            output: dbExecution.output,
            error: dbExecution.error ? {
                code: 'EXECUTION_ERROR',
                message: dbExecution.error,
                timestamp: new Date(),
                recoverable: false,
                metadata: {}
            } : undefined,
            startedAt: dbExecution.startedAt,
            completedAt: dbExecution.completedAt,
            duration: dbExecution.completedAt && dbExecution.startedAt
                ? dbExecution.completedAt.getTime() - dbExecution.startedAt.getTime()
                : undefined,
            nodeExecutions: [],
            context: {
                workflowId: dbExecution.workflowId,
                executionId: dbExecution.id,
                variables: {},
                temporaryData: {}
            },
            statistics: {
                totalNodes: 0,
                completedNodes: 0,
                failedNodes: 0,
                skippedNodes: 0,
                totalDuration: 0,
                averageNodeDuration: 0
            },
            logs: [],
            metadata: {}
        };
    }
    getFromCache(key) {
        if (!this.config.enableCaching)
            return null;
        const cached = this.cache.get(key);
        if (!cached)
            return null;
        if (Date.now() - cached.timestamp > this.config.cacheTimeoutMs) {
            this.cache.delete(key);
            return null;
        }
        return cached.data;
    }
    setCache(key, data) {
        if (!this.config.enableCaching)
            return;
        if (this.cache.size >= this.config.maxCacheSize) {
            // Remove oldest entry
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey !== undefined) {
                this.cache.delete(oldestKey);
            }
        }
        this.cache.set(key, {
            data: JSON.parse(JSON.stringify(data)), // Deep clone
            timestamp: Date.now()
        });
    }
    invalidateCache(key) {
        this.cache.delete(key);
    }
    startCacheCleanup() {
        setInterval(() => {
            const now = Date.now();
            for (const [key, cached] of this.cache.entries()) {
                if (now - cached.timestamp > this.config.cacheTimeoutMs) {
                    this.cache.delete(key);
                }
            }
        }, this.config.cacheTimeoutMs);
    }
    /**
     * Public API
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            maxSize: this.config.maxCacheSize,
            hitRate: 0 // Would need to track hits/misses
        };
    }
    async healthCheck() {
        try {
            await this.drizzle.$queryRaw `SELECT 1`;
            return true;
        }
        catch (error) {
            this.logger.error(`Database health check failed: ${(0, errorUtils_js_1.getErrorMessage)(error)}`);
            return false;
        }
    }
}
exports.WorkflowRepository = WorkflowRepository;
//# sourceMappingURL=WorkflowRepository.js.map