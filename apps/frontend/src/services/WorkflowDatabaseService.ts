import { Workflow, WorkflowExecution, validateWorkflow, validateWorkflowExecution } from '@/utils/workflow-schema-validator';

/**
 * Service for interacting with the workflow database
 */
export class WorkflowDatabaseService {
  private apiBaseUrl: string;
  
  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  }
  
  /**
   * Fetches all workflows
   * @returns A list of workflows
   */
  async getWorkflows(): Promise<Workflow[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/workflows`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch workflows: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.map((workflow: any) => ({
        ...workflow,
        createdAt: workflow.createdAt ? new Date(workflow.createdAt) : undefined,
        updatedAt: workflow.updatedAt ? new Date(workflow.updatedAt) : undefined
      }));
    } catch (error) {
      console.error('Error fetching workflows:', error);
      throw error;
    }
  }
  
  /**
   * Fetches a workflow by ID
   * @param id The workflow ID
   * @returns The workflow
   */
  async getWorkflow(id: string): Promise<Workflow> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/workflows/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch workflow: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        ...data,
        createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined
      };
    } catch (error) {
      console.error(`Error fetching workflow ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Creates a new workflow
   * @param workflow The workflow to create
   * @returns The created workflow
   */
  async createWorkflow(workflow: Omit<Workflow, 'id'>): Promise<Workflow> {
    try {
      // Validate workflow
      const { id, ...workflowData } = workflow as any;
      
      const response = await fetch(`${this.apiBaseUrl}/workflows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workflowData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create workflow: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        ...data,
        createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined
      };
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  }
  
  /**
   * Updates a workflow
   * @param id The workflow ID
   * @param workflow The workflow data to update
   * @returns The updated workflow
   */
  async updateWorkflow(id: string, workflow: Partial<Workflow>): Promise<Workflow> {
    try {
      // Remove id from workflow data
      const { id: _, ...workflowData } = workflow;
      
      const response = await fetch(`${this.apiBaseUrl}/workflows/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workflowData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update workflow: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        ...data,
        createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined
      };
    } catch (error) {
      console.error(`Error updating workflow ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Deletes a workflow
   * @param id The workflow ID
   */
  async deleteWorkflow(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/workflows/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete workflow: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error deleting workflow ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Fetches workflow executions
   * @param workflowId The workflow ID
   * @returns A list of workflow executions
   */
  async getWorkflowExecutions(workflowId: string): Promise<WorkflowExecution[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/workflows/${workflowId}/executions`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch workflow executions: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching executions for workflow ${workflowId}:`, error);
      throw error;
    }
  }
  
  /**
   * Fetches a workflow execution
   * @param workflowId The workflow ID
   * @param executionId The execution ID
   * @returns The workflow execution
   */
  async getWorkflowExecution(workflowId: string, executionId: string): Promise<WorkflowExecution> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/workflows/${workflowId}/executions/${executionId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch workflow execution: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching execution ${executionId} for workflow ${workflowId}:`, error);
      throw error;
    }
  }
  
  /**
   * Creates a workflow execution
   * @param workflowId The workflow ID
   * @param input The input data for the execution
   * @returns The created workflow execution
   */
  async createWorkflowExecution(workflowId: string, input: Record<string, any> = {}): Promise<WorkflowExecution> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/workflows/${workflowId}/executions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ input })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create workflow execution: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error creating execution for workflow ${workflowId}:`, error);
      throw error;
    }
  }
  
  /**
   * Aborts a workflow execution
   * @param workflowId The workflow ID
   * @param executionId The execution ID
   */
  async abortWorkflowExecution(workflowId: string, executionId: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/workflows/${workflowId}/executions/${executionId}/abort`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to abort workflow execution: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error aborting execution ${executionId} for workflow ${workflowId}:`, error);
      throw error;
    }
  }
}

// Create singleton instance
export const workflowDatabaseService = new WorkflowDatabaseService();
