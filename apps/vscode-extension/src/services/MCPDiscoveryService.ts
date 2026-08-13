/**
 * The New Fuse VSCode Extension - MCP Server Discovery
 * Version 9.2.0
 *
 * Discovers and manages MCP (Model Context Protocol) servers
 */

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { ConfigManager } from '../core/config';
import { MCPServerConfig } from '../core/types';
import { log } from '../utils/logger';

export interface MCPServerDefinition {
  name: string;
  description: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  category: string;
  installCommand?: string;
  website?: string;
  requiresConfig?: boolean;
  configFields?: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean';
    description: string;
    required?: boolean;
    default?: string | number | boolean;
  }>;
}

export interface MCPRegistry {
  servers: MCPServerDefinition[];
  lastUpdated: string;
}

/**
 * Known MCP servers from the community
 */
const KNOWN_MCP_SERVERS: MCPServerDefinition[] = [
  {
    name: 'filesystem',
    description: 'Provides access to local files and directories',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/allowed/dir'],
    category: 'File Access',
    installCommand: 'npm install -g @modelcontextprotocol/server-filesystem',
    website: 'https://github.com/modelcontextprotocol/servers',
  },
  {
    name: 'github',
    description: 'GitHub repository access and operations',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: { GITHUB_PERSONAL_ACCESS_TOKEN: '' },
    category: 'Development',
    installCommand: 'npm install -g @modelcontextprotocol/server-github',
    website: 'https://github.com/modelcontextprotocol/servers',
    requiresConfig: true,
    configFields: [
      {
        name: 'GITHUB_PERSONAL_ACCESS_TOKEN',
        type: 'string',
        description: 'GitHub Personal Access Token with repo access',
        required: true,
      },
    ],
  },
  {
    name: 'gitlab',
    description: 'GitLab repository access and operations',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-gitlab'],
    env: { GITLAB_PERSONAL_ACCESS_TOKEN: '', GITLAB_API_URL: 'https://gitlab.com/api/v4' },
    category: 'Development',
    installCommand: 'npm install -g @modelcontextprotocol/server-gitlab',
    requiresConfig: true,
    configFields: [
      {
        name: 'GITLAB_PERSONAL_ACCESS_TOKEN',
        type: 'string',
        description: 'GitLab Personal Access Token',
        required: true,
      },
      {
        name: 'GITLAB_API_URL',
        type: 'string',
        description: 'GitLab API URL',
        required: false,
        default: 'https://gitlab.com/api/v4',
      },
    ],
  },
  {
    name: 'slack',
    description: 'Slack workspace integration',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-slack'],
    env: { SLACK_BOT_TOKEN: '', SLACK_TEAM_ID: '' },
    category: 'Communication',
    requiresConfig: true,
    configFields: [
      {
        name: 'SLACK_BOT_TOKEN',
        type: 'string',
        description: 'Slack Bot User OAuth Token (xoxb-...)',
        required: true,
      },
      {
        name: 'SLACK_TEAM_ID',
        type: 'string',
        description: 'Slack Team/Workspace ID',
        required: true,
      },
    ],
  },
  {
    name: 'google-drive',
    description: 'Google Drive file access and management',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-google-drive'],
    category: 'Cloud Storage',
    requiresConfig: true,
    configFields: [
      {
        name: 'GOOGLE_CLIENT_ID',
        type: 'string',
        description: 'Google OAuth Client ID',
        required: true,
      },
      {
        name: 'GOOGLE_CLIENT_SECRET',
        type: 'string',
        description: 'Google OAuth Client Secret',
        required: true,
      },
    ],
  },
  {
    name: 'postgres',
    description: 'PostgreSQL database access',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-postgres'],
    env: { DATABASE_URL: '' },
    category: 'Database',
    requiresConfig: true,
    configFields: [
      {
        name: 'DATABASE_URL',
        type: 'string',
        description: 'PostgreSQL connection string',
        required: true,
      },
    ],
  },
  {
    name: 'sqlite',
    description: 'SQLite database access',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sqlite', '/path/to/database.db'],
    category: 'Database',
  },
  {
    name: 'memory',
    description: 'Persistent memory and knowledge base',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-memory'],
    category: 'AI/Memory',
  },
  {
    name: 'puppeteer',
    description: 'Browser automation and web scraping',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-puppeteer'],
    category: 'Web',
  },
  {
    name: 'brave-search',
    description: 'Web search using Brave Search API',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-brave-search'],
    env: { BRAVE_API_KEY: '' },
    category: 'Search',
    requiresConfig: true,
    configFields: [
      {
        name: 'BRAVE_API_KEY',
        type: 'string',
        description: 'Brave Search API Key',
        required: true,
      },
    ],
  },
  {
    name: 'fetch',
    description: 'Fetch and convert web pages to Markdown',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-fetch'],
    category: 'Web',
  },
  {
    name: 'sentry',
    description: 'Sentry error tracking integration',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sentry'],
    env: { SENTRY_AUTH_TOKEN: '', SENTRY_ORG: '' },
    category: 'Monitoring',
    requiresConfig: true,
    configFields: [
      {
        name: 'SENTRY_AUTH_TOKEN',
        type: 'string',
        description: 'Sentry Auth Token',
        required: true,
      },
      {
        name: 'SENTRY_ORG',
        type: 'string',
        description: 'Sentry Organization Slug',
        required: true,
      },
    ],
  },
  {
    name: 'everything',
    description: 'Demo server with all MCP capabilities',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-everything'],
    category: 'Demo',
  },
  {
    name: 'sequential-thinking',
    description: 'Step-by-step reasoning and problem solving',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
    category: 'AI/Reasoning',
  },
];

/**
 * MCP Server Discovery Service
 */
export class MCPDiscoveryService {
  private static instance: MCPDiscoveryService;
  private knownServers: MCPServerDefinition[] = KNOWN_MCP_SERVERS;

  private constructor() {}

  static getInstance(): MCPDiscoveryService {
    if (!MCPDiscoveryService.instance) {
      MCPDiscoveryService.instance = new MCPDiscoveryService();
    }
    return MCPDiscoveryService.instance;
  }

  /**
   * Get all known MCP servers
   */
  getKnownServers(): MCPServerDefinition[] {
    return this.knownServers;
  }

  /**
   * Get servers by category
   */
  getServersByCategory(): Map<string, MCPServerDefinition[]> {
    const categories = new Map<string, MCPServerDefinition[]>();

    for (const server of this.knownServers) {
      const existing = categories.get(server.category) || [];
      existing.push(server);
      categories.set(server.category, existing);
    }

    return categories;
  }

  /**
   * Search servers by name or description
   */
  searchServers(query: string): MCPServerDefinition[] {
    const lowerQuery = query.toLowerCase();
    return this.knownServers.filter(
      (server) =>
        server.name.toLowerCase().includes(lowerQuery) ||
        server.description.toLowerCase().includes(lowerQuery) ||
        server.category.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Show MCP server marketplace/picker
   */
  async showServerMarketplace(): Promise<MCPServerConfig | undefined> {
    const categories = this.getServersByCategory();
    const items: vscode.QuickPickItem[] = [];

    // Add category headers and servers
    for (const [category, servers] of categories) {
      items.push({
        label: `$(folder) ${category}`,
        kind: vscode.QuickPickItemKind.Separator,
      });

      for (const server of servers) {
        const requiresConfig = server.requiresConfig ? '$(key) ' : '';
        items.push({
          label: `${requiresConfig}${server.name}`,
          description: server.category,
          detail: server.description,
        });
      }
    }

    const selection = await vscode.window.showQuickPick(items, {
      title: 'MCP Server Marketplace',
      placeHolder: 'Select an MCP server to add...',
      matchOnDescription: true,
      matchOnDetail: true,
    });

    if (!selection || selection.kind === vscode.QuickPickItemKind.Separator) {
      return undefined;
    }

    // Find the selected server
    const serverName = selection.label.replace(/\$\(key\) /, '');
    const serverDef = this.knownServers.find((s) => s.name === serverName);

    if (!serverDef) {
      return undefined;
    }

    // If server requires configuration, prompt for it
    let env: Record<string, string> = {};
    if (serverDef.requiresConfig && serverDef.configFields) {
      const configValues = await this.promptForConfiguration(serverDef);
      if (!configValues) {
        return undefined; // User cancelled
      }
      env = configValues;
    }

    // You can customize args if needed
    let args = serverDef.args || [];

    // For filesystem server, let user pick directory
    if (serverDef.name === 'filesystem') {
      const folderUri = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: 'Select Directory for Filesystem Access',
      });

      if (!folderUri || folderUri.length === 0) {
        return undefined;
      }

      args = ['-y', '@modelcontextprotocol/server-filesystem', folderUri[0].fsPath];
    }

    // For sqlite server, let user pick database file
    if (serverDef.name === 'sqlite') {
      const fileUri = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters: { 'SQLite Database': ['db', 'sqlite', 'sqlite3'] },
        openLabel: 'Select SQLite Database',
      });

      if (!fileUri || fileUri.length === 0) {
        return undefined;
      }

      args = ['-y', '@modelcontextprotocol/server-sqlite', fileUri[0].fsPath];
    }

    const config: MCPServerConfig = {
      name: serverDef.name,
      command: serverDef.command,
      args,
      env: Object.keys(env).length > 0 ? env : undefined,
      enabled: true,
    };

    return config;
  }

  /**
   * Prompt user for server configuration
   */
  private async promptForConfiguration(
    serverDef: MCPServerDefinition
  ): Promise<Record<string, string> | undefined> {
    if (!serverDef.configFields) {
      return {};
    }

    const config: Record<string, string> = {};

    for (const field of serverDef.configFields) {
      const value = await vscode.window.showInputBox({
        title: `Configure ${serverDef.name}`,
        prompt: field.description,
        placeHolder: field.required ? `${field.name} (required)` : field.name,
        password:
          field.name.toLowerCase().includes('token') ||
          field.name.toLowerCase().includes('secret') ||
          field.name.toLowerCase().includes('key'),
        value: field.default?.toString(),
        validateInput: (input) => {
          if (field.required && !input) {
            return `${field.name} is required`;
          }
          return undefined;
        },
      });

      if (value === undefined) {
        return undefined; // User cancelled
      }

      if (value) {
        config[field.name] = value;
      } else if (field.default !== undefined) {
        config[field.name] = field.default.toString();
      }
    }

    return config;
  }

  /**
   * Detect locally installed MCP servers
   */
  async detectLocalServers(): Promise<MCPServerDefinition[]> {
    const detected: MCPServerDefinition[] = [];

    // Check for globally installed npm packages
    const globalNpmPath = await this.getGlobalNpmPath();
    if (globalNpmPath) {
      for (const server of this.knownServers) {
        if (server.command === 'npx' && server.args?.[1]) {
          const packageName = server.args[1];
          const packagePath = path.join(globalNpmPath, 'node_modules', packageName);

          try {
            if (fs.existsSync(packagePath)) {
              detected.push({
                ...server,
                description: `${server.description} (installed)`,
              });
            }
          } catch {
            // Ignore access errors
          }
        }
      }
    }

    return detected;
  }

  /**
   * Get global npm path
   */
  private async getGlobalNpmPath(): Promise<string | undefined> {
    try {
      // This is a simplified check - in production you'd run `npm root -g`
      const homeDir = process.env.HOME || process.env.USERPROFILE || '';
      const possiblePaths = [
        path.join(homeDir, '.npm-global'),
        path.join(homeDir, 'npm'),
        '/usr/local/lib/node_modules',
        '/usr/lib/node_modules',
      ];

      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          return p;
        }
      }
    } catch {
      // Ignore errors
    }
    return undefined;
  }

  /**
   * Export MCP configuration to JSON file
   */
  async exportConfiguration(): Promise<void> {
    try {
      const configManager = ConfigManager.getInstance();
      const servers = configManager.getMCPServers();

      if (servers.length === 0) {
        vscode.window.showWarningMessage('No MCP servers configured to export.');
        return;
      }

      const config = {
        mcpServers: servers.reduce(
          (acc, server) => {
            acc[server.name] = {
              command: server.command,
              args: server.args || [],
              env: server.env || {},
            };
            return acc;
          },
          {} as Record<string, { command: string; args: string[]; env: Record<string, string> }>
        ),
      };

      const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file('mcp-config.json'),
        filters: { JSON: ['json'] },
      });

      if (uri) {
        await vscode.workspace.fs.writeFile(uri, Buffer.from(JSON.stringify(config, null, 2)));
        vscode.window.showInformationMessage(`MCP configuration exported to ${uri.fsPath}`);
      }
    } catch (error) {
      log.error('Failed to export MCP configuration', error);
      vscode.window.showErrorMessage('Failed to export MCP configuration');
    }
  }

  /**
   * Import MCP configuration from JSON file
   */
  async importConfiguration(): Promise<void> {
    try {
      const uris = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters: { JSON: ['json'] },
        openLabel: 'Import MCP Configuration',
      });

      if (!uris || uris.length === 0) {
        return;
      }

      const content = await vscode.workspace.fs.readFile(uris[0]);
      const config = JSON.parse(new TextDecoder().decode(content));

      if (!config.mcpServers || typeof config.mcpServers !== 'object') {
        vscode.window.showErrorMessage('Invalid MCP configuration file format');
        return;
      }

      const configManager = ConfigManager.getInstance();
      let importedCount = 0;

      for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
        const server = serverConfig as {
          command: string;
          args?: string[];
          env?: Record<string, string>;
        };
        await configManager.addMCPServer({
          name,
          command: server.command,
          args: server.args || [],
          env: server.env,
          enabled: true,
        });
        importedCount++;
      }

      vscode.window.showInformationMessage(
        `Imported ${importedCount} MCP server${importedCount !== 1 ? 's' : ''} successfully!`
      );
    } catch (error) {
      log.error('Failed to import MCP configuration', error);
      vscode.window.showErrorMessage('Failed to import MCP configuration');
    }
  }
}

// Export singleton getter
export function getMCPDiscoveryService(): MCPDiscoveryService {
  return MCPDiscoveryService.getInstance();
}
