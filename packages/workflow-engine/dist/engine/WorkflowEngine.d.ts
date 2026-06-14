/**
 * Unified Workflow Engine for The New Fuse Framework
 *
 * This engine consolidates all workflow execution capabilities from various scattered implementations.
 * It integrates with the Master Agent Registry, Relay System, and Orchestration Services to provide a cohesive workflow experience.
 */
import { Logger } from '@the-new-fuse/relay-core';
import { EventEmitter } from 'events';
import { WorkflowQueue } from '../queue/WorkflowQueue.js';
import { ExecutionContext, UnifiedWorkflow, WorkflowExecution, WorkflowNode } from '../types/WorkflowTypes.js';
import { MasterAgentRegistry } from '@the-new-fuse/relay-core';
interface HeartbeatMonitoringService {
    registerAgent(agentId: string, expectedResponseTime?: number): void;
    recordActivity(agentId: string, activityType: string, metadata?: any): void;
}
export interface WorkflowEngineConfig {
    maxConcurrentExecutions: number;
    defaultTimeoutMs: number;
    enableHeartbeatMonitoring: boolean;
    enableAgentCoordination: boolean;
    enableStatePreservation: boolean;
    relayIntegration: boolean;
    debug: boolean;
}
export declare class UnifiedWorkflowEngine extends EventEmitter {
    private logger;
    private config;
    private drizzle;
    private agentRegistry;
    private heartbeatService;
    private workflowQueue?;
    private executor;
    private isRunning;
    private activeExecutions;
    private metrics;
    constructor(config: WorkflowEngineConfig, drizzle: any, agentRegistry: MasterAgentRegistry, heartbeatService: HeartbeatMonitoringService, logger: Logger, workflowQueue?: WorkflowQueue);
    /**
     * Serialize execution context for storage
     */
    private serializeContext;
    /**
     * Deserialize execution context from storage
     */
    private deserializeContext;
    /**
     * Recover interrupted executions on startup
     */
    private recoverInterruptedExecutions;
    /**
     * Start workflow execution
     */
    executeWorkflow(workflowId: string, input?: Record<string, any>, triggeredBy?: string, triggerType?: string): Promise<string>;
    getExecutionStatus(executionId: string): Promise<WorkflowExecution | null>;
    cancelExecution(executionId: string, reason?: string): Promise<boolean>;
    loadWorkflow(workflowId: string): Promise<UnifiedWorkflow | null>;
    private createExecution;
    private startExecution;
    private runExecutionInProcess;
    private getStartNodes;
    private getMaxSequencerSteps;
    private getNodeMaxVisits;
    private nodeAllowsRepeat;
    private executeNodeInSequence;
    private extractNodeExecutionInput;
    private createSerializableNodeOutput;
    private cloneSerializable;
    private recordSkippedNode;
    private shouldContinueAfterNodeError;
    private persistExecutionProgress;
    private appendExecutionLog;
    private failExecution;
    stop(): void;
    executeNode(node: WorkflowNode, context: ExecutionContext): Promise<any>;
    private evaluateExpression;
    findNextNodes(currentNode: WorkflowNode, workflow: UnifiedWorkflow, context: ExecutionContext): WorkflowNode[];
    private connectionMatchesSelectedOutput;
    finalizeExecution(execution: WorkflowExecution): Promise<void>;
    private emitWorkflowEvent;
    private updateMetrics;
    private extractWorkflowVariables;
    private extractTaskId;
    private convertDbWorkflowToUnified;
    private loadExecution;
    private generateSecureId;
    getMetrics(): {
        totalExecutions: number;
        successfulExecutions: number;
        failedExecutions: number;
        averageExecutionTime: number;
        activeExecutionCount: number;
    };
    getActiveExecutions(): WorkflowExecution[];
    updateExecutionState(executionId: string, context: any): Promise<void>;
    getWorkflowExecutions(workflowId: string, _limit?: number): Promise<WorkflowExecution[]>;
}
export {};
//# sourceMappingURL=WorkflowEngine.d.ts.map