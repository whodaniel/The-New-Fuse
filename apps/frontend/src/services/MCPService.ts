import { z } from 'zod';

// MCP Tool Parameter Schema
const mcpToolParameterSchema = z.object({
  name: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
  description: z.string().optional(),
  required: z.boolean().optional(),
  default: z.any().optional(),
  enum: z.array(z.any()).optional(),
  items: z.any().optional(), // For array type
  properties: z.record(z.any()).optional() // For object type
});

// MCP Tool Schema
const mcpToolSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  parameters: z.record(mcpToolParameterSchema).optional(),
  returns: z.object({
    type: z.string(),
    description: z.string().optional()
  }).optional()
});

// MCP Server Schema
const mcpServerSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  status: z.enum(['online', 'offline', 'error']),
  tools: z.array(mcpToolSchema)
});

export type MCPToolParameter = z.infer<typeof mcpToolParameterSchema>;
export type MCPTool = z.infer<typeof mcpToolSchema>;
export type MCPServer = z.infer<typeof mcpServerSchema>;

/**
 * Service for interacting with MCP servers
 */
export class MCPService {
  private apiBaseUrl: string;
  
  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  }
  
  /**
   * Fetches all MCP servers
   * @returns A list of MCP servers
   */
  async getServers(): Promise<MCPServer[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/mcp/servers`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch MCP servers: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.map((server: any) => mcpServerSchema.parse(server));
    } catch (error) {
      console.error('Error fetching MCP servers:', error);
      
      // Return mock data for development
      return this.getMockServers();
    }
  }
  
  /**
   * Fetches an MCP server by ID
   * @param id The server ID
   * @returns The MCP server
   */
  async getServer(id: string): Promise<MCPServer> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/mcp/servers/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch MCP server: ${response.statusText}`);
      }
      
      const data = await response.json();
      return mcpServerSchema.parse(data);
    } catch (error) {
      console.error(`Error fetching MCP server ${id}:`, error);
      
      // Return mock data for development
      const mockServers = this.getMockServers();
      const server = mockServers.find(s => s.id === id);
      
      if (!server) {
        throw new Error(`MCP server ${id} not found`);
      }
      
      return server;
    }
  }
  
  /**
   * Fetches all MCP tools
   * @returns A list of MCP tools
   */
  async getTools(): Promise<MCPTool[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/mcp/tools`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch MCP tools: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.map((tool: any) => mcpToolSchema.parse(tool));
    } catch (error) {
      console.error('Error fetching MCP tools:', error);
      
      // Return mock data for development
      const mockServers = this.getMockServers();
      return mockServers.flatMap(server => server.tools);
    }
  }
  
  /**
   * Fetches an MCP tool by ID
   * @param id The tool ID
   * @returns The MCP tool
   */
  async getTool(id: string): Promise<MCPTool> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/mcp/tools/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch MCP tool: ${response.statusText}`);
      }
      
      const data = await response.json();
      return mcpToolSchema.parse(data);
    } catch (error) {
      console.error(`Error fetching MCP tool ${id}:`, error);
      
      // Return mock data for development
      const mockServers = this.getMockServers();
      const tool = mockServers.flatMap(server => server.tools).find(t => t.id === id);
      
      if (!tool) {
        throw new Error(`MCP tool ${id} not found`);
      }
      
      return tool;
    }
  }
  
  /**
   * Executes an MCP tool
   * @param toolId The tool ID
   * @param parameters The tool parameters
   * @returns The tool execution result
   */
  async executeTool(toolId: string, parameters: Record<string, any>): Promise<any> {
    try {
      // Validate parameters
      const tool = await this.getTool(toolId);
      this.validateToolParameters(tool, parameters);
      
      const response = await fetch(`${this.apiBaseUrl}/mcp/tools/${toolId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ parameters })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to execute MCP tool: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error executing MCP tool ${toolId}:`, error);
      throw error;
    }
  }
  
  /**
   * Validates tool parameters
   * @param tool The MCP tool
   * @param parameters The parameters to validate
   * @throws Error if parameters are invalid
   */
  validateToolParameters(tool: MCPTool, parameters: Record<string, any>): void {
    if (!tool.parameters) {
      return;
    }
    
    // Check required parameters
    for (const [name, param] of Object.entries(tool.parameters)) {
      if (param.required && (parameters[name] === undefined || parameters[name] === null)) {
        throw new Error(`Required parameter '${name}' is missing`);
      }
    }
    
    // Validate parameter types
    for (const [name, value] of Object.entries(parameters)) {
      const param = tool.parameters[name];
      
      if (!param) {
        throw new Error(`Unknown parameter '${name}'`);
      }
      
      // Skip validation for null or undefined values
      if (value === null || value === undefined) {
        continue;
      }
      
      switch (param.type) {
        case 'string':
          if (typeof value !== 'string') {
            throw new Error(`Parameter '${name}' must be a string`);
          }
          break;
        case 'number':
          if (typeof value !== 'number') {
            throw new Error(`Parameter '${name}' must be a number`);
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            throw new Error(`Parameter '${name}' must be a boolean`);
          }
          break;
        case 'object':
          if (typeof value !== 'object' || Array.isArray(value)) {
            throw new Error(`Parameter '${name}' must be an object`);
          }
          break;
        case 'array':
          if (!Array.isArray(value)) {
            throw new Error(`Parameter '${name}' must be an array`);
          }
          break;
      }
      
      // Validate enum values
      if (param.enum && !param.enum.includes(value)) {
        throw new Error(`Parameter '${name}' must be one of: ${param.enum.join(', ')}`);
      }
    }
  }
  
  /**
   * Gets mock MCP servers for development
   * @returns A list of mock MCP servers
   */
  private getMockServers(): MCPServer[] {
    return [
      {
        id: 'server-1',
        name: 'Local MCP',
        url: 'http://localhost:3000',
        status: 'online',
        tools: [
          {
            id: 'tool-1',
            name: 'CodeSearch',
            description: 'Search code in the repository',
            parameters: {
              query: {
                name: 'query',
                type: 'string',
                description: 'Search query',
                required: true
              },
              maxResults: {
                name: 'maxResults',
                type: 'number',
                description: 'Maximum number of results',
                default: 10
              }
            },
            returns: {
              type: 'array',
              description: 'Array of search results'
            }
          },
          {
            id: 'tool-2',
            name: 'FileEditor',
            description: 'Edit files in the repository',
            parameters: {
              filePath: {
                name: 'filePath',
                type: 'string',
                description: 'Path to the file',
                required: true
              },
              content: {
                name: 'content',
                type: 'string',
                description: 'New content for the file',
                required: true
              }
            },
            returns: {
              type: 'object',
              description: 'Result of the operation'
            }
          },
          {
            id: 'tool-3',
            name: 'GitOperations',
            description: 'Perform Git operations',
            parameters: {
              operation: {
                name: 'operation',
                type: 'string',
                description: 'Git operation to perform',
                required: true,
                enum: ['status', 'add', 'commit', 'push', 'pull', 'branch', 'checkout']
              },
              branch: {
                name: 'branch',
                type: 'string',
                description: 'Git branch',
                default: 'main'
              }
            },
            returns: {
              type: 'object',
              description: 'Result of the Git operation'
            }
          }
        ]
      },
      {
        id: 'server-2',
        name: 'Remote MCP',
        url: 'https://mcp.example.com',
        status: 'online',
        tools: [
          {
            id: 'tool-4',
            name: 'APIClient',
            description: 'Make API calls',
            parameters: {
              url: {
                name: 'url',
                type: 'string',
                description: 'API URL',
                required: true
              },
              method: {
                name: 'method',
                type: 'string',
                description: 'HTTP method',
                default: 'GET',
                enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
              },
              headers: {
                name: 'headers',
                type: 'object',
                description: 'HTTP headers'
              },
              body: {
                name: 'body',
                type: 'object',
                description: 'Request body'
              }
            },
            returns: {
              type: 'object',
              description: 'API response'
            }
          },
          {
            id: 'tool-5',
            name: 'DataProcessor',
            description: 'Process and transform data',
            parameters: {
              data: {
                name: 'data',
                type: 'object',
                description: 'Input data',
                required: true
              },
              transformations: {
                name: 'transformations',
                type: 'array',
                description: 'List of transformations to apply'
              }
            },
            returns: {
              type: 'object',
              description: 'Transformed data'
            }
          }
        ]
      }
    ];
  }
}

// Create singleton instance
export const mcpService = new MCPService();
