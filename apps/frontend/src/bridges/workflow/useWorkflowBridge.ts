import { useCallback, useEffect, useState } from 'react';
import { useRelay } from '../relay/RelayProvider';
import {
  BridgeState,
  createInitialBridgeState,
  createLoadingBridgeState,
  createSuccessBridgeState,
} from '../types/BridgeCommon';

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'running' | 'paused' | 'error';
  lastRun?: string;
  nodes: number; // Count of nodes
  createdAt: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed';
  currentStep: string;
  logs: string[];
  startTime: string;
}

export interface UseWorkflowBridgeReturn {
  // Data
  workflows: BridgeState<Workflow[]>;
  activeExecution: BridgeState<WorkflowExecution | null>;

  // Actions
  refreshWorkflows: () => Promise<void>;
  runWorkflow: (id: string, params?: Record<string, unknown>) => Promise<void>;
  stopWorkflow: (id: string) => Promise<void>;
}

/**
 * Bridge hook for Pillar II: The Workflow Engine.
 * Connects to the Redis bus via Relay to manage workflows.
 */
export function useWorkflowBridge(): UseWorkflowBridgeReturn {
  const { sendMessage, subscribeToMessages, connectionState } = useRelay();

  const [workflows, setWorkflows] = useState<BridgeState<Workflow[]>>(createInitialBridgeState());

  const [activeExecution, setActiveExecution] = useState<BridgeState<WorkflowExecution | null>>(
    createInitialBridgeState()
  );

  const refreshWorkflows = useCallback(async () => {
    setWorkflows((prev) => createLoadingBridgeState(prev.data));
    await sendMessage('WORKFLOW_LIST_REQUEST', {});
  }, [sendMessage]);

  const runWorkflow = useCallback(
    async (id: string, params: Record<string, unknown> = {}) => {
      setActiveExecution(createLoadingBridgeState(null));
      await sendMessage('WORKFLOW_RUN_REQUEST', { workflowId: id, params });
    },
    [sendMessage]
  );

  const stopWorkflow = useCallback(
    async (id: string) => {
      await sendMessage('WORKFLOW_STOP_REQUEST', { workflowId: id });
    },
    [sendMessage]
  );

  // Subscriptions
  useEffect(() => {
    if (connectionState.status !== 'connected') return;

    const sub = subscribeToMessages(
      {
        messageType: [
          'WORKFLOW_LIST_UPDATE',
          'WORKFLOW_EXECUTION_UPDATE',
          'WORKFLOW_EXECUTION_TYPE',
        ],
      },
      (message) => {
        if (message.type === 'WORKFLOW_LIST_UPDATE') {
          setWorkflows(createSuccessBridgeState(message.payload as Workflow[]));
        }

        if (message.type === 'WORKFLOW_EXECUTION_UPDATE') {
          setActiveExecution(createSuccessBridgeState(message.payload as WorkflowExecution));
        }
      }
    );

    // Initial load
    refreshWorkflows();

    return () => {
      sub.unsubscribe();
    };
  }, [connectionState.status, subscribeToMessages, refreshWorkflows]);

  return {
    workflows,
    activeExecution,
    refreshWorkflows,
    runWorkflow,
    stopWorkflow,
  };
}
