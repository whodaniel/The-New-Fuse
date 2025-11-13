/**
 * Workflow controller implementation
 * Provides standardized REST API endpoints for workflow operations
 */
import { WorkflowService } from '../services/workflow.service';
import { BaseController } from './base.controller';
import type { CreateWorkflowDto, UpdateWorkflowDto } from '@the-new-fuse/api-types/src/workflow';
import { UnifiedWorkflow } from '@the-new-fuse/workflow-engine';
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    meta?: Record<string, unknown>;
}
export declare class WorkflowController extends BaseController {
    private readonly workflowService;
    constructor(workflowService: WorkflowService);
    /**
     * Get all workflows for the current user
     * @param user Current user
     * @returns Array of workflows
     */
    getWorkflows(user: any): Promise<ApiResponse<UnifiedWorkflow[]>>;
    /**
     * Get workflow by ID
     * @param id Workflow ID
     * @param user Current user
     * @returns Workflow
     */
    getWorkflow(id: string, user: any): Promise<ApiResponse<UnifiedWorkflow>>;
    /**
     * Create a new workflow
     * @param data Workflow creation data
     * @param user Current user
     * @returns Created workflow
     */
    createWorkflow(data: CreateWorkflowDto, user: any): Promise<ApiResponse<UnifiedWorkflow>>;
    /**
     * Update a workflow
     * @param id Workflow ID
     * @param updates Workflow update data
     * @param user Current user
     * @returns Updated workflow
     */
    updateWorkflow(id: string, updates: UpdateWorkflowDto, user: any): Promise<ApiResponse<UnifiedWorkflow>>;
    /**
     * Delete a workflow
     * @param id Workflow ID
     * @param user Current user
     * @returns Success/failure response
     */
    deleteWorkflow(id: string, user: any): Promise<ApiResponse<void>>;
    /**
     * Execute a workflow
     * @param id Workflow ID
     * @param inputs Workflow inputs
     * @param user Current user
     * @returns Workflow execution
     */
    executeWorkflow(id: string, inputs: Record<string, any> | undefined, user: any): Promise<ApiResponse<any>>;
    /**
     * Get workflow executions
     * @param id Workflow ID
     * @param user Current user
     * @returns Array of workflow executions
     */
    getWorkflowExecutions(id: string, user: any): Promise<ApiResponse<any[]>>;
    /**
     * Get workflow execution by ID
     * @param id Workflow ID
     * @param executionId Execution ID
     * @param user Current user
     * @returns Workflow execution
     */
    getExecution(id: string, executionId: string, user: any): Promise<ApiResponse<any>>;
}
export {};
//# sourceMappingURL=workflow.controller.d.ts.map