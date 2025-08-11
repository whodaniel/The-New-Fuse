/**
 * Workflow Execution Service - Real-time workflow execution monitoring
 */

import { WorkflowExecution, WorkflowExecutionLog, NodeExecution } from './WorkflowService';

export interface ExecutionUpdate {
  type: 'status' | 'log' | 'node' | 'complete' | 'error';
  executionId: string;
  data: any;
  timestamp: Date;
}

export interface ExecutionSubscription {
  executionId: string;
  callback: (update: ExecutionUpdate) => void;
  cleanup: () => void;
}

class WorkflowExecutionService {
  private subscriptions: Map<string, ExecutionSubscription[]> = new Map();
  private websockets: Map<string, WebSocket> = new Map();

  // Subscribe to real-time execution updates
  subscribeToExecution(
    executionId: string,
    callback: (update: ExecutionUpdate) => void
  ): () => void {
    // Add subscription
    const subscriptions = this.subscriptions.get(executionId) || [];
    const subscription: ExecutionSubscription = {
      executionId,
      callback,
      cleanup: () => this.unsubscribe(executionId, subscription)
    };
    
    subscriptions.push(subscription);
    this.subscriptions.set(executionId, subscriptions);

    // Create WebSocket connection if not exists
    if (!this.websockets.has(executionId)) {
      this.createWebSocketConnection(executionId);
    }

    // Return cleanup function
    return subscription.cleanup;
  }

  private createWebSocketConnection(executionId: string): void {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/workflows/executions/${executionId}/stream`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log(`WebSocket connected for execution ${executionId}`);
    };

    ws.onmessage = (event) => {
      try {
        const update: ExecutionUpdate = {
          ...JSON.parse(event.data),
          timestamp: new Date()
        };
        
        this.notifySubscribers(executionId, update);
      } catch (error) {
        console.error('Failed to parse execution update:', error);
      }
    };

    ws.onerror = (error) => {
      console.error(`WebSocket error for execution ${executionId}:`, error);
    };

    ws.onclose = () => {
      console.log(`WebSocket closed for execution ${executionId}`);
      this.websockets.delete(executionId);
      
      // Attempt to reconnect after 5 seconds if there are still subscribers
      if (this.subscriptions.has(executionId) && this.subscriptions.get(executionId)!.length > 0) {
        setTimeout(() => {
          this.createWebSocketConnection(executionId);
        }, 5000);
      }
    };

    this.websockets.set(executionId, ws);
  }

  private notifySubscribers(executionId: string, update: ExecutionUpdate): void {
    const subscriptions = this.subscriptions.get(executionId) || [];
    subscriptions.forEach(subscription => {
      try {
        subscription.callback(update);
      } catch (error) {
        console.error('Error in execution update callback:', error);
      }
    });
  }

  private unsubscribe(executionId: string, subscription: ExecutionSubscription): void {
    const subscriptions = this.subscriptions.get(executionId) || [];
    const index = subscriptions.indexOf(subscription);
    
    if (index > -1) {
      subscriptions.splice(index, 1);
      
      if (subscriptions.length === 0) {
        // No more subscribers, close WebSocket
        const ws = this.websockets.get(executionId);
        if (ws) {
          ws.close();
          this.websockets.delete(executionId);
        }
        this.subscriptions.delete(executionId);
      } else {
        this.subscriptions.set(executionId, subscriptions);
      }
    }
  }

  // Get execution status with polling fallback
  async getExecutionStatus(executionId: string): Promise<WorkflowExecution> {
    const response = await fetch(`/api/workflows/executions/${executionId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get execution status: ${response.statusText}`);
    }

    const execution = await response.json();
    return {
      ...execution,
      startTime: new Date(execution.startTime),
      endTime: execution.endTime ? new Date(execution.endTime) : undefined,
      logs: execution.logs?.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp)
      })) || [],
      nodeExecutions: execution.nodeExecutions?.map((nodeExec: any) => ({
        ...nodeExec,
        startTime: nodeExec.startTime ? new Date(nodeExec.startTime) : undefined,
        endTime: nodeExec.endTime ? new Date(nodeExec.endTime) : undefined,
      })) || [],
    };
  }

  // Control execution
  async pauseExecution(executionId: string): Promise<void> {
    const response = await fetch(`/api/workflows/executions/${executionId}/pause`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to pause execution: ${response.statusText}`);
    }
  }

  async resumeExecution(executionId: string): Promise<void> {
    const response = await fetch(`/api/workflows/executions/${executionId}/resume`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to resume execution: ${response.statusText}`);
    }
  }

  async cancelExecution(executionId: string): Promise<void> {
    const response = await fetch(`/api/workflows/executions/${executionId}/cancel`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel execution: ${response.statusText}`);
    }
  }

  // Cleanup all connections
  cleanup(): void {
    this.websockets.forEach(ws => ws.close());
    this.websockets.clear();
    this.subscriptions.clear();
  }
}

// Export singleton instance
export const workflowExecutionService = new WorkflowExecutionService();
export default WorkflowExecutionService;