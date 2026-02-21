import { Workflow, WorkflowExecution, WorkflowStep } from '../types.js';

/**
 * Service responsible for persisting workflow definitions and execution states
 */
export class WorkflowPersistenceService {
  private readonly WORKFLOW_KEY_PREFIX = 'workflow:';
  private readonly EXECUTION_KEY_PREFIX = 'workflow-execution:';
  
  /**
   * Save a workflow definition
   */
  async saveWorkflow(workflow: Workflow): Promise<void> {
    try {
      localStorage.setItem(
        `${this.WORKFLOW_KEY_PREFIX}${workflow.id}`,
        JSON.stringify(workflow)
      );
    } catch (error) {
      console.error('Failed to save workflow:', error);
      throw new Error(`Failed to save workflow: ${error}`);
    }
  }
  
  /**
   * Get a workflow definition by ID
   */
  async getWorkflow(id: string): Promise<Workflow | null> {
    try {
      const data = localStorage.getItem(`${this.WORKFLOW_KEY_PREFIX}${id}`);
      if (!data) return null;
      return JSON.parse(data) as Workflow;
    } catch (error) {
      console.error(`Failed to get workflow ${id}:`, error);
      return null;
    }
  }
  
  /**
   * List all saved workflows
   */
  async listWorkflows(): Promise<Workflow[]> {
    try {
      const workflows: Workflow[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.WORKFLOW_KEY_PREFIX)) {
          const data = localStorage.getItem(key);
          if (data) {
            workflows.push(JSON.parse(data) as Workflow);
          }
        }
      }
      return workflows;
    } catch (error) {
      console.error('Failed to list workflows:', error);
      return [];
    }
  }
  
  /**
   * Delete a workflow by ID
   */
  async deleteWorkflow(id: string): Promise<void> {
    try {
      localStorage.removeItem(`${this.WORKFLOW_KEY_PREFIX}${id}`);
    } catch (error) {
      console.error(`Failed to delete workflow ${id}:`, error);
      throw new Error(`Failed to delete workflow: ${error}`);
    }
  }
  
  /**
   * Save workflow execution state
   */
  async saveExecution(execution: WorkflowExecution): Promise<void> {
    try {
      localStorage.setItem(
        `${this.EXECUTION_KEY_PREFIX}${execution.id}`,
        JSON.stringify(execution)
      );
    } catch (error) {
      console.error('Failed to save workflow execution:', error);
      throw new Error(`Failed to save workflow execution: ${error}`);
    }
  }
  
  /**
   * Get workflow execution by ID
   */
  async getExecution(id: string): Promise<WorkflowExecution | null> {
    try {
      const data = localStorage.getItem(`${this.EXECUTION_KEY_PREFIX}${id}`);
      if (!data) return null;
      return JSON.parse(data) as WorkflowExecution;
    } catch (error) {
      console.error(`Failed to get workflow execution ${id}:`, error);
      return null;
    }
  }
  
  /**
   * List all workflow executions
   */
  async listExecutions(): Promise<WorkflowExecution[]> {
    try {
      const executions: WorkflowExecution[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.EXECUTION_KEY_PREFIX)) {
          const data = localStorage.getItem(key);
          if (data) {
            executions.push(JSON.parse(data) as WorkflowExecution);
          }
        }
      }
      return executions;
    } catch (error) {
      console.error('Failed to list workflow executions:', error);
      return [];
    }
  }
  
  /**
   * Delete workflow execution by ID
   */
  async deleteExecution(id: string): Promise<void> {
    try {
      localStorage.removeItem(`${this.EXECUTION_KEY_PREFIX}${id}`);
    } catch (error) {
      console.error(`Failed to delete workflow execution ${id}:`, error);
      throw new Error(`Failed to delete workflow execution: ${error}`);
    }
  }
}
