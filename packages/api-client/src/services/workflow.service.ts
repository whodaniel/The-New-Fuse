import { ApiClient } from '../client/ApiClient.js';

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
export class WorkflowService {
  private api: ApiClient;

  /**
   * Create a new workflow service
   * @param api API client instance
   */
  constructor(api: ApiClient) {
    this.api = api;
  }

  /**
   * Get all workflows
   * @returns Promise with workflows list
   */
  async getWorkflows(): Promise<Workflow[]> {
    return this.api.get<Workflow[]>('/workflows');
  }

  /**
   * Get workflow by ID
   * @param id Workflow ID
   * @returns Promise with workflow data
   */
  async getWorkflowById(id: string): Promise<Workflow> {
    return this.api.get<Workflow>(`/workflows/${id}`);
  }

  /**
   * Create a new workflow
   * @param data Workflow data
   * @returns Promise with created workflow data
   */
  async createWorkflow(data: WorkflowCreateData): Promise<Workflow> {
    return this.api.post<Workflow>('/workflows', data);
  }

  /**
   * Update workflow
   * @param id Workflow ID
   * @param data Workflow data to update
   * @returns Promise with updated workflow data
   */
  async updateWorkflow(id: string, data: WorkflowUpdateData): Promise<Workflow> {
    return this.api.put<Workflow>(`/workflows/${id}`, data);
  }

  /**
   * Delete workflow
   * @param id Workflow ID
   * @returns Promise with deletion response
   */
  async deleteWorkflow(id: string): Promise<{ success: boolean; message: string }> {
    return this.api.delete<{ success: boolean; message: string }>(`/workflows/${id}`);
  }

  /**
   * Execute workflow
   * @param id Workflow ID
   * @param params Execution parameters
   * @returns Promise with execution response
   */
  async executeWorkflow(id: string, params: Record<string, any> = {}): Promise<WorkflowExecution> {
    return this.api.post<WorkflowExecution>(`/workflows/${id}/execute`, params);
  }

  /**
   * Get workflow execution by ID
   * @param id Execution ID
   * @returns Promise with execution data
   */
  async getExecutionById(id: string): Promise<WorkflowExecution> {
    return this.api.get<WorkflowExecution>(`/workflow-executions/${id}`);
  }

  /**
   * Get workflow executions by workflow ID
   * @param workflowId Workflow ID
   * @returns Promise with executions list
   */
  async getExecutionsByWorkflowId(workflowId: string): Promise<WorkflowExecution[]> {
    return this.api.get<WorkflowExecution[]>(`/workflows/${workflowId}/executions`);
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
