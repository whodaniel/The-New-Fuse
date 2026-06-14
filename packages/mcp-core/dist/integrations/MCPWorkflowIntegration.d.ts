/**
 * MCP Workflow Integration Implementation
 *
 * Provides integration between MCP services and workflow execution systems.
 * Handles task delegation, execution tracking, and callback management.
 */
import { EventEmitter } from 'events';
import { IMCPBroker } from '../interfaces/IMCPBroker.js';
import { IMCPClient } from '../interfaces/IMCPClient.js';
import { ErrorRecoveryConfig, ExecutionStatus, IMCPWorkflowIntegration, MCPCallback, MonitoringConfig, StepResult, Task, TaskResult, WorkflowContext, WorkflowStep } from '../interfaces/IMCPWorkflowIntegration.js';
import { RetryPolicy } from '../types/common.js';
import { CallbackHandlerConfig } from './MCPCallbackHandler.js';
/**
 * Configuration for MCP workflow integration
 */
export interface MCPWorkflowIntegrationConfig {
    /** MCP client for service communication */
    client: IMCPClient;
    /** MCP broker for service discovery */
    broker: IMCPBroker;
    /** Default timeout for operations */
    defaultTimeout: number;
    /** Default retry policy */
    defaultRetryPolicy: RetryPolicy;
    /** Error recovery configuration */
    errorRecovery: ErrorRecoveryConfig;
    /** Monitoring configuration */
    monitoring: MonitoringConfig;
    /** Callback handler configuration */
    callbackConfig?: CallbackHandlerConfig;
    /** Enable debug logging */
    debug?: boolean;
}
/**
 * MCP Workflow Integration implementation
 */
export declare class MCPWorkflowIntegration extends EventEmitter implements IMCPWorkflowIntegration {
    private readonly config;
    private readonly executionTracker;
    private readonly callbackHandlers;
    private readonly monitor;
    private readonly callbackHandler;
    private isInitialized;
    constructor(config: MCPWorkflowIntegrationConfig);
    /**
     * Initialize the workflow integration
     */
    initialize(): Promise<void>;
    /**
     * Shutdown the workflow integration
     */
    shutdown(): Promise<void>;
    /**
     * Execute a workflow step using MCP service delegation
     */
    executeWorkflowStep(step: WorkflowStep, context: WorkflowContext): Promise<StepResult>;
    /**
     * Delegate a task to an MCP service
     */
    delegateTask(task: Task, mcpService: string): Promise<TaskResult>;
    /**
     * Track the execution status of an MCP-delegated task
     */
    trackMCPExecution(executionId: string): Promise<ExecutionStatus>;
    /**
     * Handle asynchronous callbacks from MCP services
     */
    handleMCPCallback(callback: MCPCallback): Promise<void>;
    /**
     * Register a callback handler for a specific execution
     */
    registerCallbackHandler(executionId: string, handler: (callback: MCPCallback) => Promise<void>): void;
    /**
     * Unregister a callback handler
     */
    unregisterCallbackHandler(executionId: string): void;
    /**
     * Get execution statistics
     */
    getExecutionStatistics(): {
        totalExecutions: number;
        activeExecutions: number;
        completedExecutions: number;
        failedExecutions: number;
    };
    /**
     * Get detailed monitoring metrics
     */
    getMonitoringMetrics(): import("./WorkflowExecutionMonitor.js").ExecutionMetrics;
    /**
     * Get callback handler statistics
     */
    getCallbackStatistics(): import("./MCPCallbackHandler.js").CallbackStatistics;
    /**
     * Get execution history
     */
    getExecutionHistory(limit?: number, offset?: number): import("./WorkflowExecutionMonitor.js").ExecutionHistoryEntry[];
    /**
     * Get execution events
     */
    getExecutionEvents(executionId?: string, limit?: number): import("./WorkflowExecutionMonitor.js").ExecutionEvent[];
    /**
     * Clean up completed executions older than specified time
     */
    cleanupExecutions(olderThanMs?: number): number;
    private setupEventHandlers;
    private setupCallbackHandling;
    private validateWorkflowStep;
    private prepareMCPRequest;
    private resolveParameters;
    private executeWithRetry;
    private calculateRetryDelay;
    private processStepResponse;
    private trackExecution;
    private updateExecution;
    private generateExecutionId;
    private generateTaskExecutionId;
    private sleep;
    private executeWithTimeout;
}
//# sourceMappingURL=MCPWorkflowIntegration.d.ts.map