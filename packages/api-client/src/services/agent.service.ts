import { ApiClient } from '../client/ApiClient.js';

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
export enum AgentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  ERROR = 'ERROR'
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
export class AgentService {
  private api: ApiClient;

  /**
   * Create a new agent service
   * @param api API client instance
   */
  constructor(api: ApiClient) {
    this.api = api;
  }

  /**
   * Get all agents
   * @returns Promise with agents list
   */
  async getAgents(): Promise<Agent[]> {
    return this.api.get<Agent[]>('/agents');
  }

  /**
   * Get agent by ID
   * @param id Agent ID
   * @returns Promise with agent data
   */
  async getAgentById(id: string): Promise<Agent> {
    return this.api.get<Agent>(`/agents/${id}`);
  }

  /**
   * Create a new agent
   * @param data Agent data
   * @returns Promise with created agent data
   */
  async createAgent(data: AgentCreateData): Promise<Agent> {
    return this.api.post<Agent>('/agents', data);
  }

  /**
   * Update agent
   * @param id Agent ID
   * @param data Agent data to update
   * @returns Promise with updated agent data
   */
  async updateAgent(id: string, data: AgentUpdateData): Promise<Agent> {
    return this.api.put<Agent>(`/agents/${id}`, data);
  }

  /**
   * Delete agent
   * @param id Agent ID
   * @returns Promise with deletion response
   */
  async deleteAgent(id: string): Promise<{ success: boolean; message: string }> {
    return this.api.delete<{ success: boolean; message: string }>(`/agents/${id}`);
  }

  /**
   * Get agents by capability
   * @param capability Agent capability name
   * @returns Promise with agents list
   */
  async getAgentsByCapability(capability: string): Promise<Agent[]> {
    return this.api.get<Agent[]>(`/agents/capability/${capability}`);
  }

  /**
   * Execute agent action
   * @param id Agent ID
   * @param action Action to execute
   * @param params Action parameters
   * @returns Promise with execution response
   */
  async executeAction(id: string, action: string, params: Record<string, any> = {}): Promise<AgentExecutionResult> {
    return this.api.post<AgentExecutionResult>(`/agents/${id}/execute`, { action, params });
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
export function createAgentService(api: ApiClient): AgentService {
  return new AgentService(api);
}
