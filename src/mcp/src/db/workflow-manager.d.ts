/**
 * WorkflowManager handles database operations for workflows and workflow executions
 */
export declare class WorkflowManager {
    /**
     * Create a new workflow
     * @param name Workflow name
     * @param description Workflow description
     * @param steps Workflow steps definition
     * @param createdBy Agent ID that created the workflow
     * @returns The created workflow
     */
    createWorkflow(name: string, description: string, steps: any[], createdBy: string): Promise<any>;
    /**
     * Get workflow by ID
     * @param workflowId The workflow ID
     * @returns Workflow details
     */
    getWorkflowById(workflowId: string): Promise<any>;
    /**
     * Update an existing workflow
     * @param workflowId Workflow ID to update
     * @param name New workflow name
     * @param description New workflow description
     * @param steps New workflow steps
     * @returns The updated workflow
     */
    updateWorkflow(workflowId: string, name?: string, description?: string, steps?: any[]): Promise<any>;
    /**
     * List all workflows, optionally filtered by creator
     * @param createdBy Optional agent ID that created the workflows
     * @returns Array of workflows
     */
    listWorkflows(createdBy?: string): Promise<any[]>;
    /**
     * Delete a workflow
     * @param workflowId The workflow ID to delete
     */
    deleteWorkflow(workflowId: string): Promise<void>;
    /**
     * Start a workflow execution
     * @param workflowId Workflow ID to execute
     * @param initiatedBy Agent ID that started the execution
     * @param inputs Initial inputs for the workflow
     * @returns The workflow execution record
     */
    startExecution(workflowId: string, initiatedBy: string, inputs?: any): Promise<any>;
    /**
     * Update workflow execution status
     * @param executionId Execution ID to update
     * @param status New status
     * @param currentStepIndex Current step index
     * @param outputs Optional outputs from the workflow
     * @param error Optional error message
     */
    updateExecutionStatus(executionId: string, status: 'in_progress' | 'completed' | 'failed' | 'paused', currentStepIndex?: number, outputs?: any, error?: string): Promise<any>;
    /**
     * Get workflow execution by ID
     * @param executionId The execution ID
     * @returns Execution details
     */
    getExecutionById(executionId: string): Promise<any>;
    /**
     * List executions for a workflow
     * @param workflowId Workflow ID
     * @param limit Maximum number of executions to return
     * @returns Array of executions
     */
    listExecutions(workflowId: string, limit?: number): Promise<any[]>;
    /**
     * Record a step execution
     * @param executionId Execution ID
     * @param stepIndex Step index in the workflow
     * @param stepId Step identifier
     * @param inputs Inputs to the step
     * @param outputs Outputs from the step
     * @param error Optional error message
     */
    recordStepExecution(executionId: string, stepIndex: number, stepId: string, inputs: any, outputs?: any, error?: string): Promise<any>;
    /**
     * Get step executions for a workflow execution
     * @param executionId Execution ID
     * @returns Array of step executions
     */
    getStepExecutions(executionId: string): Promise<any[]>;
}
//# sourceMappingURL=workflow-manager.d.ts.map