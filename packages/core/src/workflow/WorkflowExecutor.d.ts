/**
 * @fileoverview Workflow executor that handles individual workflow step execution
 */
import { WorkflowStep, StepExecution, WorkflowExecution, WorkflowStepType } from '../types/workflow';
import { ServiceState } from '../constants/types';
export interface ExecutionContext {
    execution: WorkflowExecution;
    stepExecution: StepExecution;
    variables: Record<string, any>;
    metadata: Record<string, any>;
}
export interface StepExecutor {
    canExecute(step: WorkflowStep): boolean;
    execute(step: WorkflowStep, context: ExecutionContext): Promise<any>;
}
export declare class WorkflowExecutor {
    private readonly logger;
    private state;
    private stepExecutors;
    constructor();
    start(): Promise<void>;
    stop(): Promise<void>;
    getState(): ServiceState;
    executeStep(step: WorkflowStep, context: ExecutionContext): Promise<any>;
    registerStepExecutor(stepType: WorkflowStepType, executor: StepExecutor): void;
    unregisterStepExecutor(stepType: WorkflowStepType): boolean;
    private initializeDefaultExecutors;
}
//# sourceMappingURL=WorkflowExecutor.d.ts.map