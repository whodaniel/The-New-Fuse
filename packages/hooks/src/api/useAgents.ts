import { useState, useEffect, useCallback } from 'react';
// Import from our mocks instead of the actual package
import { AgentService, Agent, AgentCreateData, AgentUpdateData } from '../mocks/api-client.js';

/**
 * Agents hook result
 */
export interface UseAgentsResult {
  /**
   * List of agents
   */
  agents: Agent[];
  /**
   * Total number of agents
   */
  total: number;
  /**
   * Whether agents are being loaded
   */
  isLoading: boolean;
  /**
   * Agents error
   */
  error: Error | null;
  /**
   * Current page
   */
  page: number;
  /**
   * Number of agents per page
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
   * Refresh agents function
   */
  refresh: () => Promise<void>;
  /**
   * Get agent by ID function
   */
  getAgent: (id: string) => Promise<Agent>;
  /**
   * Create agent function
   */
  createAgent: (data: AgentCreateData) => Promise<Agent>;
  /**
   * Update agent function
   */
  updateAgent: (id: string, data: AgentUpdateData) => Promise<Agent>;
  /**
   * Delete agent function
   */
  deleteAgent: (id: string) => Promise<void>;
}

/**
 * Agents hook options
 */
export interface UseAgentsOptions {
  /**
   * Agent service
   */
  agentService: AgentService;
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
   * Whether to fetch agents on mount
   * @default true
   */
  fetchOnMount?: boolean;
}

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
export function useAgents(options: UseAgentsOptions): UseAgentsResult {
  const { agentService, initialPage = 1, initialLimit = 10, fetchOnMount = true } = options;
  
  const [agents, setAgents] = useState<Agent[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState<number>(initialPage);
  const [limit, setLimit] = useState<number>(initialLimit);
  
  const fetchAgents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await agentService.getAgents(page, limit);
      
      setAgents(response.agents);
      setTotal(response.total);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [agentService, page, limit]);
  
  const getAgent = useCallback(async (id: string) => {
    try {
      return await agentService.getAgent(id);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [agentService]);
  
  const createAgent = useCallback(async (data: AgentCreateData) => {
    try {
      const agent = await agentService.createAgent(data);
      
      // Refresh agents list
      fetchAgents();
      
      return agent;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [agentService, fetchAgents]);
  
  const updateAgent = useCallback(async (id: string, data: AgentUpdateData) => {
    try {
      const agent = await agentService.updateAgent(id, data);
      
      // Update agent in list
      setAgents((prevAgents) =>
        prevAgents.map((a) => (a.id === id ? agent : a))
      );
      
      return agent;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [agentService]);
  
  const deleteAgent = useCallback(async (id: string) => {
    try {
      await agentService.deleteAgent(id);
      
      // Remove agent from list
      setAgents((prevAgents) => prevAgents.filter((a) => a.id !== id));
      setTotal((prevTotal) => prevTotal - 1);
    } catch (err) {
      setError(err as Error);
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
