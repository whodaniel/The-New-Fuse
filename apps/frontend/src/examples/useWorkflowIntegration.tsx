import { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket.js';

interface WorkflowState {
  isConnected: boolean;
  activeWorkflows: number;
  totalAgents: number;
  systemHealth: 'healthy' | 'degraded' | 'critical';
}

export function useWorkflowIntegration(): any {
  const [state, setState] = useState<WorkflowState>({
    isConnected: false,
    activeWorkflows: 0,
    totalAgents: 0,
    systemHealth: 'healthy'
  });

  const { subscribe, send } = useWebSocket();

  useEffect(() => {
    const subscriptions = [
      subscribe('connection_status', (connected: boolean) => {
        setState((prev: any) => ({ ...prev, isConnected: connected }));
      }),

      subscribe('workflow_metrics', (data: any) => {
        setState((prev: any) => ({
          ...prev,
          activeWorkflows: data.activeWorkflows,
          totalAgents: data.totalAgents
        }));
      }),

      subscribe('system_health', (health: WorkflowState['systemHealth']) => {
        setState((prev: any) => ({ ...prev, systemHealth: health }));
      })
    ];

    // Initialize connection
    send('initialize_workflow_monitoring');

    return () => {
      subscriptions.forEach(unsubscrib(e: any) => unsubscribe());
    };
  }, [subscribe, send]);

  const startWorkflow = async (config: any) => {
    try {
      const response = await send('start_workflow', config);
      return response;
    } catch (error) {
      console.error('Failed to start workflow:', error);
      throw error;
    }
  };

  const stopWorkflow = async (workflowId: string) => {
    try {
      await send('stop_workflow', { workflowId });
    } catch (error) {
      console.error('Failed to stop workflow:', error);
      throw error;
    }
  };

  return {
    ...state,
    startWorkflow,
    stopWorkflow
  };
}