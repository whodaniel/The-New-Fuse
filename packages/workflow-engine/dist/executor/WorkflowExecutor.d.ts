/**
 * Workflow Executor - Runtime Execution Engine
 *
 * Handles the actual runtime execution of workflow steps and manages execution state
 * Integrates with agents, relay system, and orchestration services
 */
import { Logger, MasterAgentRegistry } from '@the-new-fuse/relay-core';
import { EventEmitter } from 'events';
import { ExecutionContext, NodeExecution, WorkflowExecution, WorkflowNode } from '../types/WorkflowTypes.js';
export interface ExecutorConfig {
    maxParallelNodes: number;
    nodeTimeoutMs: number;
    retryDelayMs: number;
    maxRetries: number;
    enableDebugLogging: boolean;
}
export declare class WorkflowExecutor extends EventEmitter {
    private logger;
    private config;
    private agentRegistry;
    private runningNodes;
    private completedNodes;
    private failedNodes;
    constructor(config: ExecutorConfig, agentRegistry: MasterAgentRegistry, logger: Logger);
    /**
     * Execute workflow step
     */
    executeStep(node: WorkflowNode, context: ExecutionContext, execution: WorkflowExecution): Promise<any>;
    /**
     * Execute node based on its type
     */
    private executeNodeByType;
    /**
     * Node execution implementations
     */
    private executeStartNode;
    private executeEndNode;
    private executeAgentTaskNode;
    private executeAgentHandoffNode;
    private executeAgentCoordinationNode;
    private executeConditionNode;
    private executeLoopNode;
    private executeParallelNode;
    private executeMergeNode;
    private executeAPICallNode;
    private executeDatabaseQueryNode;
    private applyQueryDefaults;
    private evaluateQueryCompleteness;
    private getNestedValue;
    private executeFileOperationNode;
    private executeRelayMessageNode;
    private executeWebhookNode;
    private executeEmailNode;
    private executeLLMPromptNode;
    private executeCodeGenerationNode;
    private executeAnalysisNode;
    private executeSandboxExecutionNode;
    private executeCustomNode;
    /**
     * Helper methods
     */
    private createNodeExecution;
    private generateSecureId;
    private createExecutionError;
    private retryNodeExecution;
    private monitorAgentTask;
    private checkAgentCapabilities;
    private extractNodeInputs;
    private evaluateExpression;
    private interpolateString;
    private interpolateObject;
    private delay;
    /**
     * Public API
     */
    getRunningNodes(): NodeExecution[];
    getCompletedNodes(): string[];
    getFailedNodes(): string[];
    getExecutionStats(): {
        running: number;
        completed: number;
        failed: number;
        total: number;
    };
}
//# sourceMappingURL=WorkflowExecutor.d.ts.map