import { BaseService } from './BaseService.js';

/**
 * Agent data
 */
export interface Agent {
  /**
   * Agent ID
   */
  id: string;
  /**
   * Agent name
   */
  name: string;
  /**
   * Agent description
   */
  description: string;
  /**
   * Agent capabilities
   */
  capabilities: string[];
  /**
   * Agent status
   */
  status: 'active' | 'inactive' | 'error';
  /**
   * Agent creation date
   */
  createdAt: string;
  /**
   * Agent update date
   */
  updatedAt: string;
  /**
   * Agent deletion date
   */
  deletedAt?: string;
}

/**
 * Agent creation data
 */
export interface AgentCreateData {
  /**
   * Agent name
   */
  name: string;
  /**
   * Agent description
   */
  description: string;
  /**
   * Agent capabilities
   */
  capabilities?: string[];
}

/**
 * Agent update data
 */
export interface AgentUpdateData {
  /**
   * Agent name
   */
  name?: string;
  /**
   * Agent description
   */
  description?: string;
  /**
   * Agent capabilities
   */
  capabilities?: string[];
  /**
   * Agent status
   */
  status?: 'active' | 'inactive';
}

/**
 * Agent service for managing agents
 */
export class AgentService extends BaseService {
  /**
   * Create a new agent service
   * @param apiClient API client
   */
  constructor(apiClient: any) {
    super(apiClient, '/agents');
  }

  /**
   * Get all agents
   * @param page Page number
   * @param limit Number of agents per page
   * @returns Promise resolving to the agents data
   */
  async getAgents(page: number = 1, limit: number = 10): Promise<{ agents: Agent[]; total: number }> {
    return this.apiClient.get<{ agents: Agent[]; total: number }>(
      this.getPath(),
      { params: { page, limit } }
    );
  }

  /**
   * Get an agent by ID
   * @param id Agent ID
   * @returns Promise resolving to the agent data
   */
  async getAgent(id: string): Promise<Agent> {
    return this.apiClient.get<Agent>(this.getPath(`/${id}`));
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
  async updateAgent(id: string, data: AgentUpdateData): Promise<Agent> {
    return this.apiClient.patch<Agent>(this.getPath(`/${id}`), data);
  }

  /**
   * Delete an agent
   * @param id Agent ID
   * @returns Promise resolving when the agent is deleted
   */
  async deleteAgent(id: string): Promise<void> {
    await this.apiClient.delete(this.getPath(`/${id}`));
  }

  /**
   * Get agent capabilities
   * @param id Agent ID
   * @returns Promise resolving to the agent capabilities
   */
  async getAgentCapabilities(id: string): Promise<string[]> {
    const response = await this.apiClient.get<{ capabilities: string[] }>(
      this.getPath(`/${id}/capabilities`)
    );
    return response.capabilities;
  }

  /**
   * Update agent capabilities
   * @param id Agent ID
   * @param capabilities Agent capabilities
   * @returns Promise resolving to the updated agent capabilities
   */
  async updateAgentCapabilities(id: string, capabilities: string[]): Promise<string[]> {
    const response = await this.apiClient.put<{ capabilities: string[] }>(
      this.getPath(`/${id}/capabilities`),
      { capabilities }
    );
    return response.capabilities;
  }
}
