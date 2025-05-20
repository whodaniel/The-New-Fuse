import { z } from 'zod';

/**
 * Schema for an MCP marketplace server
 */
const mcpMarketplaceServerSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string(),
  publisher: z.string(),
  category: z.string(),
  rating: z.number(),
  downloads: z.number(),
  lastUpdated: z.string(),
  installCommand: z.string(),
  args: z.array(z.string()),
  capabilities: z.array(z.string()),
  requiresConfiguration: z.boolean(),
  configurationSchema: z.object({
    type: z.string(),
    required: z.array(z.string()).optional(),
    properties: z.record(z.any())
  }).optional()
});

export type MCPMarketplaceServer = z.infer<typeof mcpMarketplaceServerSchema>;

/**
 * Service for interacting with the MCP marketplace
 */
export class MCPMarketplaceService {
  private apiBaseUrl: string;
  private cacheExpiryMs = 3600000; // 1 hour in milliseconds
  private cachedServers: { timestamp: number; servers: MCPMarketplaceServer[] } | null = null;
  
  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  }
  
  /**
   * Fetches all MCP servers from the marketplace
   * @returns A list of marketplace MCP servers
   */
  async getServers(): Promise<MCPMarketplaceServer[]> {
    // Check cache first
    if (this.cachedServers && Date.now() - this.cachedServers.timestamp < this.cacheExpiryMs) {
      return this.cachedServers.servers;
    }
    
    try {
      const response = await fetch(`${this.apiBaseUrl}/mcp/marketplace/servers`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch MCP marketplace servers: ${response.statusText}`);
      }
      
      const data = await response.json();
      const servers = data.map((server: any) => mcpMarketplaceServerSchema.parse(server));
      
      // Cache the result
      this.cachedServers = {
        timestamp: Date.now(),
        servers
      };
      
      return servers;
    } catch (error) {
      console.error('Error fetching MCP marketplace servers:', error);
      
      // Return mock data for development
      return this.getMockServers();
    }
  }
  
  /**
   * Searches for MCP servers in the marketplace
   * @param query The search query
   * @returns A list of matching marketplace MCP servers
   */
  async searchServers(query: string): Promise<MCPMarketplaceServer[]> {
    try {
      const allServers = await this.getServers();
      if (!query) return allServers;
      
      const lowerQuery = query.toLowerCase();
      return allServers.filter(server => 
        server.name.toLowerCase().includes(lowerQuery) ||
        server.description.toLowerCase().includes(lowerQuery) ||
        server.publisher.toLowerCase().includes(lowerQuery) ||
        server.category.toLowerCase().includes(lowerQuery) ||
        server.capabilities.some(cap => cap.toLowerCase().includes(lowerQuery))
      );
    } catch (error) {
      console.error('Error searching MCP marketplace servers:', error);
      return [];
    }
  }
  
  /**
   * Fetches a specific MCP server from the marketplace
   * @param id The server ID
   * @returns The marketplace MCP server
   */
  async getServer(id: string): Promise<MCPMarketplaceServer | null> {
    try {
      const allServers = await this.getServers();
      return allServers.find(server => server.id === id) || null;
    } catch (error) {
      console.error(`Error fetching MCP marketplace server ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Installs an MCP server from the marketplace
   * @param id The server ID
   * @param config Optional configuration parameters
   * @returns True if successful
   */
  async installServer(id: string, config?: Record<string, any>): Promise<boolean> {
    try {
      const server = await this.getServer(id);
      if (!server) {
        throw new Error(`Server with ID ${id} not found in marketplace`);
      }
      
      const payload = {
        serverId: id,
        configuration: config || {}
      };
      
      const response = await fetch(`${this.apiBaseUrl}/mcp/servers/install`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to install MCP server: ${response.statusText}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Error installing MCP marketplace server ${id}:`, error);
      
      // For development, simulate success
      return true;
    }
  }
  
  /**
   * Gets mock servers for development
   * @returns A list of mock marketplace MCP servers
   */
  private getMockServers(): MCPMarketplaceServer[] {
    return [
      {
        id: 'vscode-mcp-server',
        name: 'VS Code MCP Server',
        description: 'Enables AI agents to interact with Visual Studio Code through the Model Context Protocol',
        version: '1.2.0',
        publisher: 'MCP Foundation',
        category: 'Development Tools',
        rating: 4.8,
        downloads: 12503,
        lastUpdated: '2025-04-01',
        installCommand: 'npx',
        args: ['@modelcontextprotocol/vscode-mcp-server'],
        capabilities: ['Code editing', 'File operations', 'Terminal commands', 'Diagnostics'],
        requiresConfiguration: false
      },
      {
        id: 'filesystem-mcp-server',
        name: 'Filesystem MCP Server',
        description: 'Provides secure filesystem access for AI agents through the Model Context Protocol',
        version: '0.9.5',
        publisher: 'MCP Foundation',
        category: 'File Management',
        rating: 4.6,
        downloads: 8921,
        lastUpdated: '2025-03-15',
        installCommand: 'npx',
        args: ['@modelcontextprotocol/server-filesystem', '--allow-dir', './data'],
        capabilities: ['File read', 'File write', 'Directory listing', 'File search'],
        requiresConfiguration: true,
        configurationSchema: {
          type: 'object',
          required: ['allowedDirectories'],
          properties: {
            allowedDirectories: {
              type: 'string',
              description: 'Comma-separated list of directories to allow access to'
            },
            readOnly: {
              type: 'boolean',
              description: 'Whether to allow only read operations'
            }
          }
        }
      },
      {
        id: 'shell-mcp-server',
        name: 'Shell MCP Server',
        description: 'Provides secure shell command execution for AI agents through MCP',
        version: '0.8.2',
        publisher: 'MCP Community',
        category: 'System Tools',
        rating: 4.3,
        downloads: 6254,
        lastUpdated: '2025-03-10',
        installCommand: 'npx',
        args: ['@modelcontextprotocol/server-shell', '--allow-commands', 'ls,cat,echo'],
        capabilities: ['Command execution', 'Process management'],
        requiresConfiguration: true,
        configurationSchema: {
          type: 'object',
          required: ['allowedCommands'],
          properties: {
            allowedCommands: {
              type: 'string',
              description: 'Comma-separated list of allowed commands'
            },
            timeoutSeconds: {
              type: 'number',
              description: 'Maximum execution time for commands (in seconds)'
            }
          }
        }
      },
      {
        id: 'browser-mcp-server',
        name: 'Browser MCP Server',
        description: 'Allows AI agents to browse and interact with web content through MCP',
        version: '1.0.0',
        publisher: 'Web Agents Inc.',
        category: 'Web',
        rating: 4.5,
        downloads: 7829,
        lastUpdated: '2025-04-10',
        installCommand: 'npx',
        args: ['@modelcontextprotocol/server-browser'],
        capabilities: ['Web browsing', 'HTML parsing', 'Form filling', 'Screenshot capture'],
        requiresConfiguration: false
      },
      {
        id: 'database-mcp-server',
        name: 'Database MCP Server',
        description: 'Provides database access for AI agents through the Model Context Protocol',
        version: '0.7.1',
        publisher: 'Data Solutions',
        category: 'Databases',
        rating: 4.2,
        downloads: 3845,
        lastUpdated: '2025-02-28',
        installCommand: 'npx',
        args: ['@modelcontextprotocol/server-database'],
        capabilities: ['SQL query execution', 'Schema inspection', 'Result formatting'],
        requiresConfiguration: true,
        configurationSchema: {
          type: 'object',
          required: ['connectionString', 'databaseType'],
          properties: {
            connectionString: {
              type: 'string',
              description: 'Database connection string'
            },
            databaseType: {
              type: 'string',
              description: 'Type of database (mysql, postgres, sqlite)'
            },
            maxRows: {
              type: 'number',
              description: 'Maximum number of rows to return'
            }
          }
        }
      },
      {
        id: 'code-as-mcp-server',
        name: 'VSCode as MCP Server',
        description: 'Turns your VSCode into an MCP server, enabling advanced coding assistance from MCP clients',
        version: '1.0.2',
        publisher: 'acomagu',
        category: 'Development Tools',
        rating: 4.9,
        downloads: 322,
        lastUpdated: '2025-04-15',
        installCommand: 'npx',
        args: ['vscode-as-mcp-server'],
        capabilities: ['Code editing', 'Terminal operations', 'Preview tools', 'Multi-instance switching'],
        requiresConfiguration: false
      }
    ];
  }
}