import { BaseService } from './BaseService';
/**
 * Workflow data
 */
export interface Workflow {
    /**
     * Workflow ID
     */
    id: string;
    /**
     * Workflow name
     */
    name: string;
    /**
     * Workflow description
     */
    description: string;
    /**
     * Workflow definition
     */
    definition: any;
    /**
     * Workflow status
     */
    status: 'active' | 'inactive' | 'draft';
    /**
     * Workflow creation date
     */
    createdAt: string;
    /**
     * Workflow update date
     */
    updatedAt: string;
    /**
     * Workflow deletion date
     */
    deletedAt?: string;
}
/**
 * Workflow creation data
 */
export interface WorkflowCreateData {
    /**
     * Workflow name
     */
    name: string;
    /**
     * Workflow description
     */
    description: string;
    /**
     * Workflow definition
     */
    definition: any;
    /**
     * Workflow status
     */
    status?: 'active' | 'inactive' | 'draft';
}
/**
 * Workflow update data
 */
export interface WorkflowUpdateData {
    /**
     * Workflow name
     */
    name?: string;
    /**
     * Workflow description
     */
    description?: string;
    /**
     * Workflow definition
     */
    definition?: any;
    /**
     * Workflow status
     */
    status?: 'active' | 'inactive' | 'draft';
}
/**
 * Workflow execution data
 */
export interface WorkflowExecution {
    /**
     * Workflow execution ID
     */
    id: string;
    /**
     * Workflow ID
     */
    workflowId: string;
    /**
     * Workflow execution status
     */
    status: 'pending' | 'running' | 'completed' | 'failed';
    /**
     * Workflow execution input
     */
    input: any;
    /**
     * Workflow execution output
     */
    output?: any;
    /**
     * Workflow execution error
     */
    error?: string;
    /**
     * Workflow execution start date
     */
    startedAt: string;
    /**
     * Workflow execution completion date
     */
    completedAt?: string;
}
/**
 * Workflow service for managing workflows
 */
export declare class WorkflowService extends BaseService {
    /**
     * Create a new workflow service
     * @param apiClient API client
     */
    constructor(apiClient: any);
    /**
     * Get all workflows
     * @param page Page number
     * @param limit Number of workflows per page
     * @returns Promise resolving to the workflows data
     */
    getWorkflows(page?: number, limit?: number): Promise<{
        workflows: Workflow[];
        total: number;
    }>;
    /**
     * Get a workflow by ID
     * @param id Workflow ID
     * @returns Promise resolving to the workflow data
     */
    getWorkflow(id: string): Promise<Workflow>;
    /**
     * Delete a workflow
     * @param id Workflow ID
     * @returns Promise resolving when the workflow is deleted
     */
    deleteWorkflow(id: string): Promise<void>;
    /**
     * Execute a workflow
     * @param id Workflow ID
     * @param input Workflow execution input
     * @returns Promise resolving to the workflow execution data
     */
    executeWorkflow(id: string, input: any): Promise<WorkflowExecution>;
    /**
     * Get workflow executions
     * @param id Workflow ID
     * @param page Page number
     * @param limit Number of executions per page
     * @returns Promise resolving to the workflow executions data
     */
    getWorkflowExecutions(id: string, page?: number, limit?: number): Promise<{
        executions: WorkflowExecution[];
        total: number;
    }>;
}
//# sourceMappingURL=WorkflowService.d.ts.map