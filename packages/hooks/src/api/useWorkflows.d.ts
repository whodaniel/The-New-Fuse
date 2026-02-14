import {
  Workflow,
  WorkflowCreateData,
  WorkflowExecution,
  WorkflowService,
  WorkflowUpdateData,
} from '../mocks/api-client';
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
  ) => Promise<{
    executions: WorkflowExecution[];
    total: number;
  }>;
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
export declare function useWorkflows(options: UseWorkflowsOptions): UseWorkflowsResult;
//# sourceMappingURL=useWorkflows.d.ts.map
