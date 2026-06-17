/**
 * API Service - HTTP client for backend communication
 */
import type {
  Agent,
  AnalyticsExportPayload,
  AnalyticsOverview,
  AnalyticsPerformancePoint,
  ApiResponse,
  ChatSession,
  DashboardStats,
  MCPServer,
  Workflow,
} from '../types';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function friendlyApiError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (
    /load failed|failed to fetch|networkerror|network request failed|connection refused|econnrefused/i.test(
      msg
    )
  ) {
    return 'REST API offline — start the TNF API on port 3001 or check Settings → environment.';
  }
  return msg || 'Unknown error';
}

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

  clearToken() {
    this.token = null;
  }

  /**
   * Only attach the bearer token when the request targets the configured API
   * origin. This prevents the Supabase access token from leaking to a different
   * host if an absolute, cross-origin endpoint is ever passed in.
   */
  private shouldAttachToken(targetUrl: string): boolean {
    try {
      const target = new URL(targetUrl, this.baseUrl);
      const base = new URL(this.baseUrl);
      return target.origin === base.origin;
    } catch {
      // Relative endpoints resolve against baseUrl → same origin.
      return true;
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const targetUrl = `${this.baseUrl}${endpoint}`;
      const attachToken = Boolean(this.token) && this.shouldAttachToken(targetUrl);
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(attachToken ? { Authorization: `Bearer ${this.token}` } : {}),
        ...options.headers,
      };

      const response = await fetch(targetUrl, {
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
        error: friendlyApiError(error),
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
  private async workflowRequest<T>(
    subpath: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const bases = ['/workflows', '/api/workflows'];
    let lastError = 'Workflow endpoint unavailable';

    for (const base of bases) {
      const result = await this.request<T>(`${base}${subpath}`, options);
      if (result.success) {
        return result;
      }
      lastError = result.error || lastError;
    }

    return { success: false, error: lastError };
  }

  async getWorkflows(): Promise<ApiResponse<Workflow[]>> {
    return this.workflowRequest<Workflow[]>('');
  }

  async getWorkflow(id: string): Promise<ApiResponse<Workflow>> {
    return this.workflowRequest<Workflow>(`/${id}`);
  }

  async createWorkflow(workflow: Partial<Workflow>): Promise<ApiResponse<Workflow>> {
    return this.workflowRequest<Workflow>('', {
      method: 'POST',
      body: JSON.stringify(workflow),
    });
  }

  async updateWorkflow(id: string, workflow: Partial<Workflow>): Promise<ApiResponse<Workflow>> {
    return this.workflowRequest<Workflow>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(workflow),
    });
  }

  async saveWorkflowCanvas(payload: {
    id?: string;
    name: string;
    nodes: unknown[];
    edges: unknown[];
  }): Promise<ApiResponse<{ id: string }>> {
    const body = {
      name: payload.name,
      description: 'Canvas workflow from TNF Desktop',
      definition: {
        nodes: payload.nodes,
        edges: payload.edges,
        client: 'tauri-desktop',
      },
    };

    if (payload.id) {
      const updated = await this.workflowRequest<{ id: string }>(`/${payload.id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      return updated.success ? { success: true, data: { id: payload.id } } : updated;
    }

    const created = await this.workflowRequest<{ id: string }>('', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return created;
  }

  async executeWorkflow(
    id: string
  ): Promise<ApiResponse<{ executionId: string; status?: string }>> {
    return this.workflowRequest<{ executionId: string; status?: string }>(`/${id}/execute`, {
      method: 'POST',
      body: JSON.stringify({}),
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

  private async analyticsRequest<T>(subpath: string, timeframe?: string): Promise<ApiResponse<T>> {
    const query = timeframe ? `?timeframe=${encodeURIComponent(timeframe)}` : '';
    const bases = ['/analytics/default', '/api/analytics/default'];
    let lastError = 'Analytics endpoint unavailable';

    for (const base of bases) {
      const result = await this.request<T>(`${base}${subpath}${query}`);
      if (result.success) {
        return result;
      }
      lastError = result.error || lastError;
    }

    return { success: false, error: lastError };
  }

  async getAnalyticsOverview(timeframe?: string): Promise<ApiResponse<AnalyticsOverview>> {
    return this.analyticsRequest<AnalyticsOverview>('/overview', timeframe);
  }

  async getAnalyticsPerformance(
    timeframe?: string
  ): Promise<ApiResponse<{ timeRange: string; dataPoints: AnalyticsPerformancePoint[] }>> {
    return this.analyticsRequest<{ timeRange: string; dataPoints: AnalyticsPerformancePoint[] }>(
      '/performance',
      timeframe
    );
  }

  async getAnalyticsProviders(timeframe?: string): Promise<
    ApiResponse<
      Array<{
        provider: string;
        totalRequests: number;
        successRate: number;
        avgLatency: number;
        costPerRequest: number;
      }>
    >
  > {
    return this.analyticsRequest('/providers/performance', timeframe);
  }

  async exportAnalytics(timeframe?: string): Promise<ApiResponse<AnalyticsExportPayload>> {
    return this.analyticsRequest<AnalyticsExportPayload>('/export', timeframe);
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
      const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}/api/agents`, {
        signal: AbortSignal.timeout(2500),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const apiService = new ApiService();
export default apiService;
