/**
 * Workflow Service - Drizzle ORM Implementation
 *
 * This service provides business logic for Workflow operations.
 * It uses the Drizzle-based WorkflowRepository for data access.
 */
import { WorkflowRepository, WorkflowExecutionRepository, type Workflow, type NewWorkflow, type WorkflowExecution } from '../repositories/workflow.repository.js';
export declare class WorkflowService {
    private readonly workflowRepository;
    private readonly executionRepository;
    private readonly logger;
    constructor(workflowRepository: WorkflowRepository, executionRepository: WorkflowExecutionRepository);
    /**
     * Handle errors consistently
     */
    private handleError;
    /**
     * Create a new workflow
     */
    createWorkflow(data: Partial<NewWorkflow>, userId: string): Promise<Workflow>;
    /**
     * Get all workflows for a user
     */
    getWorkflows(userId: string): Promise<Workflow[]>;
    /**
     * Get workflow by ID
     */
    getWorkflowById(id: string, userId: string): Promise<Workflow>;
    /**
     * Update a workflow
     */
    updateWorkflow(id: string, updates: Partial<NewWorkflow>, userId: string): Promise<Workflow>;
    /**
     * Delete a workflow
     */
    deleteWorkflow(id: string, userId: string): Promise<void>;
    /**
     * Execute a workflow
     */
    executeWorkflow(id: string, userId: string, inputs?: Record<string, any>): Promise<WorkflowExecution>;
    /**
     * Get workflow executions
     */
    getWorkflowExecutions(workflowId: string, userId: string): Promise<WorkflowExecution[]>;
    /**
     * Get workflow execution by ID
     */
    getExecutionById(id: string, userId: string): Promise<WorkflowExecution>;
}
//# sourceMappingURL=workflow.service.d.ts.map