export interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    steps: WorkflowStep[];
    context?: WorkflowContext;
}
export interface WorkflowStep {
    id: string;
    type: WorkflowStepType;
    parameters: WorkflowParameters;
    next?: string;
    _unused?: never;
}
export interface WorkflowInstance {
    id: string;
    workflowId: string;
    status: WorkflowStatus;
    startTime: Date;
    endTime?: Date;
    currentStep?: string;
}
export interface WorkflowOutput {
    stepId: string;
    result: Record<string, unknown>;
}
export declare enum WorkflowStatus {
    PENDING = "PENDING",
    RUNNING = "RUNNING",
    PAUSED = "PAUSED",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    STOPPED = "STOPPED"
}
export declare enum WorkflowStepType {
    TASK = "TASK",
    CONDITION = "CONDITION"
}
export interface WorkflowParameters {
    readonly [key: string]: string | number | boolean | null | undefined;
}
export interface WorkflowError {
    message: string;
    code: string;
}
export interface WorkflowDefinition {
    id: string;
    name: string;
    steps: WorkflowStep[];
}
export interface WorkflowContext {
    readonly [key: string]: unknown;
}
//# sourceMappingURL=index.d.ts.map