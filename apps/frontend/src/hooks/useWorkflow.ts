import {
  Workflow,
  WorkflowExecution,
  WorkflowTemplate,
  workflowService,
} from '@/services/WorkflowService';
import { useCallback, useState } from 'react';

export const useWorkflow = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);

  // Create a new workflow
  const createWorkflow = useCallback(async (name: string, description?: string) => {
    setLoading(true);
    setError(null);

    try {
      const newWorkflow = await workflowService.createWorkflow({
        name,
        description,
        nodes: [
          {
            id: 'input-1',
            type: 'input',
            position: { x: 100, y: 100 },
            data: {
              name: 'Workflow Input',
              type: 'input',
              config: {
                inputMapping: {},
              },
            },
          },
        ],
        edges: [],
        status: 'draft',
        version: 1,
        createdBy: 'current-user', // TODO: Get from auth context
        tags: [],
      });

      setWorkflows((prev) => [...prev, newWorkflow]);
      setCurrentWorkflow(newWorkflow);

      return newWorkflow;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create workflow'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load workflows from API
  const loadWorkflows = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const fetchedWorkflows = await workflowService.getWorkflows();
      setWorkflows(fetchedWorkflows);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load workflows'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Save a workflow
  const saveWorkflow = useCallback(
    async (workflow: Workflow) => {
      setLoading(true);
      setError(null);

      try {
        const updatedWorkflow = await workflowService.updateWorkflow(workflow.id, workflow);

        setWorkflows((prev) => prev.map((w) => (w.id === workflow.id ? updatedWorkflow : w)));

        if (currentWorkflow?.id === workflow.id) {
          setCurrentWorkflow(updatedWorkflow);
        }

        return updatedWorkflow;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to save workflow'));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentWorkflow]
  );

  // Delete a workflow
  const deleteWorkflow = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      try {
        await workflowService.deleteWorkflow(id);

        setWorkflows((prev) => prev.filter((w) => w.id !== id));

        if (currentWorkflow?.id === id) {
          setCurrentWorkflow(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to delete workflow'));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentWorkflow]
  );

  // Execute a workflow
  const executeWorkflow = useCallback(async (workflowId: string, input?: Record<string, any>) => {
    setLoading(true);
    setError(null);

    try {
      const execution = await workflowService.executeWorkflow(workflowId, input);
      setExecutions((prev) => [...prev, execution]);
      return execution;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to execute workflow'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load executions
  const loadExecutions = useCallback(async (workflowId?: string) => {
    setLoading(true);
    setError(null);

    try {
      const fetchedExecutions = await workflowService.getExecutions(workflowId);
      setExecutions(fetchedExecutions);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load executions'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Get workflow by ID
  const getWorkflow = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const workflow = await workflowService.getWorkflow(id);
      setCurrentWorkflow(workflow);
      return workflow;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get workflow'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch templates
  const getTemplates = useCallback(async (): Promise<WorkflowTemplate[]> => {
    setLoading(true);
    setError(null);

    try {
      const templates = await workflowService.getTemplates();
      return templates;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch templates'));
      // Fallback to empty array instead of throwing to prevent UI crash
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Create from template
  const createFromTemplate = useCallback(
    async (templateId: string, name: string, description?: string) => {
      setLoading(true);
      setError(null);

      try {
        const newWorkflow = await workflowService.createFromTemplate(templateId, name, description);
        setWorkflows((prev) => [...prev, newWorkflow]);
        setCurrentWorkflow(newWorkflow);
        return newWorkflow;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to create workflow from template'));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const publishWorkflow = useCallback(
    async (workflowId: string) => {
      setLoading(true);
      setError(null);

      try {
        const updatedWorkflow = await workflowService.publishWorkflow(workflowId);
        setWorkflows((prev) =>
          prev.map((workflow) => (workflow.id === workflowId ? updatedWorkflow : workflow))
        );
        if (currentWorkflow?.id === workflowId) {
          setCurrentWorkflow(updatedWorkflow);
        }
        return updatedWorkflow;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to publish workflow'));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentWorkflow]
  );

  // Execute a workflow via webhook endpoint
  const executeWorkflowViaWebhook = useCallback(
    async (
      workflowId: string,
      payload: Record<string, any>,
      options?: { triggerId?: string; secret?: string; source?: string }
    ) => {
      setLoading(true);
      setError(null);
      try {
        const result = await workflowService.executeWorkflowViaWebhook(workflowId, payload, options);
        // Refresh executions list so the UI reflects webhook-triggered runs.
        const fetchedExecutions = await workflowService.getExecutions(workflowId);
        setExecutions(fetchedExecutions);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to execute webhook workflow'));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    workflows,
    currentWorkflow,
    executions,
    loading,
    error,
    setCurrentWorkflow,
    createWorkflow,
    loadWorkflows,
    saveWorkflow,
    deleteWorkflow,
    executeWorkflow,
    loadExecutions,
    getWorkflow,
    getTemplates,
    createFromTemplate,
    publishWorkflow,
    executeWorkflowViaWebhook,
  };
};

export default useWorkflow;
