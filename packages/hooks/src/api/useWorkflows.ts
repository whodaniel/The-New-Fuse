import { useState, useEffect, useCallback } from 'react';
import {
  WorkflowService,
  Workflow,
  WorkflowCreateData,
  WorkflowUpdateData,
  WorkflowExecution,
} from '../mocks/api-client.js';

/**
 * Workflows hook result
 */
export interface UseWorkflowsResult {
  /**
   * List of workflows
   */
  workflows: Workflow[];
  /**
   * Total number of workflows
   */
  total: number;
  /**
   * Whether workflows are being loaded
   */
  isLoading: boolean;
  /**
   * Workflows error
   */
  error: Error | null;
  /**
   * Current page
   */
  page: number;
  /**
   * Number of workflows per page
   */
  limit: number;
  /**
   * Set page function
   */
  setPage: (page: number) => void;
  /**
   * Set limit function
   */
  setLimit: (limit: number) => void;
  /**
   * Refresh workflows function
   */
  refresh: () => Promise<void>;
  /**
   * Get workflow by ID function
   */
  getWorkflow: (id: string) => Promise<Workflow>;
  /**
   * Create workflow function
   */
  createWorkflow: (data: WorkflowCreateData) => Promise<Workflow>;
  /**
   * Update workflow function
   */
  updateWorkflow: (id: string, data: WorkflowUpdateData) => Promise<Workflow>;
  /**
   * Delete workflow function
   */
  deleteWorkflow: (id: string) => Promise<void>;
  /**
   * Execute workflow function
   */
  executeWorkflow: (id: string, input: any) => Promise<WorkflowExecution>;
  /**
   * Get workflow executions function
   */
  getWorkflowExecutions: (
    id: string,
    page?: number,
    limit?: number
  ) => Promise<{ executions: WorkflowExecution[]; total: number }>;
}

/**
 * Workflows hook options
 */
export interface UseWorkflowsOptions {
  /**
   * Workflow service
   */
  workflowService: WorkflowService;
  /**
   * Initial page
   * @default 1
   */
  initialPage?: number;
  /**
   * Initial limit
   * @default 10
   */
  initialLimit?: number;
  /**
   * Whether to fetch workflows on mount
   * @default true
   */
  fetchOnMount?: boolean;
}

/**
 * Hook for working with workflows
 * @param options Workflows hook options
 * @returns Workflows hook result
 * 
 * @example
 * // Create workflow service
 * const workflowService = new WorkflowService(apiClient);
 * 
 * // Use workflows hook
 * const { workflows, isLoading, createWorkflow, executeWorkflow } = useWorkflows({ workflowService });
 * 
 * // Execute workflow
 * const handleExecuteWorkflow = async (id, input) => {
 *   try {
 *     const execution = await executeWorkflow(id, input);
 *     // Handle success
 *   } catch (error) {
 *     // Handle error
 *   }
 * };
 */
export function useWorkflows(options: UseWorkflowsOptions): UseWorkflowsResult {
  const { workflowService, initialPage = 1, initialLimit = 10, fetchOnMount = true } = options;
  
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState<number>(initialPage);
  const [limit, setLimit] = useState<number>(initialLimit);
  
  const fetchWorkflows = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await workflowService.getWorkflows(page, limit);
      
      setWorkflows(response.workflows);
      setTotal(response.total);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [workflowService, page, limit]);
  
  const getWorkflow = useCallback(async (id: string) => {
    try {
      return await workflowService.getWorkflow(id);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [workflowService]);
  
  const createWorkflow = useCallback(async (data: WorkflowCreateData) => {
    try {
      const workflow = await workflowService.createWorkflow(data);
      
      // Refresh workflows list
      fetchWorkflows();
      
      return workflow;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [workflowService, fetchWorkflows]);
  
  const updateWorkflow = useCallback(async (id: string, data: WorkflowUpdateData) => {
    try {
      const workflow = await workflowService.updateWorkflow(id, data);
      
      // Update workflow in list
      setWorkflows((prevWorkflows) =>
        prevWorkflows.map((w) => (w.id === id ? workflow : w))
      );
      
      return workflow;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [workflowService]);
  
  const deleteWorkflow = useCallback(async (id: string) => {
    try {
      await workflowService.deleteWorkflow(id);
      
      // Remove workflow from list
      setWorkflows((prevWorkflows) => prevWorkflows.filter((w) => w.id !== id));
      setTotal((prevTotal) => prevTotal - 1);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [workflowService]);
  
  const executeWorkflow = useCallback(async (id: string, input: any) => {
    try {
      return await workflowService.executeWorkflow(id, input);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [workflowService]);
  
  const getWorkflowExecutions = useCallback(
    async (id: string, execPage: number = 1, execLimit: number = 10) => {
      try {
        return await workflowService.getWorkflowExecutions(id, execPage, execLimit);
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [workflowService]
  );
  
  useEffect(() => {
    if (fetchOnMount) {
      fetchWorkflows();
    }
  }, [fetchOnMount, fetchWorkflows]);
  
  return {
    workflows,
    total,
    isLoading,
    error,
    page,
    limit,
    setPage,
    setLimit,
    refresh: fetchWorkflows,
    getWorkflow,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    executeWorkflow,
    getWorkflowExecutions,
  };
}
