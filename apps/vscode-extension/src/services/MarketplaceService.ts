/**
 * The New Fuse VSCode Extension - MCP Marketplace Service
 * Version 9.0.0 - Ecosystem Expansion
 *
 * Manages the MCP server marketplace, allowing discovery and installation
 */

import * as vscode from 'vscode';
import { MCPMarketplaceServer } from '../core/types';
import { log } from '../utils/logger';
import { ConfigManager } from '../core/config';
import { getMCPService } from './MCPService';

/**
 * Service for discovery and installation of MCP servers
 */
export class MarketplaceService {
  private static instance: MarketplaceService;
  
  // Curated list of high-quality MCP servers
  private readonly curatedServers: MCPMarketplaceServer[] = [
    {
      id: 'filesystem',
      name: 'Filesystem',
      description: 'Read and write access to your local filesystem for the AI',
      author: 'Anthropic',
      githubUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem',
      installCommand: 'npx @modelcontextprotocol/server-filesystem',
      tags: ['system', 'files', 'local']
    },
    {
      id: 'github',
      name: 'GitHub',
      description: 'Search, read, and manage GitHub repositories, issues, and PRs',
      author: 'Anthropic',
      githubUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/github',
      installCommand: 'npx @modelcontextprotocol/server-github',
      tags: ['dev', 'git', 'github']
    },
    {
      id: 'postgres',
      name: 'Postgres',
      description: 'Query and analyze PostgreSQL databases',
      author: 'Anthropic',
      githubUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/postgres',
      installCommand: 'npx @modelcontextprotocol/server-postgres',
      tags: ['db', 'sql', 'postgres']
    },
    {
      id: 'brave-search',
      name: 'Brave Search',
      description: 'Give AI access to real-time web search results',
      author: 'Brave',
      githubUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search',
      installCommand: 'npx @modelcontextprotocol/server-brave-search',
      tags: ['search', 'web', 'real-time']
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Read and send messages in Slack channels',
      author: 'Anthropic',
      githubUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/slack',
      installCommand: 'npx @modelcontextprotocol/server-slack',
      tags: ['comms', 'slack', 'team']
    },
    {
      id: 'sequential-thinking',
      name: 'Sequential Thinking',
      description: 'Advanced reasoning tool for complex problem solving',
      author: 'The New Fuse',
      githubUrl: 'https://github.com/The-New-Fuse/mcp-sequential-thinking',
      installCommand: 'npx @the-new-fuse/mcp-sequential-thinking',
      tags: ['reasoning', 'logic', 'advanced']
    }
  ];

  private constructor() {}

  static getInstance(): MarketplaceService {
    if (!MarketplaceService.instance) {
      MarketplaceService.instance = new MarketplaceService();
    }
    return MarketplaceService.instance;
  }

  /**
   * Get all marketplace servers
   */
  async getMarketplaceServers(): Promise<MCPMarketplaceServer[]> {
    // In a real implementation, this would fetch from a remote API
    // For now, return curated local list
    return [...this.curatedServers];
  }

  /**
   * Install a server from the marketplace
   */
  async installServer(serverId: string): Promise<boolean> {
    const server = this.curatedServers.find(s => s.id === serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found in marketplace`);
    }

    log.info(`Installing MCP server from marketplace: ${server.name}`);

    try {
      // For npx commands, we can just add it to config
      // In more complex cases, we might need to run actual installation scripts
      
      const config = ConfigManager.getInstance();
      
      // Prompt for any required env vars
      const env: Record<string, string> = {};
      if (server.id === 'github') {
        const token = await vscode.window.showInputBox({
          prompt: 'Enter GitHub Personal Access Token',
          password: true
        });
        if (token) env['GITHUB_PERSONAL_ACCESS_TOKEN'] = token;
      } else if (server.id === 'brave-search') {
        const key = await vscode.window.showInputBox({
          prompt: 'Enter Brave Search API Key'
        });
        if (key) env['BRAVE_SEARCH_API_KEY'] = key;
      }

      await config.addMCPServer({
        name: server.name,
        command: server.installCommand.split(' ')[0],
        args: server.installCommand.split(' ').slice(1),
        env,
        enabled: true
      });

      // Connect immediately
      const mcpService = getMCPService();
      await mcpService.connect({
        name: server.name,
        command: server.installCommand.split(' ')[0],
        args: server.installCommand.split(' ').slice(1),
        env,
        enabled: true
      });

      return true;
    } catch (error) {
      log.error(`Failed to install MCP server: ${server.name}`, error);
      return false;
    }
  }
}

/**
 * Get singleton instance
 */
export function getMarketplaceService(): MarketplaceService {
  return MarketplaceService.getInstance();
}
