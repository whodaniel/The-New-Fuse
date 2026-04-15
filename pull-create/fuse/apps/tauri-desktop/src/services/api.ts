/**
 * API Service - HTTP client for backend communication
 */
import type {
  Agent,
  ApiResponse,
  ChatSession,
  DashboardStats,
  MCPServer,
  Workflow,
} from '../types';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiService {
  private baseUrl: string = API_BASE_URL;
  private token: string | null = null;

  constructor() {}

  setBaseUrl(url: string) {
    this.baseUrl = url;
    console.log(`🚀 API Base URL updated to: ${url}`);
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...options.headers,
      };

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Agent endpoints
  async getAgents(): Promise<ApiResponse<Agent[]>> {
    return this.request<Agent[]>('/api/agents');
  }

  async getAgent(id: string): Promise<ApiResponse<Agent>> {
    return this.request<Agent>(`/api/agents/${id}`);
  }

  async createAgent(agent: Partial<Agent>): Promise<ApiResponse<Agent>> {
    return this.request<Agent>('/api/agents', {
      method: 'POST',
      body: JSON.stringify(agent),
    });
  }

  async updateAgent(id: string, agent: Partial<Agent>): Promise<ApiResponse<Agent>> {
    return this.request<Agent>(`/api/agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(agent),
    });
  }

  async deleteAgent(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/agents/${id}`, {
      method: 'DELETE',
    });
  }

  async startAgent(id: string): Promise<ApiResponse<Agent>> {
    return this.request<Agent>(`/api/agents/${id}/start`, {
      method: 'POST',
    });
  }

  async stopAgent(id: string): Promise<ApiResponse<Agent>> {
    return this.request<Agent>(`/api/agents/${id}/stop`, {
      method: 'POST',
    });
  }

  // Workflow endpoints
  async getWorkflows(): Promise<ApiResponse<Workflow[]>> {
    return this.request<Workflow[]>('/api/workflows');
  }

  async getWorkflow(id: string): Promise<ApiResponse<Workflow>> {
    return this.request<Workflow>(`/api/workflows/${id}`);
  }

  async createWorkflow(workflow: Partial<Workflow>): Promise<ApiResponse<Workflow>> {
    return this.request<Workflow>('/api/workflows', {
      method: 'POST',
      body: JSON.stringify(workflow),
    });
  }

  async updateWorkflow(id: string, workflow: Partial<Workflow>): Promise<ApiResponse<Workflow>> {
    return this.request<Workflow>(`/api/workflows/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(workflow),
    });
  }

  async executeWorkflow(id: string): Promise<ApiResponse<{ executionId: string }>> {
    return this.request<{ executionId: string }>(`/api/workflows/${id}/execute`, {
      method: 'POST',
    });
  }

  // MCP endpoints
  async getMCPServers(): Promise<ApiResponse<MCPServer[]>> {
    return this.request<MCPServer[]>('/api/mcp/servers');
  }

  async installMCPServer(
    serverId: string,
    config?: Record<string, any>
  ): Promise<ApiResponse<MCPServer>> {
    return this.request<MCPServer>(`/api/mcp/servers/${serverId}/install`, {
      method: 'POST',
      body: JSON.stringify({ config }),
    });
  }

  async uninstallMCPServer(serverId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/mcp/servers/${serverId}/uninstall`, {
      method: 'POST',
    });
  }

  // Dashboard endpoints
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request<DashboardStats>('/api/dashboard/stats');
  }

  // Chat endpoints
  async getChatSessions(): Promise<ApiResponse<ChatSession[]>> {
    return this.request<ChatSession[]>('/api/chat/sessions');
  }

  async createChatSession(agents: string[]): Promise<ApiResponse<ChatSession>> {
    return this.request<ChatSession>('/api/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({ agents }),
    });
  }

  async sendMessage(sessionId: string, content: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const apiService = new ApiService();
export default apiService;
