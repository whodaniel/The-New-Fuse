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

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`MCP API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getServers(): Promise<MCPServer[]> {
    try {
      return await this.request<MCPServer[]>('/mcp/servers');
    } catch (error) {
      console.error('Failed to fetch MCP servers:', error);
      throw error;
    }
  }

  async getServer(serverId: string): Promise<MCPServer> {
    try {
      return await this.request<MCPServer>(`/mcp/servers/${serverId}`);
    } catch (error) {
      console.error(`Failed to fetch MCP server ${serverId}:`, error);
      throw error;
    }
  }

  async getTools(serverId?: string): Promise<MCPTool[]> {
    try {
      const endpoint = serverId ? `/mcp/servers/${serverId}/tools` : '/mcp/tools';
      return await this.request<MCPTool[]>(endpoint);
    } catch (error) {
      console.error('Failed to fetch MCP tools:', error);
      throw error;
    }
  }

  async getTool(toolId: string): Promise<MCPTool> {
    try {
      return await this.request<MCPTool>(`/mcp/tools/${toolId}`);
    } catch (error) {
      console.error(`Failed to fetch MCP tool ${toolId}:`, error);
      throw error;
    }
  }

  async executeTool(
    toolId: string,
    parameters: Record<string, any>,
    serverId?: string
  ): Promise<MCPExecutionResult> {
    try {
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
    } catch (error) {
      console.error(`Failed to execute MCP tool ${toolId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testConnection(serverId: string): Promise<boolean> {
    try {
      await this.request(`/mcp/servers/${serverId}/ping`);
      return true;
    } catch (error) {
      console.error(`Failed to ping MCP server ${serverId}:`, error);
      return false;
    }
  }

  async registerServer(server: Omit<MCPServer, 'id' | 'tools'>): Promise<MCPServer> {
    try {
      return await this.request<MCPServer>('/mcp/servers', {
        method: 'POST',
        body: JSON.stringify(server),
      });
    } catch (error) {
      console.error('Failed to register MCP server:', error);
      throw error;
    }
  }

  async updateServer(serverId: string, updates: Partial<MCPServer>): Promise<MCPServer> {
    try {
      return await this.request<MCPServer>(`/mcp/servers/${serverId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error(`Failed to update MCP server ${serverId}:`, error);
      throw error;
    }
  }

  async deleteServer(serverId: string): Promise<void> {
    try {
      await this.request(`/mcp/servers/${serverId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error(`Failed to delete MCP server ${serverId}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const mcpService = new MCPService();
export default MCPService;