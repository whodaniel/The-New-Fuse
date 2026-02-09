/**
 * MCP Service - Production ready service for Model Context Protocol integration
 */

export interface MCPServer {
  id: string;
  name: string;
  url: string;
  status: 'online' | 'offline' | 'error';
  tools: MCPTool[];
  metadata?: Record<string, any>;
}

export interface MCPTool {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, MCPParameter>;
  returns: {
    type: string;
    description: string;
  };
  serverId?: string;
}

export interface MCPParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required?: boolean;
  default?: any;
}

export interface MCPExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  executionTime?: number;
}


class MCPService {
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

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error('Received HTML instead of JSON (likely 404/Proxy error)');
      }

      if (!response.ok) {
        throw new Error(`MCP API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.warn(`MCP API request to ${url} failed, falling back to mock data. Error:`, error);
      throw error;
    }
  }

  async getServers(): Promise<MCPServer[]> {
    return this.request<MCPServer[]>('/mcp/servers');
  }

  async getServer(serverId: string): Promise<MCPServer> {
    return this.request<MCPServer>(`/mcp/servers/${serverId}`);
  }

  async getTools(serverId?: string): Promise<MCPTool[]> {
    const endpoint = serverId ? `/mcp/servers/${serverId}/tools` : '/mcp/tools';
    return this.request<MCPTool[]>(endpoint);
  }

  async getTool(toolId: string): Promise<MCPTool> {
    return this.request<MCPTool>(`/mcp/tools/${toolId}`);
  }

  async executeTool(
    toolId: string,
    parameters: Record<string, any>,
    serverId?: string
  ): Promise<MCPExecutionResult> {
    const startTime = Date.now();
    
    const result = await this.request<any>('/mcp/execute', {
      method: 'POST',
      body: JSON.stringify({
        toolId,
        parameters,
        serverId,
      }),
    });

    const executionTime = Date.now() - startTime;

    return {
      success: true,
      result,
      executionTime,
    };
  }

  async testConnection(serverId: string): Promise<boolean> {
    await this.request(`/mcp/servers/${serverId}/ping`);
    return true;
  }

  async registerServer(server: Omit<MCPServer, 'id' | 'tools'>): Promise<MCPServer> {
    return this.request<MCPServer>('/mcp/servers', {
      method: 'POST',
      body: JSON.stringify(server),
    });
  }

  async updateServer(serverId: string, updates: Partial<MCPServer>): Promise<MCPServer> {
    return this.request<MCPServer>(`/mcp/servers/${serverId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteServer(serverId: string): Promise<void> {
    await this.request(`/mcp/servers/${serverId}`, {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const mcpService = new MCPService();
export default MCPService;
