import { BaseService } from './BaseService';
/**
 * Agent status enum
 */
export var AgentStatus;
(function (AgentStatus) {
    AgentStatus["ACTIVE"] = "ACTIVE";
    AgentStatus["INACTIVE"] = "INACTIVE";
    AgentStatus["PENDING"] = "PENDING";
    AgentStatus["ERROR"] = "ERROR";
})(AgentStatus || (AgentStatus = {}));
/**
 * Agent service for managing agents and their capabilities
 */
export class AgentService extends BaseService {
    /**
     * Create a new agent service
     * @param api API client instance
     */
    constructor(api) {
        super(api, '/agents');
    }
    /**
     * Get all agents
     * @param options Query options (page, limit, status, type, etc.)
     * @returns Promise with agents list
     */
    async getAgents(options = {}) {
        return this.list('', options);
    }
    /**
     * Get agent by ID
     * @param id Agent ID
     * @returns Promise with agent data
     */
    async getAgentById(id) {
        return this.getById(id);
    }
    /**
     * Create a new agent
     * @param data Agent data
     * @returns Promise with created agent data
     */
    async createAgent(data) {
        this.validateRequired({ name: data.name, type: data.type, capabilities: data.capabilities }, ['name', 'type', 'capabilities']);
        return this.create(data);
    }
    /**
     * Update agent
     * @param id Agent ID
     * @param data Agent data to update
     * @returns Promise with updated agent data
     */
    async updateAgent(id, data) {
        return this.updateById(id, data);
    }
    /**
     * Delete agent
     * @param id Agent ID
     * @returns Promise with deletion response
     */
    async deleteAgent(id) {
        return this.deleteById(id);
    }
    /**
     * Get agents by capability
     * @param capability Agent capability name
     * @param options Query options (page, limit, etc.)
     * @returns Promise with agents list
     */
    async getAgentsByCapability(capability, options = {}) {
        this.validateRequired({ capability }, ['capability']);
        const queryString = this.buildQueryString(options);
        return this.get(`/capability/${capability}${queryString}`);
    }
    /**
     * Execute agent action
     * @param id Agent ID
     * @param action Action to execute
     * @param params Action parameters
     * @returns Promise with execution response
     */
    async executeAction(id, action, params = {}) {
        this.validateRequired({ id, action }, ['id', 'action']);
        return this.post(`/${id}/execute`, { action, params });
    }
    /**
     * Get agent execution history
     * @param id Agent ID
     * @param options Query options (page, limit, status, etc.)
     * @returns Promise with execution history
     */
    async getExecutionHistory(id, options = {}) {
        this.validateRequired({ id }, ['id']);
        const queryString = this.buildQueryString(options);
        return this.get(`/${id}/executions${queryString}`);
    }
    /**
     * Update agent status
     * @param id Agent ID
     * @param status New status
     * @returns Promise with updated agent data
     */
    async updateStatus(id, status) {
        this.validateRequired({ id, status }, ['id', 'status']);
        return this.patch(`/${id}`, { status });
    }
}
/**
 * Create a new agent service
 * @param api API client instance
 * @returns Agent service instance
 *
 * @example
 * ```typescript
 * import {
 *   createApiClient,
 *   createAgentService,
 *   AgentCreateData,
 *   AgentCapability
 * } from '@the-new-fuse/api-client';
 *
 * // Create a new API client
 * const api = createApiClient({
 *   baseURL: 'https://api.example.com',
 * });
 *
 * // Create agent service
 * const agentService = createAgentService(api);
 *
 * // Get all agents
 * const agents = await agentService.getAgents();
 *
 * // Create a new agent
 * const capabilities: AgentCapability[] = [
 *   {
 *     name: 'chat',
 *     description: 'Chat with users',
 *     parameters: {
 *       maxTokens: 1000
 *     }
 *   },
 *   {
 *     name: 'search',
 *     description: 'Search for information'
 *   }
 * ];
 *
 * const agentData: AgentCreateData = {
 *   name: 'Assistant Agent',
 *   description: 'An AI assistant that can chat and search',
 *   type: 'assistant',
 *   capabilities: capabilities
 * };
 *
 * const agent = await agentService.createAgent(agentData);
 *
 * // Execute agent action
 * const result = await agentService.executeAction(
 *   agent.id,
 *   'chat',
 *   { message: 'Hello, agent!' }
 * );
 * ```
 */
export function createAgentService(api) {
    return new AgentService(api);
}
