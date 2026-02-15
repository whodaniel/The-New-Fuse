import { ApiClient } from '../client/ApiClient';
import { BaseService } from './BaseService';
/**
 * Workflow step interface
 */
export interface WorkflowStep {
    id: string;
    name: string;
    type: string;
    config: Record<string, any>;
    position: number;
}
/**
 * Workflow interface
 */
export interface Workflow {
    id: string;
    name: string;
    description: string;
    steps: WorkflowStep[];
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    isPublic: boolean;
    tags?: string[];
}
/**
 * Workflow execution status
 */
export declare enum WorkflowExecutionStatus {
    PENDING = "PENDING",
    RUNNING = "RUNNING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED"
}
/**
 * Workflow execution step result
 */
export interface WorkflowStepExecution {
    id: string;
    stepId: string;
    status: WorkflowExecutionStatus;
    startedAt: string;
    completedAt?: string;
    result?: any;
    error?: string;
}
/**
 * Workflow execution interface
 */
export interface WorkflowExecution {
    id: string;
    workflowId: string;
    status: WorkflowExecutionStatus;
    startedAt: string;
    completedAt?: string;
    params: Record<string, any>;
    result?: any;
    error?: string;
    steps: WorkflowStepExecution[];
}
/**
 * Workflow creation data
 */
export interface WorkflowCreateData {
    name: string;
    description?: string;
    steps: Omit<WorkflowStep, 'id'>[];
    isPublic?: boolean;
    tags?: string[];
}
/**
 * Workflow update data
 */
export interface WorkflowUpdateData {
    name?: string;
    description?: string;
    steps?: Omit<WorkflowStep, 'id'>[];
    isPublic?: boolean;
    tags?: string[];
}
/**
 * Workflow service for managing workflows and their executions
 */
export declare class WorkflowService extends BaseService {
    /**
     * Create a new workflow service
     * @param api API client instance
     */
    constructor(api: ApiClient);
    /**
     * Get all workflows
     * @param options Query options (page, limit, search, tags, etc.)
     * @returns Promise with workflows list
     */
    getWorkflows(options?: Record<string, any>): Promise<Workflow[]>;
    /**
     * Get workflow by ID
     * @param id Workflow ID
     * @returns Promise with workflow data
     */
    getWorkflowById(id: string): Promise<Workflow>;
    /**
     * Create a new workflow
     * @param data Workflow data
     * @returns Promise with created workflow data
     */
    createWorkflow(data: WorkflowCreateData): Promise<Workflow>;
    /**
     * Update workflow
     * @param id Workflow ID
     * @param data Workflow data to update
     * @returns Promise with updated workflow data
     */
    updateWorkflow(id: string, data: WorkflowUpdateData): Promise<Workflow>;
    /**
     * Delete workflow
     * @param id Workflow ID
     * @returns Promise with deletion response
     */
    deleteWorkflow(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Execute workflow
     * @param id Workflow ID
     * @param params Execution parameters
     * @returns Promise with execution response
     */
    executeWorkflow(id: string, params?: Record<string, any>): Promise<WorkflowExecution>;
    /**
     * Get workflow execution by ID
     * @param id Execution ID
     * @returns Promise with execution data
     */
    getExecutionById(id: string): Promise<WorkflowExecution>;
    /**
     * Get workflow executions by workflow ID
     * @param workflowId Workflow ID
     * @param options Query options (page, limit, status, etc.)
     * @returns Promise with executions list
     */
    getExecutionsByWorkflowId(workflowId: string, options?: Record<string, any>): Promise<WorkflowExecution[]>;
    /**
     * Cancel workflow execution
     * @param executionId Execution ID
     * @returns Promise with cancellation response
     */
    cancelExecution(executionId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Get workflow execution logs
     * @param executionId Execution ID
     * @returns Promise with execution logs
     */
    getExecutionLogs(executionId: string): Promise<string[]>;
}
/**
 * Create a new workflow service
 * @param api API client instance
 * @returns Workflow service instance
 *
 * @example
 * ```typescript
 * import { createApiClient, createWorkflowService, WorkflowCreateData } from '@the-new-fuse/api-client';
 *
 * // Create a new API client
 * const api = createApiClient({
 *   baseURL: 'https://api.example.com',
 * });
 *
 * // Create workflow service
 * const workflowService = createWorkflowService(api);
 *
 * // Get all workflows
 * const workflows = await workflowService.getWorkflows();
 *
 * // Create a new workflow
 * const workflowData: WorkflowCreateData = {
 *   name: 'Data Processing',
 *   description: 'Process and analyze data',
 *   steps: [
 *     { name: 'Extract', type: 'extract', config: { source: 'database' }, position: 1 },
 *     { name: 'Transform', type: 'transform', config: { operation: 'normalize' }, position: 2 },
 *     { name: 'Load', type: 'load', config: { destination: 'warehouse' }, position: 3 },
 *   ],
 * };
 *
 * const workflow = await workflowService.createWorkflow(workflowData);
 *
 * // Execute workflow
 * const execution = await workflowService.executeWorkflow(
 *   workflow.id,
 *   { input: { dataSource: 'customers' } }
 * );
 * ```
 */
export declare function createWorkflowService(api: ApiClient): WorkflowService;
