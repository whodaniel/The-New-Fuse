import { BaseService } from './BaseService';
/**
 * Workflow execution status
 */
export var WorkflowExecutionStatus;
(function (WorkflowExecutionStatus) {
    WorkflowExecutionStatus["PENDING"] = "PENDING";
    WorkflowExecutionStatus["RUNNING"] = "RUNNING";
    WorkflowExecutionStatus["COMPLETED"] = "COMPLETED";
    WorkflowExecutionStatus["FAILED"] = "FAILED";
    WorkflowExecutionStatus["CANCELLED"] = "CANCELLED";
})(WorkflowExecutionStatus || (WorkflowExecutionStatus = {}));
/**
 * Workflow service for managing workflows and their executions
 */
export class WorkflowService extends BaseService {
    /**
     * Create a new workflow service
     * @param api API client instance
     */
    constructor(api) {
        super(api, '/workflows');
    }
    /**
     * Get all workflows
     * @param options Query options (page, limit, search, tags, etc.)
     * @returns Promise with workflows list
     */
    async getWorkflows(options = {}) {
        return this.list('', options);
    }
    /**
     * Get workflow by ID
     * @param id Workflow ID
     * @returns Promise with workflow data
     */
    async getWorkflowById(id) {
        return this.getById(id);
    }
    /**
     * Create a new workflow
     * @param data Workflow data
     * @returns Promise with created workflow data
     */
    async createWorkflow(data) {
        this.validateRequired({ name: data.name, steps: data.steps }, ['name', 'steps']);
        return this.create(data);
    }
    /**
     * Update workflow
     * @param id Workflow ID
     * @param data Workflow data to update
     * @returns Promise with updated workflow data
     */
    async updateWorkflow(id, data) {
        return this.updateById(id, data);
    }
    /**
     * Delete workflow
     * @param id Workflow ID
     * @returns Promise with deletion response
     */
    async deleteWorkflow(id) {
        return this.deleteById(id);
    }
    /**
     * Execute workflow
     * @param id Workflow ID
     * @param params Execution parameters
     * @returns Promise with execution response
     */
    async executeWorkflow(id, params = {}) {
        this.validateRequired({ id }, ['id']);
        return this.post(`/${id}/execute`, params);
    }
    /**
     * Get workflow execution by ID
     * @param id Execution ID
     * @returns Promise with execution data
     */
    async getExecutionById(id) {
        this.validateRequired({ id }, ['id']);
        return this.get(`/executions/${id}`);
    }
    /**
     * Get workflow executions by workflow ID
     * @param workflowId Workflow ID
     * @param options Query options (page, limit, status, etc.)
     * @returns Promise with executions list
     */
    async getExecutionsByWorkflowId(workflowId, options = {}) {
        this.validateRequired({ workflowId }, ['workflowId']);
        const queryString = this.buildQueryString(options);
        return this.get(`/${workflowId}/executions${queryString}`);
    }
    /**
     * Cancel workflow execution
     * @param executionId Execution ID
     * @returns Promise with cancellation response
     */
    async cancelExecution(executionId) {
        this.validateRequired({ executionId }, ['executionId']);
        return this.post(`/executions/${executionId}/cancel`);
    }
    /**
     * Get workflow execution logs
     * @param executionId Execution ID
     * @returns Promise with execution logs
     */
    async getExecutionLogs(executionId) {
        this.validateRequired({ executionId }, ['executionId']);
        return this.get(`/executions/${executionId}/logs`);
    }
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
export function createWorkflowService(api) {
    return new WorkflowService(api);
}
