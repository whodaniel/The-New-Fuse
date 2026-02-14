import { Agent, AgentCreateData, AgentService, AgentUpdateData } from '../mocks/api-client';
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
export declare function useAgents(options: UseAgentsOptions): UseAgentsResult;
//# sourceMappingURL=useAgents.d.ts.map
