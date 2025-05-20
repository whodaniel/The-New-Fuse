import { Subject } from 'rxjs';
import { ExecutionUpdate } from '../types.js';

class WorkflowExecutionService {
  private executionSubject = new Subject<ExecutionUpdate>();

  subscribe(callback: (update: ExecutionUpdate) => void) {
    return this.executionSubject.subscribe(callback);
  }

  async deployWorkflow(workflow: unknown): Promise<void> {
    try {
      const response = await fetch('/api/workflows/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflow),
      });
      
      if (!response.ok) {
        throw new Error('Deployment failed');
      }
      
      return await response.json();
    } catch (error) {
      throw new Error(`Deployment failed: ${error.message}`);
    }
  }

  async executeNode(nodeId: string, inputs: unknown): Promise<unknown> {
    try {
      this.executionSubject.next({
        nodeId,
        state: 'running',
        message: 'Starting execution...',
      });

      const response = await fetch(`/api/nodes/${nodeId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs }),
      });

      const result = await response.json();

      this.executionSubject.next({
        nodeId,
        state: 'completed',
        message: 'Execution completed',
        result,
      });

      return result;
    } catch (error) {
      this.executionSubject.next({
        nodeId,
        state: 'error',
        message: error.message,
      });
      throw error;
    }
  }
}

export const workflowExecutionService = new WorkflowExecutionService();