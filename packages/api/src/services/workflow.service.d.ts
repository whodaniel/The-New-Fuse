/**
 * Workflow Service Implementation
 * Follows standardized service pattern
 */
import { BaseService, IBaseRepository } from '../services/base.service';
declare enum WorkflowStatus {
    DRAFT = "draft",
    ACTIVE = "active",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed"
}
interface WorkflowModel {
    id: string;
    name: string;
    description?: string;
    status: WorkflowStatus;
    [key: string]: any;
}
interface WorkflowExecutionModel {
    id: string;
    workflowId: string;
    status: string;
    [key: string]: any;
}
export declare class WorkflowService extends BaseService<WorkflowModel> {
    protected readonly repository: IBaseRepository<WorkflowModel>;
    constructor();
    /**
     * Get workflows for a user
     */
    getWorkflows(userId: string): Promise<WorkflowModel[]>;
    /**
     * Get workflow by ID for a specific user
     */
    getWorkflowById(id: string, userId: string): Promise<WorkflowModel | null>;
    /**
     * Update a workflow for a specific user
     */
    updateWorkflow(id: string, data: Partial<WorkflowModel>, userId: string): Promise<WorkflowModel>;
    /**
     * Execute a workflow
     */
    executeWorkflow(id: string, input: Record<string, any>, userId: string): Promise<WorkflowExecutionModel>;
}
export {};
//# sourceMappingURL=workflow.service.d.ts.map