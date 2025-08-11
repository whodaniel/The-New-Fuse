/**
 * Agent Service - Production ready service for agent management
 */

export interface Agent {
  id: string;
  name: string;
  type: string;
  description?: string;
  capabilities: string[];
  status: 'active' | 'inactive' | 'error';
  version: string;
  model?: string;
  provider?: string;
  configuration: Record<string, any>;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentExecution {
  id: string;
  agentId: string;
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  logs: string[];
}

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, any>;
  category: string;
}

class AgentService {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string = '/api', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Agent API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Agent CRUD operations
  async getAgents(): Promise<Agent[]> {
    try {
      const agents = await this.request<any[]>('/agents');
      return agents.map(this.transformAgent);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      throw error;
    }
  }

  async getAgent(id: string): Promise<Agent> {
    try {
      const agent = await this.request<any>(`/agents/${id}`);
      return this.transformAgent(agent);
    } catch (error) {
      console.error(`Failed to fetch agent ${id}:`, error);
      throw error;
    }
  }

  async createAgent(agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>): Promise<Agent> {
    try {
      const created = await this.request<any>('/agents', {
        method: 'POST',
        body: JSON.stringify(agent),
      });
      return this.transformAgent(created);
    } catch (error) {
      console.error('Failed to create agent:', error);
      throw error;
    }
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
    try {
      const updated = await this.request<any>(`/agents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      return this.transformAgent(updated);
    } catch (error) {
      console.error(`Failed to update agent ${id}:`, error);
      throw error;
    }
  }

  async deleteAgent(id: string): Promise<void> {
    try {
      await this.request(`/agents/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error(`Failed to delete agent ${id}:`, error);
      throw error;
    }
  }

  // Agent execution
  async executeAgent(
    agentId: string,
    task: string,
    parameters?: Record<string, any>
  ): Promise<AgentExecution> {
    try {
      const execution = await this.request<any>('/agents/execute', {
        method: 'POST',
        body: JSON.stringify({
          agentId,
          task,
          parameters,
        }),
      });
      return this.transformExecution(execution);
    } catch (error) {
      console.error(`Failed to execute agent ${agentId}:`, error);
      throw error;
    }
  }

  async getExecution(executionId: string): Promise<AgentExecution> {
    try {
      const execution = await this.request<any>(`/agents/executions/${executionId}`);
      return this.transformExecution(execution);
    } catch (error) {
      console.error(`Failed to fetch execution ${executionId}:`, error);
      throw error;
    }
  }

  async getExecutions(agentId?: string): Promise<AgentExecution[]> {
    try {
      const endpoint = agentId 
        ? `/agents/${agentId}/executions`
        : '/agents/executions';
      const executions = await this.request<any[]>(endpoint);
      return executions.map(this.transformExecution);
    } catch (error) {
      console.error('Failed to fetch executions:', error);
      throw error;
    }
  }

  // Agent capabilities
  async getCapabilities(): Promise<AgentCapability[]> {
    try {
      return await this.request<AgentCapability[]>('/agents/capabilities');
    } catch (error) {
      console.error('Failed to fetch agent capabilities:', error);
      throw error;
    }
  }

  async getAgentCapabilities(agentId: string): Promise<AgentCapability[]> {
    try {
      return await this.request<AgentCapability[]>(`/agents/${agentId}/capabilities`);
    } catch (error) {
      console.error(`Failed to fetch capabilities for agent ${agentId}:`, error);
      throw error;
    }
  }

  // Agent health and status
  async getAgentStatus(agentId: string): Promise<{ status: string; health: any }> {
    try {
      return await this.request<{ status: string; health: any }>(`/agents/${agentId}/status`);
    } catch (error) {
      console.error(`Failed to fetch status for agent ${agentId}:`, error);
      throw error;
    }
  }

  async pingAgent(agentId: string): Promise<boolean> {
    try {
      await this.request(`/agents/${agentId}/ping`);
      return true;
    } catch (error) {
      console.error(`Failed to ping agent ${agentId}:`, error);
      return false;
    }
  }

  // Agent configuration
  async getAgentConfig(agentId: string): Promise<Record<string, any>> {
    try {
      return await this.request<Record<string, any>>(`/agents/${agentId}/config`);
    } catch (error) {
      console.error(`Failed to fetch config for agent ${agentId}:`, error);
      throw error;
    }
  }

  async updateAgentConfig(
    agentId: string,
    config: Record<string, any>
  ): Promise<Record<string, any>> {
    try {
      return await this.request<Record<string, any>>(`/agents/${agentId}/config`, {
        method: 'PATCH',
        body: JSON.stringify(config),
      });
    } catch (error) {
      console.error(`Failed to update config for agent ${agentId}:`, error);
      throw error;
    }
  }

  // Transform API responses to frontend types
  private transformAgent(apiAgent: any): Agent {
    return {
      ...apiAgent,
      createdAt: new Date(apiAgent.createdAt),
      updatedAt: new Date(apiAgent.updatedAt),
    };
  }

  private transformExecution(apiExecution: any): AgentExecution {
    return {
      ...apiExecution,
      startTime: new Date(apiExecution.startTime),
      endTime: apiExecution.endTime ? new Date(apiExecution.endTime) : undefined,
    };
  }
}

// Export singleton instance
export const agentService = new AgentService();
export default AgentService;