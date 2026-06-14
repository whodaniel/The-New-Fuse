/**
 * @fileoverview Production-ready workflow engine for orchestrating complex processes
 */
import { EventEmitter } from 'events';
import { WorkflowDefinition, WorkflowExecution } from '../types/workflow.js';
import { ServiceState } from '../constants/types.js';
export declare class WorkflowEngine extends EventEmitter {
    private readonly logger;
    private state;
    private workflows;
    private executions;
    private executionQueue;
    private isProcessing;
    constructor();
    start(): Promise<void>;
    stop(): Promise<void>;
    getState(): ServiceState;
    private generateSecureId;
    registerWorkflow(workflow: WorkflowDefinition): void;
    unregisterWorkflow(workflowId: string): boolean;
    getWorkflow(workflowId: string): WorkflowDefinition | undefined;
    getAllWorkflows(): WorkflowDefinition[];
    executeWorkflow(workflowId: string, variables?: Record<string, any>): Promise<string>;
    getExecution(executionId: string): Promise<WorkflowExecution | undefined>;
    getExecutionsByWorkflow(workflowId: string): Promise<WorkflowExecution[]>;
    cancelExecution(executionId: string): Promise<boolean>;
    pauseExecution(executionId: string): Promise<boolean>;
    resumeExecution(executionId: string): Promise<boolean>;
    private startQueueProcessor;
    private processQueue;
    private processExecution;
    private executeWorkflowSteps;
    private executeStep;
    private executeStepLogic;
    private executeTaskStep;
    private executeDecisionStep;
    private executeParallelStep;
    private executeWaitStep;
    private executeScriptStep;
    private evaluateCondition;
    private safeEvaluateExpression;
}
//# sourceMappingURL=WorkflowEngine.d.ts.map