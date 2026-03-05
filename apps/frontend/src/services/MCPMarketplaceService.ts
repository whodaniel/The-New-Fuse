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
  configurationSchema: z
    .object({
      type: z.string(),
      required: z.array(z.string()).optional(),
      properties: z.record(z.string(), z.any()),
    })
    .optional(),
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

      const data: unknown = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid marketplace response');
      }
      const servers = data.map((server: unknown) => mcpMarketplaceServerSchema.parse(server));

      // Cache the result
      this.cachedServers = {
        timestamp: Date.now(),
        servers,
      };

      return servers;
    } catch (error) {
      console.error('Error fetching MCP marketplace servers:', error);
      throw new Error('MCP marketplace is currently unavailable');
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
      return allServers.filter(
        (server) =>
          server.name.toLowerCase().includes(lowerQuery) ||
          server.description.toLowerCase().includes(lowerQuery) ||
          server.publisher.toLowerCase().includes(lowerQuery) ||
          server.category.toLowerCase().includes(lowerQuery) ||
          server.capabilities.some((cap) => cap.toLowerCase().includes(lowerQuery))
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
      return allServers.find((server) => server.id === id) || null;
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
  async installServer(id: string, config?: Record<string, unknown>): Promise<boolean> {
    try {
      const server = await this.getServer(id);
      if (!server) {
        throw new Error(`Server with ID ${id} not found in marketplace`);
      }

      const payload = {
        serverId: id,
        configuration: config || {},
      };

      const response = await fetch(`${this.apiBaseUrl}/mcp/servers/install`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to install MCP server: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error(`Error installing MCP marketplace server ${id}:`, error);
      throw error;
    }
  }
}
