/**
 * DTO class for Workflow model to be used with Swagger
 */
export class WorkflowDto {
    id = '';
    name = '';
    description = '';
    steps = {};
    createdAt = new Date();
    updatedAt = new Date();
}
/**
 * DTO class for WorkflowExecution model to be used with Swagger
 */
export class WorkflowExecutionDto {
    id = '';
    workflowId = '';
    status = '';
    result;
    startedAt = new Date();
    completedAt;
}
//# sourceMappingURL=workflow.dto.js.map