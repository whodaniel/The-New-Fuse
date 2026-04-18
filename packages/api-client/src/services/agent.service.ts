import { ApiClient } from '../client/ApiClient.js';
import { BaseService } from './BaseService.js';

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
export class AgentService extends BaseService {
  /**
   * Create a new agent service
   * @param api API client instance
   */
  constructor(api: ApiClient) {
    super(api, '/agents');
  }

  /**
   * Get all agents
   * @param options Query options (page, limit, status, type, etc.)
   * @returns Promise with agents list
   */
  async getAgents(options: Record<string, any> = {}): Promise<Agent[]> {
    return this.list<Agent[]>('', options);
  }

  /**
   * Get agent by ID
   * @param id Agent ID
   * @returns Promise with agent data
   */
  async getAgentById(id: string): Promise<Agent> {
    return this.getById<Agent>(id);
  }

  /**
   * Create a new agent
   * @param data Agent data
   * @returns Promise with created agent data
   */
  async createAgent(data: AgentCreateData): Promise<Agent> {
    this.validateRequired({ name: data.name, type: data.type, capabilities: data.capabilities }, ['name', 'type', 'capabilities']);
    return this.create<Agent>(data);
  }

  /**
   * Update agent
   * @param id Agent ID
   * @param data Agent data to update
   * @returns Promise with updated agent data
   */
  async updateAgent(id: string, data: AgentUpdateData): Promise<Agent> {
    return this.updateById<Agent>(id, data);
  }

  /**
   * Delete agent
   * @param id Agent ID
   * @returns Promise with deletion response
   */
  async deleteAgent(id: string): Promise<{ success: boolean; message: string }> {
    return this.deleteById<{ success: boolean; message: string }>(id);
  }

  /**
   * Get agents by capability
   * @param capability Agent capability name
   * @param options Query options (page, limit, etc.)
   * @returns Promise with agents list
   */
  async getAgentsByCapability(capability: string, options: Record<string, any> = {}): Promise<Agent[]> {
    this.validateRequired({ capability }, ['capability']);
    const queryString = this.buildQueryString(options);
    return this.get<Agent[]>(`/capability/${capability}${queryString}`);
  }

  /**
   * Execute agent action
   * @param id Agent ID
   * @param action Action to execute
   * @param params Action parameters
   * @returns Promise with execution response
   */
  async executeAction(id: string, action: string, params: Record<string, any> = {}): Promise<AgentExecutionResult> {
    this.validateRequired({ id, action }, ['id', 'action']);
    return this.post<AgentExecutionResult>(`/${id}/execute`, { action, params });
  }

  /**
   * Get agent execution history
   * @param id Agent ID
   * @param options Query options (page, limit, status, etc.)
   * @returns Promise with execution history
   */
  async getExecutionHistory(id: string, options: Record<string, any> = {}): Promise<AgentExecutionResult[]> {
    this.validateRequired({ id }, ['id']);
    const queryString = this.buildQueryString(options);
    return this.get<AgentExecutionResult[]>(`/${id}/executions${queryString}`);
  }

  /**
   * Update agent status
   * @param id Agent ID
   * @param status New status
   * @returns Promise with updated agent data
   */
  async updateStatus(id: string, status: AgentStatus): Promise<Agent> {
    this.validateRequired({ id, status }, ['id', 'status']);
    return this.patch<Agent>(`/${id}`, { status });
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
