"use strict";
/**
 * Unified Workflow Engine for The New Fuse Framework
 *
 * This engine consolidates all workflow execution capabilities from various scattered implementations.
 * It integrates with the Master Agent Registry, Relay System, and Orchestration Services to provide a cohesive workflow experience.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedWorkflowEngine = void 0;
const events_1 = require("events");
// import { DrizzleClient } from '@drizzle/client';
const WorkflowExecutor_1 = require("../executor/WorkflowExecutor");
const TelemetryService_1 = require("../telemetry/TelemetryService");
const WorkflowTypes_1 = require("../types/WorkflowTypes");
const errorUtils_1 = require("../utils/errorUtils");
class UnifiedWorkflowEngine extends events_1.EventEmitter {
    logger;
    config;
    drizzle; // DrizzleClient;
    agentRegistry;
    heartbeatService;
    workflowQueue;
    executor;
    isRunning = true;
    // Execution tracking
    activeExecutions = new Map();
    // Performance metrics
    metrics = {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0,
        activeExecutionCount: 0,
    };
    constructor(config, drizzle /* DrizzleClient */, agentRegistry, heartbeatService, logger, workflowQueue) {
        super();
        this.config = config;
        this.drizzle = drizzle;
        this.agentRegistry = agentRegistry;
        this.heartbeatService = heartbeatService;
        this.workflowQueue = workflowQueue;
        this.logger = logger;
        this.executor = new WorkflowExecutor_1.WorkflowExecutor({
            maxParallelNodes: 1,
            nodeTimeoutMs: config.defaultTimeoutMs,
            retryDelayMs: 1000,
            maxRetries: 3,
            enableDebugLogging: config.debug,
        }, agentRegistry, logger);
        this.recoverInterruptedExecutions();
    }
    /**
     * Serialize execution context for storage
     */
    serializeContext(context) {
        return {
            workflowId: context.workflowId,
            executionId: context.executionId,
            variables: context.variables,
            temporaryData: context.temporaryData,
            userContext: context.userContext,
        };
    }
    /**
     * Deserialize execution context from storage
     */
    deserializeContext(data) {
        return {
            workflowId: data.workflowId,
            executionId: data.executionId,
            variables: data.variables || {},
            temporaryData: data.temporaryData || {},
            userContext: data.userContext,
            agentRegistry: this.agentRegistry,
            relayConnection: null,
        };
    }
    /**
     * Recover interrupted executions on startup
     */
    async recoverInterruptedExecutions() {
        try {
            this.logger.info('🔄 Checking for interrupted workflow executions...');
            const interruptedExecutions = await this.drizzle.workflowExecution.findMany({
                where: {
                    status: WorkflowTypes_1.WorkflowExecutionStatus.RUNNING,
                },
            });
            if (interruptedExecutions.length === 0) {
                this.logger.info('✅ No interrupted executions found.');
                return;
            }
            this.logger.info(`⚠️ Found ${interruptedExecutions.length} interrupted executions. Attempting recovery...`);
            for (const dbExecution of interruptedExecutions) {
                try {
                    if (this.workflowQueue) {
                        await this.workflowQueue.addStartWorkflowJob({
                            executionId: dbExecution.id,
                            workflowId: dbExecution.workflowId,
                        });
                        this.logger.info(`🔄 Re-queued interrupted execution: ${dbExecution.id}`);
                    }
                    else {
                        this.logger.warn(`Cannot recover execution ${dbExecution.id}: WorkflowQueue not initialized.`);
                    }
                }
                catch (err) {
                    this.logger.error(`❌ Failed to recover execution ${dbExecution.id}: ${(0, errorUtils_1.getErrorMessage)(err)}`);
                }
            }
        }
        catch (error) {
            this.logger.error(`❌ Failed to recover interrupted executions: ${(0, errorUtils_1.getErrorMessage)(error)}`);
        }
    }
    /**
     * Start workflow execution
     */
    async executeWorkflow(workflowId, input = {}, triggeredBy = 'system', triggerType = 'manual') {
        return TelemetryService_1.telemetry.startActiveSpan('executeWorkflow', async (span) => {
            span.setAttribute('workflowId', workflowId);
            span.setAttribute('triggeredBy', triggeredBy);
            span.setAttribute('triggerType', triggerType);
            try {
                this.logger.info(`🚀 Starting workflow execution: ${workflowId}`);
                const workflow = await this.loadWorkflow(workflowId);
                if (!workflow) {
                    throw new Error(`Workflow not found: ${workflowId}`);
                }
                if (this.activeExecutions.size >= this.config.maxConcurrentExecutions) {
                    throw new Error('Maximum concurrent executions reached');
                }
                const execution = await this.createExecution(workflow, input, triggeredBy, triggerType);
                span.setAttribute('executionId', execution.id);
                await this.startExecution(execution);
                this.metrics.totalExecutions++;
                this.logger.info(`✅ Workflow execution started: ${execution.id}`);
                return execution.id;
            }
            catch (error) {
                this.logger.error(`❌ Failed to start workflow execution: ${(0, errorUtils_1.getErrorMessage)(error)}`);
                throw error;
            }
        });
    }
    async getExecutionStatus(executionId) {
        const activeExecution = this.activeExecutions.get(executionId);
        if (activeExecution) {
            return activeExecution;
        }
        return this.loadExecution(executionId);
    }
    async cancelExecution(executionId, reason = 'User cancelled') {
        const execution = await this.getExecutionStatus(executionId);
        if (!execution) {
            return false;
        }
        execution.status = WorkflowTypes_1.WorkflowExecutionStatus.CANCELLED;
        execution.completedAt = new Date();
        execution.error = {
            code: 'EXECUTION_CANCELLED',
            message: reason,
            timestamp: new Date(),
            recoverable: false,
            metadata: {},
        };
        await this.finalizeExecution(execution);
        this.logger.info(`🛑 Workflow execution cancelled: ${executionId} - ${reason}`);
        return true;
    }
    async loadWorkflow(workflowId) {
        try {
            const dbWorkflow = await this.drizzle.workflow.findUnique({
                where: { id: workflowId },
                include: {
                    steps: { orderBy: { order: 'asc' } },
                    agent: true,
                },
            });
            if (!dbWorkflow)
                return null;
            return this.convertDbWorkflowToUnified(dbWorkflow);
        }
        catch (error) {
            this.logger.error(`Failed to load workflow ${workflowId}: ${(0, errorUtils_1.getErrorMessage)(error)}`);
            return null;
        }
    }
    async createExecution(workflow, input, triggeredBy, triggerType) {
        const executionId = `exec_${Date.now()}_${this.generateSecureId()}`;
        const execution = {
            id: executionId,
            workflowId: workflow.id,
            status: WorkflowTypes_1.WorkflowExecutionStatus.PENDING,
            triggeredBy: triggeredBy,
            triggerType: triggerType,
            input: input,
            startedAt: new Date(),
            nodeExecutions: [],
            context: {
                workflowId: workflow.id,
                executionId: executionId,
                variables: { ...input, ...this.extractWorkflowVariables(workflow) },
                temporaryData: {},
                agentRegistry: this.agentRegistry,
                relayConnection: null,
            },
            statistics: {
                totalNodes: workflow.definition.nodes.length,
                completedNodes: 0,
                failedNodes: 0,
                skippedNodes: 0,
                totalDuration: 0,
                averageNodeDuration: 0,
            },
            logs: [],
            metadata: {
                workflowVersion: workflow.version,
                engineVersion: '1.0.0',
            },
        };
        await this.drizzle.workflowExecution.create({
            data: {
                id: executionId,
                workflowId: workflow.id,
                status: WorkflowTypes_1.WorkflowExecutionStatus.PENDING,
                input: input,
                startedAt: execution.startedAt,
                nodeExecutions: [],
                context: this.serializeContext(execution.context),
                statistics: execution.statistics,
                logs: [],
                metadata: execution.metadata,
            },
        });
        return execution;
    }
    async startExecution(execution) {
        this.activeExecutions.set(execution.id, execution);
        if (this.workflowQueue) {
            await this.workflowQueue.addStartWorkflowJob({
                executionId: execution.id,
                workflowId: execution.workflowId,
            });
        }
        else {
            this.logger.warn('WorkflowQueue not initialized. Execution will not start automatically.');
        }
        this.emitWorkflowEvent({
            id: `event_${Date.now()}`,
            type: WorkflowTypes_1.WorkflowEventType.WORKFLOW_STARTED,
            workflowId: execution.workflowId,
            executionId: execution.id,
            timestamp: new Date(),
            data: { triggeredBy: execution.triggeredBy },
        });
        if (this.config.enableHeartbeatMonitoring) {
            this.heartbeatService.registerAgent(execution.id, this.config.defaultTimeoutMs);
        }
    }
    stop() {
        this.isRunning = false;
    }
    async executeNode(node, context) {
        return TelemetryService_1.telemetry.startActiveSpan('executeNode', async (span) => {
            span.setAttribute('nodeId', node.id);
            span.setAttribute('nodeType', node.type);
            span.setAttribute('executionId', context.executionId);
            let execution = this.activeExecutions.get(context.executionId);
            if (!execution) {
                execution = (await this.loadExecution(context.executionId)) || undefined;
            }
            if (!execution) {
                throw new Error(`Execution ${context.executionId} not found`);
            }
            return await this.executor.executeStep(node, context, execution);
        });
    }
    evaluateExpression(expression, variables) {
        const context = {
            ...variables,
            Math,
            Date,
            String,
            Number,
            Boolean,
            Array,
            Object,
        };
        try {
            const func = new Function(...Object.keys(context), `return (${expression});`);
            return func(...Object.values(context));
        }
        catch (error) {
            throw new Error(`Expression evaluation error: ${(0, errorUtils_1.getErrorMessage)(error)}`);
        }
    }
    findNextNodes(currentNode, workflow, context) {
        const connections = workflow.definition.connections.filter((c) => c.sourceNodeId === currentNode.id);
        const nextNodes = [];
        for (const connection of connections) {
            if (connection.condition) {
                try {
                    const conditionResult = this.evaluateExpression(connection.condition, context.variables);
                    if (!conditionResult)
                        continue;
                }
                catch (error) {
                    this.logger.warn(`Connection condition evaluation failed: ${(0, errorUtils_1.getErrorMessage)(error)}`);
                    continue;
                }
            }
            const nextNode = workflow.definition.nodes.find((n) => n.id === connection.targetNodeId);
            if (nextNode) {
                nextNodes.push(nextNode);
            }
        }
        return nextNodes;
    }
    async finalizeExecution(execution) {
        await this.drizzle.workflowExecution.update({
            where: { id: execution.id },
            data: {
                status: execution.status,
                output: execution.output,
                error: execution.error,
                completedAt: execution.completedAt,
                nodeExecutions: execution.nodeExecutions,
                context: this.serializeContext(execution.context),
                statistics: execution.statistics,
                logs: execution.logs,
                metadata: execution.metadata,
            },
        });
        this.activeExecutions.delete(execution.id);
        const eventType = execution.status === WorkflowTypes_1.WorkflowExecutionStatus.COMPLETED
            ? WorkflowTypes_1.WorkflowEventType.WORKFLOW_COMPLETED
            : execution.status === WorkflowTypes_1.WorkflowExecutionStatus.FAILED
                ? WorkflowTypes_1.WorkflowEventType.WORKFLOW_FAILED
                : WorkflowTypes_1.WorkflowEventType.WORKFLOW_CANCELLED;
        this.emitWorkflowEvent({
            id: `event_${Date.now()}`,
            type: eventType,
            workflowId: execution.workflowId,
            executionId: execution.id,
            timestamp: new Date(),
            data: {
                duration: execution.duration,
                completedNodes: execution.statistics.completedNodes,
                failedNodes: execution.statistics.failedNodes,
            },
        });
        this.updateMetrics(execution);
    }
    emitWorkflowEvent(event) {
        this.emit('workflowEvent', event);
        if (this.config.debug) {
            this.logger.debug(`Workflow event: ${event.type} - ${event.workflowId}`);
        }
    }
    updateMetrics(execution) {
        if (execution.duration) {
            const totalTime = this.metrics.averageExecutionTime * (this.metrics.totalExecutions - 1) + execution.duration;
            this.metrics.averageExecutionTime = totalTime / this.metrics.totalExecutions;
        }
        this.metrics.activeExecutionCount = this.activeExecutions.size;
    }
    extractWorkflowVariables(workflow) {
        const variables = {};
        for (const variable of workflow.definition.variables) {
            variables[variable.name] = variable.defaultValue;
        }
        return variables;
    }
    convertDbWorkflowToUnified(dbWorkflow) {
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
                    retryPolicy: {
                        enabled: false,
                        maxAttempts: 3,
                        delayMs: 1000,
                        backoffMultiplier: 2,
                        maxDelayMs: 30000,
                    },
                    errorHandling: { onError: 'stop', captureErrors: true, notifyOnError: true },
                    logging: {
                        level: 'info',
                        includeInputs: true,
                        includeOutputs: true,
                        includeTiming: true,
                        retentionDays: 30,
                    },
                    notifications: { onStart: false, onComplete: true, onError: true, channels: [] },
                },
            },
            status: dbWorkflow.status,
            agentId: dbWorkflow.agentId,
            userId: dbWorkflow.userId,
            version: '1.0.0',
            tags: [],
            isTemplate: false,
            createdAt: dbWorkflow.createdAt,
            updatedAt: dbWorkflow.updatedAt,
            lastExecutedAt: dbWorkflow.lastExecutedAt,
            executionCount: 0,
            statistics: {
                totalExecutions: 0,
                successfulExecutions: 0,
                failedExecutions: 0,
                averageExecutionTime: 0,
                successRate: 0,
                performance: {
                    averageCpuUsage: 0,
                    averageMemoryUsage: 0,
                    peakMemoryUsage: 0,
                    throughput: 0,
                    bottleneckNodes: [],
                },
            },
            metadata: {
                category: 'general',
                tags: [],
                author: 'system',
                dependencies: [],
                integrations: [],
                customProperties: {},
            },
        };
    }
    async loadExecution(executionId) {
        try {
            const dbExecution = await this.drizzle.workflowExecution.findUnique({
                where: { id: executionId },
            });
            if (!dbExecution)
                return null;
            const nodeExecutions = dbExecution.nodeExecutions || [];
            const contextData = dbExecution.context || {};
            const context = this.deserializeContext(contextData);
            context.workflowId = dbExecution.workflowId;
            context.executionId = dbExecution.id;
            return {
                id: dbExecution.id,
                workflowId: dbExecution.workflowId,
                status: dbExecution.status,
                triggeredBy: dbExecution.triggeredBy || 'system',
                triggerType: 'manual',
                input: dbExecution.input,
                output: dbExecution.output,
                startedAt: dbExecution.startedAt,
                completedAt: dbExecution.completedAt,
                nodeExecutions: nodeExecutions,
                context: context,
                statistics: dbExecution.statistics || {
                    totalNodes: 0,
                    completedNodes: 0,
                    failedNodes: 0,
                    skippedNodes: 0,
                    totalDuration: 0,
                    averageNodeDuration: 0,
                },
                logs: dbExecution.logs || [],
                metadata: dbExecution.metadata || {},
            };
        }
        catch (error) {
            this.logger.error(`Failed to load execution ${executionId}: ${(0, errorUtils_1.getErrorMessage)(error)}`);
            return null;
        }
    }
    generateSecureId() {
        const { randomBytes } = require('crypto');
        return randomBytes(9).toString('hex').substring(0, 9);
    }
    getMetrics() {
        return { ...this.metrics };
    }
    getActiveExecutions() {
        return Array.from(this.activeExecutions.values());
    }
    async updateExecutionState(executionId, context) {
        const execution = this.activeExecutions.get(executionId);
        if (execution) {
            execution.context.variables = { ...execution.variables, ...context.variables };
        }
    }
    async getWorkflowExecutions(workflowId, _limit = 10) {
        return [];
    }
}
exports.UnifiedWorkflowEngine = UnifiedWorkflowEngine;
//# sourceMappingURL=WorkflowEngine.js.map