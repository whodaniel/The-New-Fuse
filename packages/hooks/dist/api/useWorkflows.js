import { useState, useEffect, useCallback } from 'react';
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
export function useWorkflows(options) {
    const { workflowService, initialPage = 1, initialLimit = 10, fetchOnMount = true } = options;
    const [workflows, setWorkflows] = useState([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(initialPage);
    const [limit, setLimit] = useState(initialLimit);
    const fetchWorkflows = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await workflowService.getWorkflows(page, limit);
            setWorkflows(response.workflows);
            setTotal(response.total);
        }
        catch (err) {
            setError(err);
        }
        finally {
            setIsLoading(false);
        }
    }, [workflowService, page, limit]);
    const getWorkflow = useCallback(async (id) => {
        try {
            return await workflowService.getWorkflow(id);
        }
        catch (err) {
            setError(err);
            throw err;
        }
    }, [workflowService]);
    const createWorkflow = useCallback(async (data) => {
        try {
            const workflow = await workflowService.createWorkflow(data);
            // Refresh workflows list
            fetchWorkflows();
            return workflow;
        }
        catch (err) {
            setError(err);
            throw err;
        }
    }, [workflowService, fetchWorkflows]);
    const updateWorkflow = useCallback(async (id, data) => {
        try {
            const workflow = await workflowService.updateWorkflow(id, data);
            // Update workflow in list
            setWorkflows((prevWorkflows) => prevWorkflows.map((w) => (w.id === id ? workflow : w)));
            return workflow;
        }
        catch (err) {
            setError(err);
            throw err;
        }
    }, [workflowService]);
    const deleteWorkflow = useCallback(async (id) => {
        try {
            await workflowService.deleteWorkflow(id);
            // Remove workflow from list
            setWorkflows((prevWorkflows) => prevWorkflows.filter((w) => w.id !== id));
            setTotal((prevTotal) => prevTotal - 1);
        }
        catch (err) {
            setError(err);
            throw err;
        }
    }, [workflowService]);
    const executeWorkflow = useCallback(async (id, input) => {
        try {
            return await workflowService.executeWorkflow(id, input);
        }
        catch (err) {
            setError(err);
            throw err;
        }
    }, [workflowService]);
    const getWorkflowExecutions = useCallback(async (id, execPage = 1, execLimit = 10) => {
        try {
            return await workflowService.getWorkflowExecutions(id, execPage, execLimit);
        }
        catch (err) {
            setError(err);
            throw err;
        }
    }, [workflowService]);
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
//# sourceMappingURL=useWorkflows.js.map