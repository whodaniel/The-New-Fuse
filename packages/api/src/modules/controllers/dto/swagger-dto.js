/**
 * DTO classes for API responses
 * Simplified versions without Swagger decorators for build compatibility
 */
/**
 * DTO class for Workflow (WorkflowDefinition)
 */
export class WorkflowDto {
    id;
    name;
    description;
    version;
    triggerType;
    triggerConfig;
    steps;
    initialContext;
    tags;
    createdAt;
    updatedAt;
    deletedAt;
}
/**
 * DTO class for WorkflowExecution (WorkflowInstance)
 */
export class WorkflowExecutionDto {
    id;
    definitionId;
    definitionVersion;
    status;
    currentStepId;
    context;
    startedAt;
    completedAt;
    error;
    stepHistory;
    createdAt;
    updatedAt;
    deletedAt;
}
/**
 * DTO class for Agent
 */
export class AgentDto {
    id;
    name;
    type;
    capabilities;
    metadata;
    status;
    createdAt;
    updatedAt;
    deletedAt;
}
//# sourceMappingURL=swagger-dto.js.map