import { ApiClient } from '../client/ApiClient';
import { BaseService } from './BaseService';
/**
 * Agent capability interface
 */
export interface AgentCapability {
    name: string;
    description: string;
    parameters?: Record<string, any>;
}
/**
 * Agent status enum
 */
export declare enum AgentStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    PENDING = "PENDING",
    ERROR = "ERROR"
}
/**
 * Agent interface
 */
export interface Agent {
    id: string;
    name: string;
    description: string;
    type: string;
    capabilities: AgentCapability[];
    status: AgentStatus;
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
}
/**
 * Agent creation data
 */
export interface AgentCreateData {
    name: string;
    description?: string;
    type: string;
    capabilities: AgentCapability[];
    metadata?: Record<string, any>;
}
/**
 * Agent update data
 */
export interface AgentUpdateData {
    name?: string;
    description?: string;
    type?: string;
    capabilities?: AgentCapability[];
    status?: AgentStatus;
    metadata?: Record<string, any>;
}
/**
 * Agent execution result
 */
export interface AgentExecutionResult {
    id: string;
    agentId: string;
    action: string;
    params: Record<string, any>;
    result: any;
    status: 'SUCCESS' | 'ERROR';
    error?: string;
    startedAt: string;
    completedAt: string;
}
/**
 * Agent service for managing agents and their capabilities
 */
export declare class AgentService extends BaseService {
    /**
     * Create a new agent service
     * @param api API client instance
     */
    constructor(api: ApiClient);
    /**
     * Get all agents
     * @param options Query options (page, limit, status, type, etc.)
     * @returns Promise with agents list
     */
    getAgents(options?: Record<string, any>): Promise<Agent[]>;
    /**
     * Get agent by ID
     * @param id Agent ID
     * @returns Promise with agent data
     */
    getAgentById(id: string): Promise<Agent>;
    /**
     * Create a new agent
     * @param data Agent data
     * @returns Promise with created agent data
     */
    createAgent(data: AgentCreateData): Promise<Agent>;
    /**
     * Update agent
     * @param id Agent ID
     * @param data Agent data to update
     * @returns Promise with updated agent data
     */
    updateAgent(id: string, data: AgentUpdateData): Promise<Agent>;
    /**
     * Delete agent
     * @param id Agent ID
     * @returns Promise with deletion response
     */
    deleteAgent(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Get agents by capability
     * @param capability Agent capability name
     * @param options Query options (page, limit, etc.)
     * @returns Promise with agents list
     */
    getAgentsByCapability(capability: string, options?: Record<string, any>): Promise<Agent[]>;
    /**
     * Get agent execution history
     * @param id Agent ID
     * @param options Query options (page, limit, status, etc.)
     * @returns Promise with execution history
     */
    getExecutionHistory(id: string, options?: Record<string, any>): Promise<AgentExecutionResult[]>;
}
/**
 * Create a new agent service
 * @param api API client instance
 * @returns Agent service instance
 *
 * @example
 * typescript
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
 * ``
 */
export declare function createAgentService(api: ApiClient): AgentService;
//# sourceMappingURL=agent.service.d.ts.map