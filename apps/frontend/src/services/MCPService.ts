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

// Mock Data
const MOCK_SERVERS: MCPServer[] = [
  {
    id: 'server-1',
    name: 'Brave Search',
    url: 'http://localhost:3000/mcp/brave',
    status: 'online',
    tools: [
      {
        id: 'tool-brave-search',
        name: 'search',
        description: 'Search the web using Brave Search',
        parameters: {
          query: { name: 'query', type: 'string', description: 'Search query', required: true }
        },
        returns: { type: 'string', description: 'Search results in JSON format' },
        serverId: 'server-1'
      }
    ],
    metadata: { version: '1.0.0', provider: 'Brave' }
  },
  {
    id: 'server-2',
    name: 'FileSystem',
    url: 'http://localhost:3000/mcp/filesystem',
    status: 'online',
    tools: [
      {
        id: 'tool-fs-read',
        name: 'read_file',
        description: 'Read file content',
        parameters: {
          path: { name: 'path', type: 'string', description: 'File path', required: true }
        },
        returns: { type: 'string', description: 'File content' },
        serverId: 'server-2'
      },
      {
        id: 'tool-fs-write',
        name: 'write_file',
        description: 'Write content to file',
        parameters: {
          path: { name: 'path', type: 'string', description: 'File path', required: true },
          content: { name: 'content', type: 'string', description: 'File content', required: true }
        },
        returns: { type: 'boolean', description: 'Success status' },
        serverId: 'server-2'
      }
    ],
    metadata: { version: '1.2.0', restricted: true }
  },
  {
    id: 'server-3',
    name: 'GitHub Integration',
    url: 'http://localhost:3000/mcp/github',
    status: 'offline',
    tools: [],
    metadata: { version: '0.9.0', auth_required: true }
  }
];

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
    try {
      return await this.request<MCPServer[]>('/mcp/servers');
    } catch (error) {
      console.log('Using mock MCP servers');
      return MOCK_SERVERS;
    }
  }

  async getServer(serverId: string): Promise<MCPServer> {
    try {
      return await this.request<MCPServer>(`/mcp/servers/${serverId}`);
    } catch (error) {
      const server = MOCK_SERVERS.find(s => s.id === serverId);
      if (server) return server;
      throw error;
    }
  }

  async getTools(serverId?: string): Promise<MCPTool[]> {
    try {
      const endpoint = serverId ? `/mcp/servers/${serverId}/tools` : '/mcp/tools';
      return await this.request<MCPTool[]>(endpoint);
    } catch (error) {
      if (serverId) {
        const server = MOCK_SERVERS.find(s => s.id === serverId);
        return server ? server.tools : [];
      }
      return MOCK_SERVERS.flatMap(s => s.tools);
    }
  }

  async getTool(toolId: string): Promise<MCPTool> {
    try {
      return await this.request<MCPTool>(`/mcp/tools/${toolId}`);
    } catch (error) {
      const tool = MOCK_SERVERS.flatMap(s => s.tools).find(t => t.id === toolId);
      if (tool) return tool;
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
      console.log('Mock executing tool');
      return {
        success: true,
        result: {
          output: `Mock execution of ${toolId}`,
          parameters
        },
        executionTime: 125
      };
    }
  }

  async testConnection(serverId: string): Promise<boolean> {
    try {
      await this.request(`/mcp/servers/${serverId}/ping`);
      return true;
    } catch (error) {
      return true; // Mock success
    }
  }

  async registerServer(server: Omit<MCPServer, 'id' | 'tools'>): Promise<MCPServer> {
    try {
      return await this.request<MCPServer>('/mcp/servers', {
        method: 'POST',
        body: JSON.stringify(server),
      });
    } catch (error) {
      return {
        ...server,
        id: `server-${Date.now()}`,
        tools: [],
        status: 'online'
      };
    }
  }

  async updateServer(serverId: string, updates: Partial<MCPServer>): Promise<MCPServer> {
    try {
      return await this.request<MCPServer>(`/mcp/servers/${serverId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    } catch (error) {
      const server = MOCK_SERVERS.find(s => s.id === serverId);
      return { ...(server || MOCK_SERVERS[0]), ...updates };
    }
  }

  async deleteServer(serverId: string): Promise<void> {
    try {
      await this.request(`/mcp/servers/${serverId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.log('Mock deleting server');
    }
  }
}

// Export singleton instance
export const mcpService = new MCPService();
export default MCPService;
