import { BaseService } from './BaseService.js';

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
export class WorkflowService extends BaseService {
  /**
   * Create a new workflow service
   * @param apiClient API client
   */
  constructor(apiClient: any) {
    super(apiClient, '/workflows');
  }

  /**
   * Get all workflows
   * @param page Page number
   * @param limit Number of workflows per page
   * @returns Promise resolving to the workflows data
   */
  async getWorkflows(page: number = 1, limit: number = 10): Promise<{ workflows: Workflow[]; total: number }> {
    return this.apiClient.get<{ workflows: Workflow[]; total: number }>(
      this.getPath(),
      { params: { page, limit } }
    );
  }

  /**
   * Get a workflow by ID
   * @param id Workflow ID
   * @returns Promise resolving to the workflow data
   */
  async getWorkflow(id: string): Promise<Workflow> {
    return this.apiClient.get<Workflow>(this.getPath(`/${id}`));
  }

  /**
   * Create a new workflow
   * @param data Workflow creation data
   * @returns Promise resolving to the created workflow data
   */
  async createWorkflow(data: WorkflowCreateData): Promise<Workflow> {
    return this.apiClient.post<Workflow>(this.getPath(), data);
  }

  /**
   * Update a workflow
   * @param id Workflow ID
   * @param data Workflow update data
   * @returns Promise resolving to the updated workflow data
   */
  async updateWorkflow(id: string, data: WorkflowUpdateData): Promise<Workflow> {
    return this.apiClient.patch<Workflow>(this.getPath(`/${id}`), data);
  }

  /**
   * Delete a workflow
   * @param id Workflow ID
   * @returns Promise resolving when the workflow is deleted
   */
  async deleteWorkflow(id: string): Promise<void> {
    await this.apiClient.delete(this.getPath(`/${id}`));
  }

  /**
   * Execute a workflow
   * @param id Workflow ID
   * @param input Workflow execution input
   * @returns Promise resolving to the workflow execution data
   */
  async executeWorkflow(id: string, input: any): Promise<WorkflowExecution> {
    return this.apiClient.post<WorkflowExecution>(
      this.getPath(`/${id}/execute`),
      { input }
    );
  }

  /**
   * Get workflow executions
   * @param id Workflow ID
   * @param page Page number
   * @param limit Number of executions per page
   * @returns Promise resolving to the workflow executions data
   */
  async getWorkflowExecutions(
    id: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ executions: WorkflowExecution[]; total: number }> {
    return this.apiClient.get<{ executions: WorkflowExecution[]; total: number }>(
      this.getPath(`/${id}/executions`),
      { params: { page, limit } }
    );
  }

  /**
   * Get a workflow execution by ID
   * @param id Workflow ID
   * @param executionId Workflow execution ID
   * @returns Promise resolving to the workflow execution data
   */
  async getWorkflowExecution(id: string, executionId: string): Promise<WorkflowExecution> {
    return this.apiClient.get<WorkflowExecution>(
      this.getPath(`/${id}/executions/${executionId}`)
    );
  }
}
