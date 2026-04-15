/**
 * Unified Workflow Engine - Main Export File
 * 
 * Consolidates all workflow engine components for The New Fuse Framework
 * Provides a single entry point for all workflow-related functionality
 */

// Core engine components
export { UnifiedWorkflowEngine, type WorkflowEngineConfig } from './engine/WorkflowEngine';
export { WorkflowExecutor, type ExecutorConfig } from './executor/WorkflowExecutor';
export { WorkflowBuilder, type BuilderConfig, type BuilderState, type BuilderAction } from './builder/WorkflowBuilder';
export { WorkflowQueue, type StartWorkflowJobData, type ExecuteNodeJobData } from './queue/WorkflowQueue';
export { WorkflowWorker } from './queue/WorkflowWorker';

// Repository and validation
export { WorkflowRepository, type RepositoryConfig } from './repository/WorkflowRepository';
export { WorkflowValidator, type ValidatorConfig } from './validator/WorkflowValidator';

// Types and interfaces
export * from './types/WorkflowTypes';

// Utilities
export { getErrorMessage, isError, createExecutionError } from './utils/errorUtils';

// Utility functions
export {
  isAgentTaskNode,
  isAgentHandoffNode,
  isConditionNode,
  isLLMPromptNode
} from './types/WorkflowTypes';

/**
 * Workflow Engine Factory
 * 
 * Provides a convenient way to create and configure the workflow engine
 */
// import { DrizzleClient } from '@drizzle/client';
import { Logger } from '@the-new-fuse/relay-core';

// Import actual types from relay-core
import { MasterAgentRegistry, HeartbeatMonitoringService } from '@the-new-fuse/relay-core';
import { UnifiedWorkflowEngine } from './engine/WorkflowEngine';
import { WorkflowRepository } from './repository/WorkflowRepository';
import { WorkflowValidator } from './validator/WorkflowValidator';
import { WorkflowBuilder } from './builder/WorkflowBuilder';
import { WorkflowExecutor } from './executor/WorkflowExecutor';
import { WorkflowQueue } from './queue/WorkflowQueue';
import { WorkflowWorker } from './queue/WorkflowWorker';

export interface WorkflowEngineFactoryConfig {
  // Database configuration
  drizzle: any; // DrizzleClient;
  redisConnection?: any; // Redis connection options
  
  // Core services
  agentRegistry: MasterAgentRegistry;
  heartbeatService: HeartbeatMonitoringService;
  logger: Logger;
  
  // Engine configuration
  engine: {
    maxConcurrentExecutions: number;
    defaultTimeoutMs: number;
    enableHeartbeatMonitoring: boolean;
    enableAgentCoordination: boolean;
    enableStatePreservation: boolean;
    relayIntegration: boolean;
    debug: boolean;
  };
  
  // Repository configuration
  repository: {
    enableCaching: boolean;
    cacheTimeoutMs: number;
    maxCacheSize: number;
    enableMetrics: boolean;
  };
  
  // Validator configuration
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
  
  // Builder configuration
  builder: {
    enableAutoValidation: boolean;
    enableAutoSave: boolean;
    autoSaveIntervalMs: number;
    maxNodes: number;
    maxConnections: number;
    enableVersioning: boolean;
    debug: boolean;
  };
  
  // Executor configuration
  executor: {
    maxParallelNodes: number;
    nodeTimeoutMs: number;
    retryDelayMs: number;
    maxRetries: number;
    enableDebugLogging: boolean;
  };
}

export class WorkflowEngineFactory {
  static create(config: WorkflowEngineFactoryConfig) {
    // Create repository
    const repository = new WorkflowRepository(
      config.drizzle,
      config.repository,
      config.logger
    );
    
    // Create validator
    const validator = new WorkflowValidator(
      config.validator,
      config.logger
    );
    
    // Create builder
    const builder = new WorkflowBuilder(
      config.builder,
      config.logger
    );
    
    // Create executor
    const executor = new WorkflowExecutor(
      config.executor,
      config.agentRegistry,
      config.logger
    );
    
    // Create workflow queue if redis connection is provided
    let workflowQueue: WorkflowQueue | undefined;
    if (config.redisConnection) {
        workflowQueue = new WorkflowQueue(config.logger, config.redisConnection);
    }

    // Create main engine
    const engine = new UnifiedWorkflowEngine(
      config.engine,
      config.drizzle,
      config.agentRegistry,
      config.heartbeatService,
      config.logger,
      workflowQueue
    );

    // Create workflow worker if queue is available
    let workflowWorker: WorkflowWorker | undefined;
    if (workflowQueue && config.redisConnection) {
        workflowWorker = new WorkflowWorker(
            config.logger,
            config.redisConnection,
            engine,
            workflowQueue
        );
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
  
  static createDefault(
    drizzle: any, // DrizzleClient,
    agentRegistry: MasterAgentRegistry,
    heartbeatService: HeartbeatMonitoringService,
    logger: Logger,
    redisConnection?: any
  ) {
    const config: WorkflowEngineFactoryConfig = {
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

/**
 * Workflow Engine Manager
 * 
 * Provides high-level workflow management operations
 */
export class WorkflowEngineManager {
  private engine: UnifiedWorkflowEngine;
  private repository: WorkflowRepository;
  private validator: WorkflowValidator;
  private builder: WorkflowBuilder;
  private logger: Logger;

  constructor(
    engine: UnifiedWorkflowEngine,
    repository: WorkflowRepository,
    validator: WorkflowValidator,
    builder: WorkflowBuilder,
    logger: Logger
  ) {
    this.engine = engine;
    this.repository = repository;
    this.validator = validator;
    this.builder = builder;
    this.logger = logger;
  }

  /**
   * Create and validate a new workflow
   */
  async createWorkflow(workflowData: any): Promise<{ workflow: any; validation: any }> {
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
    } else {
      this.logger.warn(`❌ Workflow validation failed: ${validation.errors.length} errors`);
      return { workflow, validation };
    }
  }

  /**
   * Execute a workflow with validation
   */
  async executeWorkflow(workflowId: string, input: Record<string, any> = {}): Promise<string> {
    // Load workflow
    const workflow = await this.repository.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // Validate before execution
    const validation = await this.validator.validateWorkflow(workflow);
    if (!validation.valid) {
      throw new Error(`Workflow validation failed: ${validation.errors.map((e: any) => e.message).join(', ')}`);
    }

    // Execute workflow
    return this.engine.executeWorkflow(workflowId, input);
  }

  /**
   * Get workflow health status
   */
  async getHealthStatus(): Promise<any> {
    const [
      dbHealth,
      engineMetrics,
      cacheStats
    ] = await Promise.all([
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
  async performMaintenance(): Promise<any> {
    const cleanupResults = await this.repository.cleanupOldExecutions(30); // 30 days retention
    
    this.logger.info(`🧹 Maintenance completed: cleaned up ${cleanupResults} old executions`);
    
    return {
      cleanedExecutions: cleanupResults,
      timestamp: new Date()
    };
  }
}

// Default export for convenience
export default WorkflowEngineFactory;