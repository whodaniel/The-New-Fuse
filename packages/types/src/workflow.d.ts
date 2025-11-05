import { BaseEntity } from './core/base-types';
export declare enum WorkflowStatus {
    DRAFT = "DRAFT",
    ACTIVE = "ACTIVE",
    PAUSED = "PAUSED",
    COMPLETED = "COMPLETED",
    ERROR = "ERROR"
}
export interface WorkflowStep {
    id: string;
    name: string;
    type: string;
    config: unknown;
    order: number;
}
export interface WorkflowDefinition extends BaseEntity {
    name: string;
    description?: string;
    status: WorkflowStatus;
    steps: WorkflowStep[];
}
export interface WorkflowInstance extends BaseEntity {
    definitionId: string;
    status: WorkflowStatus;
    currentStep?: string;
    context?: unknown;
}
export interface CreateWorkflowDefinitionDto {
    name: string;
    description?: string;
    steps: Omit<WorkflowStep, 'id'>[];
}
export interface UpdateWorkflowDefinitionDto {
    name?: string;
    description?: string;
    steps?: WorkflowStep[];
    status?: WorkflowStatus;
}
export interface StartWorkflowInstanceDto {
    definitionId: string;
    context?: unknown;
}
export interface WorkflowService {
    create(dto: CreateWorkflowDefinitionDto): Promise<WorkflowDefinition>;
    update(id: string, dto: UpdateWorkflowDefinitionDto): Promise<WorkflowDefinition>;
    start(dto: StartWorkflowInstanceDto): Promise<WorkflowInstance>;
}
export interface Workflow extends BaseEntity {
    name: string;
    description?: string;
    status: WorkflowStatus;
    steps: WorkflowStep[];
    creator?: string;
}
export interface CreateWorkflowDto {
    name: string;
    description?: string;
    steps: Omit<WorkflowStep, 'id'>[];
    metadata?: unknown;
}
export interface UpdateWorkflowDto {
    name?: string;
    description?: string;
    steps?: WorkflowStep[];
    status?: WorkflowStatus;
    metadata?: unknown;
}
export declare enum WorkflowExecutionStatus {
    PENDING = "PENDING",
    RUNNING = "RUNNING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED"
}
export interface WorkflowInput {
    [key: string]: unknown;
}
export interface WorkflowExecution {
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    workflowId: string;
    status: WorkflowExecutionStatus;
    input?: WorkflowInput;
    output?: unknown;
    error?: string;
    startedAt: Date;
    completedAt?: Date;
}
//# sourceMappingURL=workflow.d.ts.map