import { useState, useEffect, useCallback } from 'react';
/**
 * Hook for working with agents
 * @param options Agents hook options
 * @returns Agents hook result
 *
 * @example
 * // Create agent service
 * const agentService = new AgentService(apiClient);
 *
 * // Use agents hook
 * const { agents, isLoading, createAgent, updateAgent, deleteAgent } = useAgents({ agentService });
 *
 * // Create agent
 * const handleCreateAgent = async (data) => {
 *   try {
 *     const agent = await createAgent(data);
 *     // Handle success
 *   } catch (error) {
 *     // Handle error
 *   }
 * };
 */
export function useAgents(options) {
    const { agentService, initialPage = 1, initialLimit = 10, fetchOnMount = true } = options;
    const [agents, setAgents] = useState([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(initialPage);
    const [limit, setLimit] = useState(initialLimit);
    const fetchAgents = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await agentService.getAgents(page, limit);
            setAgents(response.agents);
            setTotal(response.total);
        }
        catch (err) {
            setError(err);
        }
        finally {
            setIsLoading(false);
        }
    }, [agentService, page, limit]);
    const getAgent = useCallback(async (id) => {
        try {
            return await agentService.getAgent(id);
        }
        catch (err) {
            setError(err);
            throw err;
        }
    }, [agentService]);
    const createAgent = useCallback(async (data) => {
        try {
            const agent = await agentService.createAgent(data);
            // Refresh agents list
            fetchAgents();
            return agent;
        }
        catch (err) {
            setError(err);
            throw err;
        }
    }, [agentService, fetchAgents]);
    const updateAgent = useCallback(async (id, data) => {
        try {
            const agent = await agentService.updateAgent(id, data);
            // Update agent in list
            setAgents((prevAgents) => prevAgents.map((a) => (a.id === id ? agent : a)));
            return agent;
        }
        catch (err) {
            setError(err);
            throw err;
        }
    }, [agentService]);
    const deleteAgent = useCallback(async (id) => {
        try {
            await agentService.deleteAgent(id);
            // Remove agent from list
            setAgents((prevAgents) => prevAgents.filter((a) => a.id !== id));
            setTotal((prevTotal) => prevTotal - 1);
        }
        catch (err) {
            setError(err);
            throw err;
        }
    }, [agentService]);
    useEffect(() => {
        if (fetchOnMount) {
            fetchAgents();
        }
    }, [fetchOnMount, fetchAgents]);
    return {
        agents,
        total,
        isLoading,
        error,
        page,
        limit,
        setPage,
        setLimit,
        refresh: fetchAgents,
        getAgent,
        createAgent,
        updateAgent,
        deleteAgent,
    };
}
//# sourceMappingURL=useAgents.js.map