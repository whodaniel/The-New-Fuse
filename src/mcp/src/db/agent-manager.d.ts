/**
 * AgentManager handles database operations for agent entities
 */
export declare class AgentManager {
    /**
     * Register a new agent
     * @param name Agent name
     * @param description Agent description
     * @param type Agent type (e.g., "assistant", "copilot")
     * @param capabilities Array of agent capabilities
     * @returns The created agent details with API key
     */
    registerAgent(name: string, description: string, type: string, capabilities?: string[]): Promise<any>;
    /**
     * Verify an agent's API key
     * @param apiKey The API key to verify
     * @returns The agent ID if valid, null otherwise
     */
    verifyApiKey(apiKey: string): Promise<string | null>;
    /**
     * Get agent details by ID
     * @param agentId The agent ID
     * @returns Agent details
     */
    getAgentById(agentId: string): Promise<any>;
    /**
     * Update agent capabilities
     * @param agentId The agent ID
     * @param capabilities New capabilities array
     */
    updateCapabilities(agentId: string, capabilities: string[]): Promise<void>;
    /**
     * Set agent state data
     * @param agentId The agent ID
     * @param key State key
     * @param value State value
     */
    setState(agentId: string, key: string, value: any): Promise<void>;
    /**
     * Get agent state data
     * @param agentId The agent ID
     * @param key State key
     * @returns State value or null if not found
     */
    getState(agentId: string, key: string): Promise<any>;
    /**
     * List all agents, optionally filtering by type or capability
     * @param type Optional type to filter by
     * @param capability Optional capability to filter by
     * @returns Array of agents
     */
    listAgents(type?: string, capability?: string): Promise<any[]>;
    /**
     * Deactivate an agent
     * @param agentId The agent ID to deactivate
     */
    deactivateAgent(agentId: string): Promise<void>;
    /**
     * Generate a secure API key
     * @returns A random API key
     */
    private generateApiKey;
}
//# sourceMappingURL=agent-manager.d.ts.map