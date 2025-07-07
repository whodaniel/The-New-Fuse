import type { Workflow } from '@the-new-fuse/types/;';
export interface WorkflowContext {
    updateState(result: StepResult): void;
}
export interface StepResult {
    success: boolean;
    error?: string;
    data?: unknown;
}
export interface WorkflowResult {
    success: boolean;
    error?: string;
    data?: unknown;
}
export interface WorkflowEngine {
    executeWorkflow(workflow: Workflow): Promise<WorkflowResult>;
}
export interface WorkflowExecutor {
    execute(workflow: Workflow): Promise<WorkflowResult>;
}
export declare class WorkflowEngineImpl implements WorkflowEngine {
    private steps;
    private context;
    constructor();
    executeWorkflow(workflow: Workflow): Promise<WorkflowResult>;
    private executeSteps;
    private executeStep;
    private handleFailure;
    private finalizeWorkflow;
    private createExecutionPlan;
}
