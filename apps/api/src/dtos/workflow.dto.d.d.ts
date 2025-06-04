declare class WorkflowStepDto {
    id: string;
    type: string;
    config: Record<string, any>;
    nextSteps: string[];
}
export declare class CreateWorkflowDto {
    name: string;
    description?: string;
    steps: WorkflowStepDto[];
    metadata?: Record<string, any>;
}
export declare class UpdateWorkflowDto {
    name?: string;
    description?: string;
    steps?: WorkflowStepDto[];
    metadata?: Record<string, any>;
}
export {};
