"use strict";
/**
 * Unified Workflow Engine - Main Export File
 *
 * Consolidates all workflow engine components for The New Fuse Framework
 * Provides a single entry point for all workflow-related functionality
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowEngineManager = exports.WorkflowEngineFactory = exports.isLLMPromptNode = exports.isConditionNode = exports.isAgentHandoffNode = exports.isAgentTaskNode = exports.createExecutionError = exports.isError = exports.getErrorMessage = exports.WorkflowValidator = exports.WorkflowRepository = exports.WorkflowWorker = exports.WorkflowQueue = exports.WorkflowBuilder = exports.WorkflowExecutor = exports.UnifiedWorkflowEngine = void 0;
// Core engine components
var WorkflowEngine_1 = require("./engine/WorkflowEngine");
Object.defineProperty(exports, "UnifiedWorkflowEngine", { enumerable: true, get: function () { return WorkflowEngine_1.UnifiedWorkflowEngine; } });
var WorkflowExecutor_1 = require("./executor/WorkflowExecutor");
Object.defineProperty(exports, "WorkflowExecutor", { enumerable: true, get: function () { return WorkflowExecutor_1.WorkflowExecutor; } });
var WorkflowBuilder_1 = require("./builder/WorkflowBuilder");
Object.defineProperty(exports, "WorkflowBuilder", { enumerable: true, get: function () { return WorkflowBuilder_1.WorkflowBuilder; } });
var WorkflowQueue_1 = require("./queue/WorkflowQueue");
Object.defineProperty(exports, "WorkflowQueue", { enumerable: true, get: function () { return WorkflowQueue_1.WorkflowQueue; } });
var WorkflowWorker_1 = require("./queue/WorkflowWorker");
Object.defineProperty(exports, "WorkflowWorker", { enumerable: true, get: function () { return WorkflowWorker_1.WorkflowWorker; } });
// Repository and validation
var WorkflowRepository_1 = require("./repository/WorkflowRepository");
Object.defineProperty(exports, "WorkflowRepository", { enumerable: true, get: function () { return WorkflowRepository_1.WorkflowRepository; } });
var WorkflowValidator_1 = require("./validator/WorkflowValidator");
Object.defineProperty(exports, "WorkflowValidator", { enumerable: true, get: function () { return WorkflowValidator_1.WorkflowValidator; } });
// Types and interfaces
__exportStar(require("./types/WorkflowTypes"), exports);
// Utilities
var errorUtils_1 = require("./utils/errorUtils");
Object.defineProperty(exports, "getErrorMessage", { enumerable: true, get: function () { return errorUtils_1.getErrorMessage; } });
Object.defineProperty(exports, "isError", { enumerable: true, get: function () { return errorUtils_1.isError; } });
Object.defineProperty(exports, "createExecutionError", { enumerable: true, get: function () { return errorUtils_1.createExecutionError; } });
// Utility functions
var WorkflowTypes_1 = require("./types/WorkflowTypes");
Object.defineProperty(exports, "isAgentTaskNode", { enumerable: true, get: function () { return WorkflowTypes_1.isAgentTaskNode; } });
Object.defineProperty(exports, "isAgentHandoffNode", { enumerable: true, get: function () { return WorkflowTypes_1.isAgentHandoffNode; } });
Object.defineProperty(exports, "isConditionNode", { enumerable: true, get: function () { return WorkflowTypes_1.isConditionNode; } });
Object.defineProperty(exports, "isLLMPromptNode", { enumerable: true, get: function () { return WorkflowTypes_1.isLLMPromptNode; } });
const WorkflowEngine_2 = require("./engine/WorkflowEngine");
const WorkflowRepository_2 = require("./repository/WorkflowRepository");
const WorkflowValidator_2 = require("./validator/WorkflowValidator");
const WorkflowBuilder_2 = require("./builder/WorkflowBuilder");
const WorkflowExecutor_2 = require("./executor/WorkflowExecutor");
const WorkflowQueue_2 = require("./queue/WorkflowQueue");
const WorkflowWorker_2 = require("./queue/WorkflowWorker");
class WorkflowEngineFactory {
    static create(config) {
        // Create repository
        const repository = new WorkflowRepository_2.WorkflowRepository(config.drizzle, config.repository, config.logger);
        // Create validator
        const validator = new WorkflowValidator_2.WorkflowValidator(config.validator, config.logger);
        // Create builder
        const builder = new WorkflowBuilder_2.WorkflowBuilder(config.builder, config.logger);
        // Create executor
        const executor = new WorkflowExecutor_2.WorkflowExecutor(config.executor, config.agentRegistry, config.logger);
        // Create workflow queue if redis connection is provided
        let workflowQueue;
        if (config.redisConnection) {
            workflowQueue = new WorkflowQueue_2.WorkflowQueue(config.logger, config.redisConnection);
        }
        // Create main engine
        const engine = new WorkflowEngine_2.UnifiedWorkflowEngine(config.engine, config.drizzle, config.agentRegistry, config.heartbeatService, config.logger, workflowQueue);
        // Create workflow worker if queue is available
        let workflowWorker;
        if (workflowQueue && config.redisConnection) {
            workflowWorker = new WorkflowWorker_2.WorkflowWorker(config.logger, config.redisConnection, engine, workflowQueue);
            // Note: Caller is responsible for gracefully closing the worker
        }
        return {
            engine,
            executor,
            builder,
            repository,
            validator,
            workflowQueue,
            workflowWorker
        };
    }
    static createDefault(drizzle, // DrizzleClient,
    agentRegistry, heartbeatService, logger, redisConnection) {
        const config = {
            drizzle,
            agentRegistry,
            heartbeatService,
            logger,
            redisConnection,
            engine: {
                maxConcurrentExecutions: 10,
                defaultTimeoutMs: 300000, // 5 minutes
                enableHeartbeatMonitoring: true,
                enableAgentCoordination: true,
                enableStatePreservation: true,
                relayIntegration: true,
                debug: false
            },
            repository: {
                enableCaching: true,
                cacheTimeoutMs: 300000, // 5 minutes
                maxCacheSize: 1000,
                enableMetrics: true
            },
            validator: {
                strictMode: false,
                maxNodes: 100,
                maxConnections: 200,
                maxVariables: 50,
                allowCircularReferences: false,
                requireStartNode: true,
                requireEndNode: true,
                enablePerformanceValidation: true
            },
            builder: {
                enableAutoValidation: true,
                enableAutoSave: true,
                autoSaveIntervalMs: 30000, // 30 seconds
                maxNodes: 100,
                maxConnections: 200,
                enableVersioning: true,
                debug: false
            },
            executor: {
                maxParallelNodes: 5,
                nodeTimeoutMs: 60000, // 1 minute
                retryDelayMs: 5000, // 5 seconds
                maxRetries: 3,
                enableDebugLogging: false
            }
        };
        return this.create(config);
    }
}
exports.WorkflowEngineFactory = WorkflowEngineFactory;
/**
 * Workflow Engine Manager
 *
 * Provides high-level workflow management operations
 */
class WorkflowEngineManager {
    engine;
    repository;
    validator;
    builder;
    logger;
    constructor(engine, repository, validator, builder, logger) {
        this.engine = engine;
        this.repository = repository;
        this.validator = validator;
        this.builder = builder;
        this.logger = logger;
    }
    /**
     * Create and validate a new workflow
     */
    async createWorkflow(workflowData) {
        // Build workflow
        const workflow = this.builder.createWorkflow(workflowData.name, workflowData.description);
        // Add nodes and connections based on workflowData
        // (Implementation would depend on the specific input format)
        // Validate workflow
        const validation = await this.validator.validateWorkflow(workflow);
        if (validation.valid) {
            // Save to repository
            const savedWorkflow = await this.repository.createWorkflow(workflow);
            this.logger.info(`✅ Workflow created and validated: ${savedWorkflow.name}`);
            return { workflow: savedWorkflow, validation };
        }
        else {
            this.logger.warn(`❌ Workflow validation failed: ${validation.errors.length} errors`);
            return { workflow, validation };
        }
    }
    /**
     * Execute a workflow with validation
     */
    async executeWorkflow(workflowId, input = {}) {
        // Load workflow
        const workflow = await this.repository.getWorkflow(workflowId);
        if (!workflow) {
            throw new Error(`Workflow not found: ${workflowId}`);
        }
        // Validate before execution
        const validation = await this.validator.validateWorkflow(workflow);
        if (!validation.valid) {
            throw new Error(`Workflow validation failed: ${validation.errors.map((e) => e.message).join(', ')}`);
        }
        // Execute workflow
        return this.engine.executeWorkflow(workflowId, input);
    }
    /**
     * Get workflow health status
     */
    async getHealthStatus() {
        const [dbHealth, engineMetrics, cacheStats] = await Promise.all([
            this.repository.healthCheck(),
            this.engine.getMetrics(),
            this.repository.getCacheStats()
        ]);
        return {
            database: { healthy: dbHealth },
            engine: engineMetrics,
            cache: cacheStats,
            timestamp: new Date()
        };
    }
    /**
     * Cleanup old executions and optimize performance
     */
    async performMaintenance() {
        const cleanupResults = await this.repository.cleanupOldExecutions(30); // 30 days retention
        this.logger.info(`🧹 Maintenance completed: cleaned up ${cleanupResults} old executions`);
        return {
            cleanedExecutions: cleanupResults,
            timestamp: new Date()
        };
    }
}
exports.WorkflowEngineManager = WorkflowEngineManager;
// Default export for convenience
exports.default = WorkflowEngineFactory;
//# sourceMappingURL=index.js.map