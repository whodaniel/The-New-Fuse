import { BaseService } from './BaseService';
/**
 * Agent service for managing agents
 */
export class AgentService extends BaseService {
    /**
     * Create a new agent service
     * @param apiClient API client
     */
    constructor(apiClient) {
        super(apiClient, '/agents');
    }
    /**
     * Get all agents
     * @param page Page number
     * @param limit Number of agents per page
     * @returns Promise resolving to the agents data
     */
    async getAgents(page = 1, limit = 10) {
        return this.apiClient.get(this.getPath(), { params: { page, limit } });
    }
    /**
     * Get an agent by ID
     * @param id Agent ID
     * @returns Promise resolving to the agent data
     */
    async getAgent(id) {
        return this.apiClient.get(this.getPath(`/${id}));
  }

  /**
   * Create a new agent
   * @param data Agent creation data
   * @returns Promise resolving to the created agent data
   */
  async createAgent(data: AgentCreateData): Promise<Agent> {
    return this.apiClient.post<Agent>(this.getPath(), data);
  }

  /**
   * Update an agent
   * @param id Agent ID
   * @param data Agent update data
   * @returns Promise resolving to the updated agent data
   */
  async updateAgent(id: string, data: AgentUpdateData): Promise<Agent> {`));
        return this.apiClient.patch(this.getPath(`/${id}`), data);
    }
    /**
     * Delete an agent
     * @param id Agent ID
     * @returns Promise resolving when the agent is deleted
     */
    async deleteAgent(id) {
        await this.apiClient.delete(this.getPath(/${id}));
    }
    /**
     * Get agent capabilities
     * @param id Agent ID
     * @returns Promise resolving to the agent capabilities
     */
    async getAgentCapabilities(id) {
        const response = await this.apiClient.get(`
      this.getPath(/${id}` / capabilities);
        ;
        return response.capabilities;
    }
    /**
     * Update agent capabilities
     * @param id Agent ID
     * @param capabilities Agent capabilities
     * @returns Promise resolving to the updated agent capabilities
     */
    async updateAgentCapabilities(id, capabilities) {
        const response = await this.apiClient.put(this.getPath(/${id}/capabilities `),
      { capabilities }
    );
    return response.capabilities;
  }
}
        ));
    }
}
//# sourceMappingURL=AgentService.js.map