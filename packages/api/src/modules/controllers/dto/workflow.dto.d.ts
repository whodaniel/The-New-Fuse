/**
 * DTO class for Workflow model to be used with Swagger
 */
export declare class WorkflowDto {
    id: string;
    name: string;
    description: string;
    steps: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * DTO class for WorkflowExecution model to be used with Swagger
 */
export declare class WorkflowExecutionDto {
    id: string;
    workflowId: string;
    status: string;
    result?: Record<string, any>;
    startedAt: Date;
    completedAt?: Date;
}
//# sourceMappingURL=workflow.dto.d.ts.map