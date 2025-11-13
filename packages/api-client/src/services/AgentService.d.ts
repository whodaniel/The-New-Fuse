import { BaseService } from './BaseService';
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
export declare class AgentService extends BaseService {
    /**
     * Create a new agent service
     * @param apiClient API client
     */
    constructor(apiClient: any);
    /**
     * Get all agents
     * @param page Page number
     * @param limit Number of agents per page
     * @returns Promise resolving to the agents data
     */
    getAgents(page?: number, limit?: number): Promise<{
        agents: Agent[];
        total: number;
    }>;
    /**
     * Get an agent by ID
     * @param id Agent ID
     * @returns Promise resolving to the agent data
     */
    getAgent(id: string): Promise<Agent>;
    /**
     * Delete an agent
     * @param id Agent ID
     * @returns Promise resolving when the agent is deleted
     */
    deleteAgent(id: string): Promise<void>;
    /**
     * Get agent capabilities
     * @param id Agent ID
     * @returns Promise resolving to the agent capabilities
     */
    getAgentCapabilities(id: string): Promise<string[]>;
    /**
     * Update agent capabilities
     * @param id Agent ID
     * @param capabilities Agent capabilities
     * @returns Promise resolving to the updated agent capabilities
     */
    updateAgentCapabilities(id: string, capabilities: string[]): Promise<string[]>;
}
//# sourceMappingURL=AgentService.d.ts.map