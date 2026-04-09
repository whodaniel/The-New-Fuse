// @ts-nocheck
/**
 * Agent Service - Production ready service for agent management
 * Dynamically fetches both active agent instances and system-defined agent templates.
 */

export interface Agent {
  id: string;
  name: string;
  type: string;
  description?: string;
  capabilities: string[];
  status: 'active' | 'inactive' | 'error' | 'standby';
  version: string;
  model?: string;
  provider?: string;
  configuration: Record<string, any>;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentTemplate {
  id: string;
  name: string;
  bank: 'tnf' | 'claude';
  filename: string;
  size: number;
  lastModified: Date;
  description?: string;
  category?: string;
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

export interface SwarmCapabilityStatus {
  available: Record<string, boolean>;
  unavailable: Record<string, boolean>;
  reason?: string;
}

export interface LocalAICapabilityStatus {
  enabled: boolean;
  reason?: string;
  endpoints?: Record<string, boolean>;
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

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Check for HTML response (fallback from Vite/Proxy issues)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error('Received HTML instead of JSON (likely 404/Proxy error)');
      }

      if (!response.ok) {
        throw new Error(`Agent API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('API request to %s failed. Error:', url, error);
      throw error;
    }
  }

  /**
   * Get all agents (merges instances and system templates)
   */
  async getAgents(): Promise<Agent[]> {
    try {
      // Fetch active instances and templates in parallel
      const [instancesResponse, templatesResponse] = await Promise.allSettled([
        this.request<any[]>('/agents'),
        this.request<AgentTemplate[]>('/agents/bank/templates'),
      ]);

      const instances = instancesResponse.status === 'fulfilled' ? instancesResponse.value : [];
      const templates = templatesResponse.status === 'fulfilled' ? templatesResponse.value : [];

      // Transform instances
      const activeAgents = instances.map((a) => this.transformAgent(a));

      // Transform templates into "Standby" agents
      const systemAgents = templates.map((t) => this.transformTemplateToAgent(t));

      // Merge and remove duplicates by name (prefer instances if they exist)
      const merged = [...activeAgents];
      for (const sa of systemAgents) {
        if (!merged.find((ma) => ma.name === sa.name)) {
          merged.push(sa);
        }
      }

      return merged;
    } catch (error) {
      console.error('Failed to get agents', error);
      return [];
    }
  }

  async getAgentTemplates(): Promise<AgentTemplate[]> {
    try {
      return await this.request<AgentTemplate[]>('/agents/bank/templates');
    } catch (error) {
      return [];
    }
  }

  async getAgent(id: string): Promise<Agent> {
    try {
      // If it looks like a template ID (contains a colon), handle differently or let backend handle
      const agent = await this.request<any>(`/agents/${id}`);
      return this.transformAgent(agent);
    } catch (error) {
      // Fallback: try to find in templates if not in instances
      const templates = await this.getAgentTemplates();
      const template = templates.find((t) => t.id === id);
      if (template) return this.transformTemplateToAgent(template);
      throw error;
    }
  }

  async createAgent(agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>): Promise<Agent> {
    const created = await this.request<any>('/agents', {
      method: 'POST',
      body: JSON.stringify(agent),
    });
    return this.transformAgent(created);
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
    const updated = await this.request<any>(`/agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return this.transformAgent(updated);
  }

  async deleteAgent(id: string): Promise<void> {
    await this.request(`/agents/${id}`, {
      method: 'DELETE',
    });
  }

  // Agent Lifecycle
  async startAgent(id: string): Promise<Agent> {
    const agent = await this.request<any>(`/agents/${id}/start`, {
      method: 'POST',
    });
    return this.transformAgent(agent);
  }

  async stopAgent(id: string): Promise<Agent> {
    const agent = await this.request<any>(`/agents/${id}/stop`, {
      method: 'POST',
    });
    return this.transformAgent(agent);
  }

  // Agent execution
  async executeAgent(
    agentId: string,
    task: string,
    parameters?: Record<string, any>
  ): Promise<AgentExecution> {
    const execution = await this.request<any>('/agents/execute', {
      method: 'POST',
      body: JSON.stringify({
        agentId,
        task,
        parameters,
      }),
    });
    return this.transformExecution(execution);
  }

  async getExecution(executionId: string): Promise<AgentExecution> {
    const execution = await this.request<any>(`/agents/executions/${executionId}`);
    return this.transformExecution(execution);
  }

  async getExecutions(agentId?: string): Promise<AgentExecution[]> {
    const endpoint = agentId ? `/agents/${agentId}/executions` : '/agents/executions';
    const executions = await this.request<any[]>(endpoint);
    return executions.map(this.transformExecution);
  }

  // Agent capabilities
  async getCapabilities(): Promise<AgentCapability[]> {
    return await this.request<AgentCapability[]>('/agents/capabilities');
  }

  async getAgentCapabilities(agentId: string): Promise<AgentCapability[]> {
    return await this.request<AgentCapability[]>(`/agents/${agentId}/capabilities`);
  }

  // Agent health and status
  async getAgentStatus(agentId: string): Promise<{ status: string; health: any }> {
    return await this.request<{ status: string; health: any }>(`/agents/${agentId}/status`);
  }

  async pingAgent(agentId: string): Promise<boolean> {
    try {
      await this.request(`/agents/${agentId}/ping`);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Agent configuration
  async getAgentConfig(agentId: string): Promise<Record<string, any>> {
    return await this.request<Record<string, any>>(`/agents/${agentId}/config`);
  }

  async updateAgentConfig(
    agentId: string,
    config: Record<string, any>
  ): Promise<Record<string, any>> {
    return await this.request<Record<string, any>>(`/agents/${agentId}/config`, {
      method: 'PATCH',
      body: JSON.stringify(config),
    });
  }

  /**
   * Get human-in-the-loop connection options
   */
  getHumanConnectionOptions() {
    return [
      {
        name: 'Telegram Bot',
        url: 'https://t.me/thenewfuse_bot',
        icon: 'Send',
        description: 'Direct status updates and approvals via Telegram.',
      },
      {
        name: 'Discord (W3MARKETING)',
        url: 'https://discord.gg/4GUHgFYr6',
        icon: 'MessageSquare',
        description: 'Collaborate with the swarm in the community DAO.',
      },
      {
        name: 'Discord (BizSynth)',
        url: 'https://discord.gg/hWt48aBE2',
        icon: 'MessageSquare',
        description: 'Business and specialized agent coordination.',
      },
    ];
  }

  /**
   * Get real-time swarm activity from the autonomous system
   */
  async getSwarmActivity() {
    try {
      const response = await this.request<any>('/autonomous/swarm/logs');
      if (!response.success || !Array.isArray(response.data)) return [];

      return response.data.map((log: any, index: number) => ({
        id: `${log.timestamp || 'no-ts'}:${log.eventType || 'event'}:${index}`,
        type: this.mapLogTypeToActivity(log.eventType),
        title: log.content || 'System Event',
        agent: log.metadata?.source || log.metadata?.actor || 'System',
        timestamp: new Date(log.timestamp),
        status: String(log.eventType || '').includes('completed') ? 'completed' : 'active',
      }));
    } catch (error) {
      console.error('Failed to fetch real swarm activity:', error);
      return [];
    }
  }

  async getSwarmCapabilityStatus(): Promise<SwarmCapabilityStatus | null> {
    try {
      return await this.request<SwarmCapabilityStatus>('/swarm/status');
    } catch (error) {
      console.error('Failed to fetch swarm capability status:', error);
      return null;
    }
  }

  async getLocalAICapabilityStatus(): Promise<LocalAICapabilityStatus | null> {
    try {
      return await this.request<LocalAICapabilityStatus>('/local-ai/status');
    } catch (error) {
      console.error('Failed to fetch local AI capability status:', error);
      return null;
    }
  }

  private mapLogTypeToActivity(eventType: string): 'auction' | 'scan' | 'award' {
    const type = String(eventType || '').toLowerCase();
    if (type.includes('auction') || type.includes('bidding')) return 'auction';
    if (type.includes('award') || type.includes('contract')) return 'award';
    return 'scan';
  }

  // Transform API responses to frontend types
  private transformAgent(apiAgent: any): Agent {
    return {
      ...apiAgent,
      createdAt: new Date(apiAgent.createdAt),
      updatedAt: new Date(apiAgent.updatedAt),
    };
  }

  private transformTemplateToAgent(template: AgentTemplate): Agent {
    return {
      id: template.id,
      name: template.name,
      type: template.category || 'System',
      description: template.description || 'System-defined agent persona.',
      capabilities: [], // We could parse these from markdown in the future
      status: 'standby',
      version: '1.0.0',
      configuration: {},
      metadata: {},
      createdAt: template.lastModified,
      updatedAt: template.lastModified,
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
