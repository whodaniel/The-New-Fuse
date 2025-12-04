import { Workflow, WorkflowExecution } from '@/utils/workflow-schema-validator';
/**
 * Service for interacting with the workflow database
 */
export declare class WorkflowDatabaseService {
    private apiBaseUrl;
    constructor();
    /**
     * Fetches all workflows
     * @returns A list of workflows
     */
    getWorkflows(): Promise<Workflow[]>;
    /**
     * Fetches a workflow by ID
     * @param id The workflow ID
     * @returns The workflow
     */
    getWorkflow(id: string): Promise<Workflow>;
    /**
     * Creates a new workflow
     * @param workflow The workflow to create
     * @returns The created workflow
     */
    createWorkflow(workflow: Omit<Workflow, 'id'>): Promise<Workflow>;
    /**
     * Updates a workflow
     * @param id The workflow ID
     * @param workflow The workflow data to update
     * @returns The updated workflow
     */
    updateWorkflow(id: string, workflow: Partial<Workflow>): Promise<Workflow>;
    /**
     * Deletes a workflow
     * @param id The workflow ID
     */
    deleteWorkflow(id: string): Promise<void>;
    /**
     * Fetches workflow executions
     * @param workflowId The workflow ID
     * @returns A list of workflow executions
     */
    getWorkflowExecutions(workflowId: string): Promise<WorkflowExecution[]>;
    /**
     * Fetches a workflow execution
     * @param workflowId The workflow ID
     * @param executionId The execution ID
     * @returns The workflow execution
     */
    getWorkflowExecution(workflowId: string, executionId: string): Promise<WorkflowExecution>;
    /**
     * Creates a workflow execution
     * @param workflowId The workflow ID
     * @param input The input data for the execution
     * @returns The created workflow execution
     */
    createWorkflowExecution(workflowId: string, input?: Record<string, any>): Promise<WorkflowExecution>;
    /**
     * Aborts a workflow execution
     * @param workflowId The workflow ID
     * @param executionId The execution ID
     */
    abortWorkflowExecution(workflowId: string, executionId: string): Promise<void>;
}
export declare const workflowDatabaseService: WorkflowDatabaseService;
