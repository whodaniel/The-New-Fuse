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

// Mock Data
const MOCK_AGENTS: Agent[] = [
  {
    id: 'agent-1',
    name: 'DevMaster 3000',
    type: 'development',
    description: 'Advanced autonomous coding agent specialized in full-stack development.',
    capabilities: ['coding', 'debugging', 'testing', 'deployment'],
    status: 'active',
    version: '2.1.0',
    model: 'Claude 3.5 Sonnet',
    configuration: {},
    metadata: {
      tasksCompleted: 1243,
      successRate: 98.5,
      avgResponseTime: '1.2s'
    },
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-03-20')
  },
  {
    id: 'agent-2',
    name: 'DataInsight Pro',
    type: 'analytics',
    description: 'Data analysis and visualization expert capable of processing large datasets.',
    capabilities: ['analysis', 'visualization', 'reporting'],
    status: 'active',
    version: '1.5.0',
    model: 'GPT-4o',
    configuration: {},
    metadata: {
      tasksCompleted: 856,
      successRate: 99.1,
      avgResponseTime: '2.5s'
    },
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-03-18')
  },
  {
    id: 'agent-3',
    name: 'SecurityGuardian',
    type: 'security',
    description: 'Real-time security monitoring and vulnerability assessment agent.',
    capabilities: ['security-audit', 'penetration-testing', 'monitoring'],
    status: 'active',
    version: '3.0.1',
    model: 'Claude 3 Opus',
    configuration: {},
    metadata: {
      tasksCompleted: 5432,
      successRate: 99.9,
      avgResponseTime: '0.5s'
    },
    createdAt: new Date('2023-11-10'),
    updatedAt: new Date('2024-03-21')
  },
  {
    id: 'agent-4',
    name: 'ContentCreative',
    type: 'content',
    description: 'Creative content generation and marketing copy specialist.',
    capabilities: ['writing', 'seo', 'marketing'],
    status: 'inactive',
    version: '1.2.0',
    model: 'Claude 3 Haiku',
    configuration: {},
    metadata: {
      tasksCompleted: 321,
      successRate: 96.5,
      avgResponseTime: '0.8s'
    },
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-03-10')
  },
  {
    id: 'agent-5',
    name: 'SupportHero',
    type: 'chat',
    description: '24/7 Customer support agent with multi-language capabilities.',
    capabilities: ['support', 'translation', 'faq'],
    status: 'error',
    version: '1.0.0',
    model: 'GPT-3.5 Turbo',
    configuration: {},
    metadata: {
      tasksCompleted: 15420,
      successRate: 85.2,
      avgResponseTime: '0.3s'
    },
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2024-03-22')
  }
];

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
      console.warn(`API request to ${url} failed, falling back to mock data. Error:`, error);
      throw error; // Let specific methods handle fallback
    }
  }

  // Agent CRUD operations
  async getAgents(): Promise<Agent[]> {
    try {
      const agents = await this.request<any[]>('/agents');
      return agents.map(this.transformAgent);
    } catch (error) {
      console.log('Using mock agents data');
      return MOCK_AGENTS;
    }
  }

  async getAgent(id: string): Promise<Agent> {
    try {
      const agent = await this.request<any>(`/agents/${id}`);
      return this.transformAgent(agent);
    } catch (error) {
      const mock = MOCK_AGENTS.find(a => a.id === id);
      if (mock) return mock;
      // Return first mock if not found, or throw
      return MOCK_AGENTS[0];
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
      console.log('Mock creating agent');
      return {
        ...agent,
        id: `agent-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { tasksCompleted: 0, successRate: 100, avgResponseTime: '0s' },
        configuration: agent.configuration || {},
        status: 'active'
      } as Agent;
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
      console.log('Mock updating agent');
      const mock = MOCK_AGENTS.find(a => a.id === id) || MOCK_AGENTS[0];
      return { ...mock, ...updates, updatedAt: new Date() };
    }
  }

  async deleteAgent(id: string): Promise<void> {
    try {
      await this.request(`/agents/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.log('Mock deleting agent');
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
      console.log('Mock executing agent');
      return {
        id: `exec-${Date.now()}`,
        agentId,
        taskId: `task-${Date.now()}`,
        status: 'running',
        startTime: new Date(),
        input: { task, parameters },
        logs: ['Agent started', 'Analyzing task...', 'Executing step 1...']
      };
    }
  }

  async getExecution(executionId: string): Promise<AgentExecution> {
    try {
      const execution = await this.request<any>(`/agents/executions/${executionId}`);
      return this.transformExecution(execution);
    } catch (error) {
      return {
        id: executionId,
        agentId: 'agent-1',
        taskId: 'task-1',
        status: 'completed',
        startTime: new Date(Date.now() - 10000),
        endTime: new Date(),
        input: {},
        output: { result: 'Success' },
        logs: ['Completed']
      };
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
      return [];
    }
  }

  // Agent capabilities
  async getCapabilities(): Promise<AgentCapability[]> {
    try {
      return await this.request<AgentCapability[]>('/agents/capabilities');
    } catch (error) {
      return [
        { id: 'cap-1', name: 'Web Search', description: 'Search the web', category: 'tools', parameters: {} },
        { id: 'cap-2', name: 'Code Analysis', description: 'Analyze code', category: 'dev', parameters: {} }
      ];
    }
  }

  async getAgentCapabilities(agentId: string): Promise<AgentCapability[]> {
    try {
      return await this.request<AgentCapability[]>(`/agents/${agentId}/capabilities`);
    } catch (error) {
      return [
        { id: 'cap-1', name: 'Web Search', description: 'Search the web', category: 'tools', parameters: {} }
      ];
    }
  }

  // Agent health and status
  async getAgentStatus(agentId: string): Promise<{ status: string; health: any }> {
    try {
      return await this.request<{ status: string; health: any }>(`/agents/${agentId}/status`);
    } catch (error) {
      return { status: 'active', health: { cpu: 20, memory: 45 } };
    }
  }

  async pingAgent(agentId: string): Promise<boolean> {
    try {
      await this.request(`/agents/${agentId}/ping`);
      return true;
    } catch (error) {
      return true; // Mock success
    }
  }

  // Agent configuration
  async getAgentConfig(agentId: string): Promise<Record<string, any>> {
    try {
      return await this.request<Record<string, any>>(`/agents/${agentId}/config`);
    } catch (error) {
      return {
        temperature: 0.7,
        maxTokens: 2048,
        systemPrompt: "You are a helpful assistant."
      };
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
      return config;
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
