// @ts-nocheck
/**
 * Unified Workflow Engine - Main Export File
 *
 * Consolidates all workflow engine components for The New Fuse Framework
 * Provides a single entry point for all workflow-related functionality
 */
export { UnifiedWorkflowEngine, type WorkflowEngineConfig } from './engine/WorkflowEngine.js';
export { WorkflowExecutor, type ExecutorConfig } from './executor/WorkflowExecutor.js';
export { WorkflowBuilder, type BuilderConfig, type BuilderState, type BuilderAction } from './builder/WorkflowBuilder.js';
export { WorkflowQueue, type StartWorkflowJobData, type ExecuteNodeJobData } from './queue/WorkflowQueue.js';
export { WorkflowWorker } from './queue/WorkflowWorker.js';
export { WorkflowRepository, type RepositoryConfig } from './repository/WorkflowRepository.js';
export { WorkflowValidator, type ValidatorConfig } from './validator/WorkflowValidator.js';
export * from './types/WorkflowTypes.js';
export { getErrorMessage, isError, createExecutionError } from './utils/errorUtils.js';
export { isAgentTaskNode, isAgentHandoffNode, isConditionNode, isLLMPromptNode } from './types/WorkflowTypes.js';
/**
 * Workflow Engine Factory
 *
 * Provides a convenient way to create and configure the workflow engine
 */
import { Logger } from '@the-new-fuse/relay-core';
import { MasterAgentRegistry, HeartbeatMonitoringService } from '@the-new-fuse/relay-core';
import { UnifiedWorkflowEngine } from './engine/WorkflowEngine.js';
import { WorkflowRepository } from './repository/WorkflowRepository.js';
import { WorkflowValidator } from './validator/WorkflowValidator.js';
import { WorkflowBuilder } from './builder/WorkflowBuilder.js';
import { WorkflowExecutor } from './executor/WorkflowExecutor.js';
import { WorkflowQueue } from './queue/WorkflowQueue.js';
import { WorkflowWorker } from './queue/WorkflowWorker.js';
export interface WorkflowEngineFactoryConfig {
    drizzle: any;
    redisConnection?: any;
    agentRegistry: MasterAgentRegistry;
    heartbeatService: HeartbeatMonitoringService;
    logger: Logger;
    engine: {
        maxConcurrentExecutions: number;
        defaultTimeoutMs: number;
        enableHeartbeatMonitoring: boolean;
        enableAgentCoordination: boolean;
        enableStatePreservation: boolean;
        relayIntegration: boolean;
        debug: boolean;
    };
    repository: {
        enableCaching: boolean;
        cacheTimeoutMs: number;
        maxCacheSize: number;
        enableMetrics: boolean;
    };
    validator: {
        strictMode: boolean;
        maxNodes: number;
        maxConnections: number;
        maxVariables: number;
        allowCircularReferences: boolean;
        requireStartNode: boolean;
        requireEndNode: boolean;
        enablePerformanceValidation: boolean;
    };
    builder: {
        enableAutoValidation: boolean;
        enableAutoSave: boolean;
        autoSaveIntervalMs: number;
        maxNodes: number;
        maxConnections: number;
        enableVersioning: boolean;
        debug: boolean;
    };
    executor: {
        maxParallelNodes: number;
        nodeTimeoutMs: number;
        retryDelayMs: number;
        maxRetries: number;
        enableDebugLogging: boolean;
    };
}
export declare class WorkflowEngineFactory {
    static create(config: WorkflowEngineFactoryConfig): {
        engine: UnifiedWorkflowEngine;
        executor: WorkflowExecutor;
        builder: WorkflowBuilder;
        repository: WorkflowRepository;
        validator: WorkflowValidator;
        workflowQueue: WorkflowQueue | undefined;
        workflowWorker: WorkflowWorker | undefined;
    };
    static createDefault(drizzle: any, // DrizzleClient,
    agentRegistry: MasterAgentRegistry, heartbeatService: HeartbeatMonitoringService, logger: Logger, redisConnection?: any): {
        engine: UnifiedWorkflowEngine;
        executor: WorkflowExecutor;
        builder: WorkflowBuilder;
        repository: WorkflowRepository;
        validator: WorkflowValidator;
        workflowQueue: WorkflowQueue | undefined;
        workflowWorker: WorkflowWorker | undefined;
    };
}
/**
 * Workflow Engine Manager
 *
 * Provides high-level workflow management operations
 */
export declare class WorkflowEngineManager {
    private engine;
    private repository;
    private validator;
    private builder;
    private logger;
    constructor(engine: UnifiedWorkflowEngine, repository: WorkflowRepository, validator: WorkflowValidator, builder: WorkflowBuilder, logger: Logger);
    /**
     * Create and validate a new workflow
     */
    createWorkflow(workflowData: any): Promise<{
        workflow: any;
        validation: any;
    }>;
    /**
     * Execute a workflow with validation
     */
    executeWorkflow(workflowId: string, input?: Record<string, any>): Promise<string>;
    /**
     * Get workflow health status
     */
    getHealthStatus(): Promise<any>;
    /**
     * Cleanup old executions and optimize performance
     */
    performMaintenance(): Promise<any>;
}
export default WorkflowEngineFactory;
//# sourceMappingURL=index.d.ts.map