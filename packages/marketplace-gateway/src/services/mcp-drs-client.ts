/**
 * MCP-DRS API Client
 *
 * Client for communicating with the MCP-DRS discovery service.
 * Handles authentication, server discovery, and data mapping.
 */

import axios, { AxiosInstance } from 'axios';
import {
  MarketplaceSearchParams,
  MCPPrompt,
  MCPResource,
  MCPServerAsset,
  MCPTool,
  SecurityPosture,
  TransportConfig,
} from '../types/unified-asset';

interface MCPDRSConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

interface MCPDRSServer {
  server_id: string;
  name: string;
  description: string;
  author: string;
  repository_url?: string;
  transport_config: {
    transport: 'stdio' | 'http' | 'sse';
    command?: string;
    args?: string[];
    url?: string;
  };
  capabilities: {
    tools: Array<{
      name: string;
      description: string;
      input_schema?: Record<string, unknown>;
      output_schema?: Record<string, unknown>;
    }>;
    resources: Array<{
      name: string;
      uri: string;
      mime_type?: string;
    }>;
    prompts: Array<{
      name: string;
      description?: string;
      template: string;
    }>;
  };
  security_posture: {
    trust_score: number;
    issues: Array<{
      severity: string;
      type: string;
      details: string;
    }>;
    auth_methods: string[];
  };
  crawl_metadata: {
    last_successful_crawl_at: string;
    last_crawl_status: string;
  };
  community_metadata: {
    rating: number;
    usage_count: number;
  };
  first_discovered_at: string;
}

interface MCPDRSSearchResponse {
  total: number;
  servers: MCPDRSServer[];
}

export class MCPDRSClient {
  private client: AxiosInstance;
  private authToken?: string;

  constructor(config: MCPDRSConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://mcp-drs-api-production.up.railway.app',
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth interceptor
    this.client.interceptors.request.use((reqConfig) => {
      if (this.authToken) {
        reqConfig.headers.Authorization = `Bearer ${this.authToken}`;
      } else if (config.apiKey) {
        reqConfig.headers['X-API-Key'] = config.apiKey;
      }
      return reqConfig;
    });
  }

  /**
   * Authenticate with MCP-DRS
   */
  async authenticate(email: string, password: string): Promise<string> {
    const response = await this.client.post('/auth/login', { email, password });
    const token: string = response.data.token;
    this.authToken = token;
    return token;
  }

  /**
   * Set auth token directly (for service-to-service auth)
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Search MCP servers
   */
  async searchServers(params: MarketplaceSearchParams): Promise<MCPDRSSearchResponse> {
    const queryParams: Record<string, string> = {};

    if (params.q) queryParams.q = params.q;
    if (params.author) queryParams.author = params.author;
    if (params.limit) queryParams.limit = params.limit.toString();
    if (params.offset) queryParams.from = params.offset.toString();
    if (params.sort) queryParams.sort = this.mapSortField(params.sort);
    if (params.order) queryParams.order = params.order;

    const response = await this.client.get<MCPDRSSearchResponse>('/api/servers', {
      params: queryParams,
    });

    return response.data;
  }

  /**
   * Get a specific server by ID
   */
  async getServer(serverId: string): Promise<MCPDRSServer> {
    const response = await this.client.get<MCPDRSServer>(`/api/servers/${serverId}`);
    return response.data;
  }

  /**
   * Get recently updated servers (for sync)
   */
  async getRecentlyUpdatedServers(since?: Date): Promise<MCPDRSServer[]> {
    const params: Record<string, string> = {
      sort: 'updated_at',
      order: 'desc',
      limit: '100',
    };

    if (since) {
      params.since = since.toISOString();
    }

    const response = await this.client.get<MCPDRSSearchResponse>('/api/servers', { params });
    return response.data.servers;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data.status === 'healthy';
    } catch {
      return false;
    }
  }

  /**
   * Map MCP-DRS server to unified MarketplaceAsset
   */
  mapToMarketplaceAsset(server: MCPDRSServer): MCPServerAsset {
    return {
      // Identity
      id: `mcp-${server.server_id}`,
      type: 'MCP_SERVER',
      slug: this.slugify(server.name),
      externalId: server.server_id,
      source: 'mcp-drs',

      // Metadata
      name: server.name,
      description: server.description,
      author: {
        id: this.slugify(server.author),
        name: server.author,
        isVerified: this.isVerifiedAuthor(server.author),
        reputation: this.calculateAuthorReputation(server),
        assetCount: 1,
      },
      version: '1.0.0',
      tags: this.extractTags(server),
      category: this.inferCategory(server),

      // Discovery
      capabilities: server.capabilities.tools.map((t) => t.name),
      compatibility: {
        platforms: this.inferPlatforms(server.transport_config),
        requirements: [],
      },

      // Quality & Trust
      trustScore: server.security_posture.trust_score,
      communityRating: server.community_metadata.rating,
      reviewCount: 0,
      downloadCount: server.community_metadata.usage_count,
      usageCount: server.community_metadata.usage_count,
      isVerified: server.security_posture.trust_score >= 80,
      verificationStatus: this.mapVerificationStatus(server.security_posture.trust_score),
      isFeatured: false,

      // Pricing
      pricing: {
        type: 'FREE',
        currency: 'USD',
      },

      // MCP-specific
      transportConfig: this.mapTransportConfig(server.transport_config),
      tools: this.mapTools(server.capabilities.tools),
      resources: this.mapResources(server.capabilities.resources),
      prompts: this.mapPrompts(server.capabilities.prompts),
      securityPosture: this.mapSecurityPosture(server.security_posture),
      repositoryUrl: server.repository_url,

      // Timestamps
      createdAt: new Date(server.first_discovered_at),
      updatedAt: new Date(server.crawl_metadata.last_successful_crawl_at),
    };
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private isVerifiedAuthor(author: string): boolean {
    const verifiedAuthors = ['anthropic', 'google', 'microsoft', 'openai', 'meta'];
    return verifiedAuthors.includes(author.toLowerCase());
  }

  private calculateAuthorReputation(server: MCPDRSServer): number {
    let reputation = 50;
    if (this.isVerifiedAuthor(server.author)) reputation += 30;
    if (server.security_posture.trust_score >= 80) reputation += 10;
    if (server.community_metadata.rating >= 4) reputation += 10;
    return Math.min(100, reputation);
  }

  private extractTags(server: MCPDRSServer): string[] {
    const tags: Set<string> = new Set();

    // Extract from tool names
    server.capabilities.tools.forEach((tool) => {
      const words = tool.name.split(/[_-]/);
      words.forEach((word) => {
        if (word.length > 2) tags.add(word.toLowerCase());
      });
    });

    // Add transport type as tag
    tags.add(server.transport_config.transport);

    return Array.from(tags).slice(0, 10);
  }

  private inferCategory(server: MCPDRSServer): string {
    const name = server.name.toLowerCase();
    const description = server.description.toLowerCase();

    if (name.includes('github') || name.includes('git')) return 'development';
    if (name.includes('email') || name.includes('mail')) return 'communication';
    if (name.includes('database') || name.includes('sql')) return 'data';
    if (name.includes('file') || name.includes('storage')) return 'storage';
    if (name.includes('browser') || name.includes('web')) return 'automation';
    if (description.includes('ai') || description.includes('llm')) return 'ai';

    return 'general';
  }

  private inferPlatforms(
    transport: MCPDRSServer['transport_config']
  ): MCPServerAsset['compatibility']['platforms'] {
    // All transports work with most platforms
    const platforms: MCPServerAsset['compatibility']['platforms'] = [
      'claude-desktop',
      'claude-code',
      'cursor',
    ];

    if (transport.transport === 'http' || transport.transport === 'sse') {
      platforms.push('gemini-cli', 'vscode');
    }

    return platforms;
  }

  private mapVerificationStatus(trustScore: number): MCPServerAsset['verificationStatus'] {
    if (trustScore >= 90) return 'CERTIFIED';
    if (trustScore >= 80) return 'VERIFIED';
    return 'PENDING';
  }

  private mapTransportConfig(config: MCPDRSServer['transport_config']): TransportConfig {
    return {
      transport: config.transport,
      command: config.command,
      args: config.args,
      url: config.url,
    };
  }

  private mapTools(tools: MCPDRSServer['capabilities']['tools']): MCPTool[] {
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.input_schema,
      outputSchema: tool.output_schema,
    }));
  }

  private mapResources(resources: MCPDRSServer['capabilities']['resources']): MCPResource[] {
    return resources.map((resource) => ({
      name: resource.name,
      uri: resource.uri,
      mimeType: resource.mime_type,
    }));
  }

  private mapPrompts(prompts: MCPDRSServer['capabilities']['prompts']): MCPPrompt[] {
    return prompts.map((prompt) => ({
      name: prompt.name,
      description: prompt.description,
      template: prompt.template,
    }));
  }

  private mapSecurityPosture(posture: MCPDRSServer['security_posture']): SecurityPosture {
    return {
      trustScore: posture.trust_score,
      issues: posture.issues.map((issue) => ({
        severity: issue.severity as 'low' | 'medium' | 'high' | 'critical',
        type: issue.type,
        details: issue.details,
      })),
      authMethods: posture.auth_methods,
    };
  }

  private mapSortField(sort: MarketplaceSearchParams['sort']): string {
    switch (sort) {
      case 'popular':
        return 'usage_count';
      case 'recent':
        return 'first_discovered_at';
      case 'rating':
        return 'rating';
      case 'downloads':
        return 'usage_count';
      default:
        return 'trust_score';
    }
  }
}

// Export singleton instance with environment config
export const mcpDrsClient = new MCPDRSClient({
  baseUrl: process.env.MCP_DRS_API_URL || 'https://mcp-drs-api-production.up.railway.app',
  apiKey: process.env.MCP_DRS_API_KEY,
});
