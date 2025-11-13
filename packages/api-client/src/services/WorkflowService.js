import { BaseService } from './BaseService';
/**
 * Workflow service for managing workflows
 */
export class WorkflowService extends BaseService {
    /**
     * Create a new workflow service
     * @param apiClient API client
     */
    constructor(apiClient) {
        super(apiClient, '/workflows');
    }
    /**
     * Get all workflows
     * @param page Page number
     * @param limit Number of workflows per page
     * @returns Promise resolving to the workflows data
     */
    async getWorkflows(page = 1, limit = 10) {
        return this.apiClient.get(this.getPath(), { params: { page, limit } });
    }
    /**
     * Get a workflow by ID
     * @param id Workflow ID
     * @returns Promise resolving to the workflow data
     */
    async getWorkflow(id) {
        return this.apiClient.get(this.getPath(`/${id}));
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
  async updateWorkflow(id: string, data: WorkflowUpdateData): Promise<Workflow> {`));
        return this.apiClient.patch(this.getPath(`/${id}`), data);
    }
    /**
     * Delete a workflow
     * @param id Workflow ID
     * @returns Promise resolving when the workflow is deleted
     */
    async deleteWorkflow(id) {
        await this.apiClient.delete(this.getPath(/${id}));
    }
    /**
     * Execute a workflow
     * @param id Workflow ID
     * @param input Workflow execution input
     * @returns Promise resolving to the workflow execution data
     */
    async executeWorkflow(id, input) {
        return this.apiClient.post(`
      this.getPath(/${id}` / execute),
            { input };
        ;
    }
    /**
     * Get workflow executions
     * @param id Workflow ID
     * @param page Page number
     * @param limit Number of executions per page
     * @returns Promise resolving to the workflow executions data
     */
    async getWorkflowExecutions(id, page = 1, limit = 10) {
        return this.apiClient.get(this.getPath(/${id}/executions), { params: { page, limit } });
    }
}
/**
 * Get a workflow execution by ID
 * @param id Workflow ID
 * @param executionId Workflow execution ID
 * @returns Promise resolving to the workflow execution data
 */ `
  async getWorkflowExecution(id: string, executionId: string): Promise<WorkflowExecution> {`;
return this.apiClient.get(this.getPath(/${id}`/executions / $, { executionId } `)
    );
  }
}
));
//# sourceMappingURL=WorkflowService.js.map