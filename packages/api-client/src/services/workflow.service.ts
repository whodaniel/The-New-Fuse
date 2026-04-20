import { ApiClient } from '../client/ApiClient.js';
import { BaseService } from './BaseService.js';

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
export enum WorkflowExecutionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
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
export class WorkflowService extends BaseService {
  /**
   * Create a new workflow service
   * @param api API client instance
   */
  constructor(api: ApiClient) {
    super(api, '/workflows');
  }

  /**
   * Get all workflows
   * @param options Query options (page, limit, search, tags, etc.)
   * @returns Promise with workflows list
   */
  async getWorkflows(options: Record<string, any> = {}): Promise<Workflow[]> {
    return this.list<Workflow[]>('', options);
  }

  /**
   * Get workflow by ID
   * @param id Workflow ID
   * @returns Promise with workflow data
   */
  async getWorkflowById(id: string): Promise<Workflow> {
    return this.getById<Workflow>(id);
  }

  /**
   * Create a new workflow
   * @param data Workflow data
   * @returns Promise with created workflow data
   */
  async createWorkflow(data: WorkflowCreateData): Promise<Workflow> {
    this.validateRequired({ name: data.name, steps: data.steps }, ['name', 'steps']);
    return this.create<Workflow>(data);
  }

  /**
   * Update workflow
   * @param id Workflow ID
   * @param data Workflow data to update
   * @returns Promise with updated workflow data
   */
  async updateWorkflow(id: string, data: WorkflowUpdateData): Promise<Workflow> {
    return this.updateById<Workflow>(id, data);
  }

  /**
   * Delete workflow
   * @param id Workflow ID
   * @returns Promise with deletion response
   */
  async deleteWorkflow(id: string): Promise<{ success: boolean; message: string }> {
    return this.deleteById<{ success: boolean; message: string }>(id);
  }

  /**
   * Execute workflow
   * @param id Workflow ID
   * @param params Execution parameters
   * @returns Promise with execution response
   */
  async executeWorkflow(id: string, params: Record<string, any> = {}): Promise<WorkflowExecution> {
    this.validateRequired({ id }, ['id']);
    return this.post<WorkflowExecution>(`/${id}/execute`, params);
  }

  /**
   * Get workflow execution by ID
   * @param id Execution ID
   * @returns Promise with execution data
   */
  async getExecutionById(id: string): Promise<WorkflowExecution> {
    this.validateRequired({ id }, ['id']);
    return this.get<WorkflowExecution>(`/executions/${id}`);
  }

  /**
   * Get workflow executions by workflow ID
   * @param workflowId Workflow ID
   * @param options Query options (page, limit, status, etc.)
   * @returns Promise with executions list
   */
  async getExecutionsByWorkflowId(workflowId: string, options: Record<string, any> = {}): Promise<WorkflowExecution[]> {
    this.validateRequired({ workflowId }, ['workflowId']);
    const queryString = this.buildQueryString(options);
    return this.get<WorkflowExecution[]>(`/${workflowId}/executions${queryString}`);
  }

  /**
   * Cancel workflow execution
   * @param executionId Execution ID
   * @returns Promise with cancellation response
   */
  async cancelExecution(executionId: string): Promise<{ success: boolean; message: string }> {
    this.validateRequired({ executionId }, ['executionId']);
    return this.post<{ success: boolean; message: string }>(`/executions/${executionId}/cancel`);
  }

  /**
   * Get workflow execution logs
   * @param executionId Execution ID
   * @returns Promise with execution logs
   */
  async getExecutionLogs(executionId: string): Promise<string[]> {
    this.validateRequired({ executionId }, ['executionId']);
    return this.get<string[]>(`/executions/${executionId}/logs`);
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
export function createWorkflowService(api: ApiClient): WorkflowService {
  return new WorkflowService(api);
}
