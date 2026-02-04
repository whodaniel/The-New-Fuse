#!/usr/bin/env node

/**
 * The New Fuse MCP Configuration Manager
 * Universal MCP configuration management service as part of TNF core
 * Supports local and network MCP clients + TNF Agent builder integration
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

interface MCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
  description?: string;
  tags?: string[];
  priority?: number;
  managed_by?: string;
  capabilities?: string[];
  enabled?: boolean;
  health_status?: 'healthy' | 'unhealthy' | 'unknown';
}

interface TNFMCPConfig {
  version?: string;
  servers?: Record<string, MCPServerConfig>;
  mcpServers?: Record<string, MCPServerConfig>;
  metadata?: {
    managed_by: string;
    last_updated: string;
    client_type?: string;
    tnf_integration: boolean;
  };
}

class TNFMCPConfigManager {
  private server: Server;
  private tnfCorePath: string;

  constructor() {
    this.server = new Server(
      {
        name: 'tnf-mcp-config-manager',
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.tnfCorePath = process.env.TNF_CORE_PATH || path.join(process.cwd(), 'data');
    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[TNF MCP Config Manager]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'list_mcp_servers',
          description: 'List MCP servers from any config (TNF, Claude Desktop, custom)',
          inputSchema: {
            type: 'object',
            properties: {
              config_path: {
                type: 'string',
                description: 'Path to config file. If not provided, searches common locations',
              },
              client_type: {
                type: 'string',
                enum: ['tnf', 'claude-desktop', 'custom'],
                description: 'Type of MCP client configuration',
              },
              include_health: { type: 'boolean', default: true },
              include_tnf_managed: { type: 'boolean', default: true },
            },
          },
        },
        {
          name: 'add_mcp_server',
          description: 'Add/update MCP server to any client config or TNF registry',
          inputSchema: {
            type: 'object',
            properties: {
              config_path: { type: 'string', description: 'Target config file path' },
              client_type: { type: 'string', enum: ['tnf', 'claude-desktop', 'custom'] },
              name: { type: 'string', description: 'Server name' },
              command: { type: 'string', description: 'Command to run server' },
              args: { type: 'array', items: { type: 'string' } },
              env: { type: 'object', description: 'Environment variables' },
              description: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } },
              priority: { type: 'number', minimum: 1, maximum: 10 },
              tnf_integration: { type: 'boolean', default: false },
              agent_builder_compatible: { type: 'boolean', default: false },
            },
            required: ['name', 'command'],
          },
        },
        {
          name: 'remove_mcp_server',
          description: 'Remove MCP server from config with backup',
          inputSchema: {
            type: 'object',
            properties: {
              config_path: { type: 'string' },
              client_type: { type: 'string', enum: ['tnf', 'claude-desktop', 'custom'] },
              name: { type: 'string' },
              create_backup: { type: 'boolean', default: true },
            },
            required: ['name'],
          },
        },
        {
          name: 'generate_client_config',
          description: 'Generate MCP config for specific client type from TNF registry',
          inputSchema: {
            type: 'object',
            properties: {
              client_type: { type: 'string', enum: ['claude-desktop', 'custom'] },
              output_path: { type: 'string' },
              include_servers: { type: 'array', items: { type: 'string' } },
              tnf_passthrough: { type: 'boolean', default: true },
              network_config: {
                type: 'object',
                properties: {
                  host: { type: 'string', default: 'localhost' },
                  port: { type: 'number', default: 3001 },
                },
              },
            },
            required: ['client_type'],
          },
        },
        {
          name: 'sync_with_tnf_registry',
          description: 'Sync external client config with TNF core registry',
          inputSchema: {
            type: 'object',
            properties: {
              config_path: { type: 'string' },
              direction: { type: 'string', enum: ['to_tnf', 'from_tnf', 'bidirectional'] },
              merge_strategy: { type: 'string', enum: ['replace', 'merge', 'preserve_local'] },
            },
          },
        },
        {
          name: 'validate_config',
          description: 'Validate MCP configuration and suggest TNF optimizations',
          inputSchema: {
            type: 'object',
            properties: {
              config_path: { type: 'string' },
              check_tnf_compatibility: { type: 'boolean', default: true },
              suggest_agent_builder_integration: { type: 'boolean', default: true },
            },
          },
        },
        {
          name: 'get_tnf_passthrough_config',
          description: 'Get config for connecting to TNF as primary MCP server with passthrough',
          inputSchema: {
            type: 'object',
            properties: {
              client_type: { type: 'string', enum: ['claude-desktop', 'custom'] },
              tnf_endpoint: { type: 'string', default: 'http://localhost:3001' },
              include_direct_servers: { type: 'boolean', default: false },
            },
            required: ['client_type'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'list_mcp_servers':
            return await this.listMCPServers(args);
          case 'add_mcp_server':
            return await this.addMCPServer(args);
          case 'remove_mcp_server':
            return await this.removeMCPServer(args);
          case 'generate_client_config':
            return await this.generateClientConfig(args);
          case 'sync_with_tnf_registry':
            return await this.syncWithTNFRegistry(args);
          case 'validate_config':
            return await this.validateConfig(args);
          case 'get_tnf_passthrough_config':
            return await this.getTNFPassthroughConfig(args);
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${errorMessage}`);
      }
    });
  }

  private async listMCPServers(
    args: any
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { config_path, client_type, include_health = true, include_tnf_managed = true } = args;

    const configPath = this.resolveConfigPath(config_path, client_type);
    const config = await this.loadConfig(configPath);

    const servers = config.mcpServers || config.servers || {};
    const serverList = await Promise.all(
      Object.entries(servers).map(async ([name, serverConfig]) => ({
        name,
        ...serverConfig,
        managed_by_tnf: serverConfig.managed_by === 'tnf-core',
        health_status: include_health
          ? await this.checkServerHealth(name, serverConfig)
          : 'unknown',
      }))
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              config_path: configPath,
              client_type: this.detectClientType(config),
              tnf_integration: config.metadata?.tnf_integration || false,
              server_count: serverList.length,
              servers: serverList,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async addMCPServer(
    args: any
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const {
      config_path,
      client_type,
      name,
      command,
      args: serverArgs = [],
      env = {},
      description = '',
      tags = [],
      priority = 5,
      tnf_integration = false,
      agent_builder_compatible = false,
    } = args;

    const configPath = this.resolveConfigPath(config_path, client_type);
    const config = await this.loadConfig(configPath);

    // Prepare server configuration
    const serverConfig: MCPServerConfig = {
      command,
      args: serverArgs,
      env,
      description,
      tags: [
        ...tags,
        ...(tnf_integration ? ['tnf-integrated'] : []),
        ...(agent_builder_compatible ? ['agent-builder'] : []),
      ],
      priority,
      managed_by: 'tnf-mcp-config-manager',
      enabled: true,
    };

    // Add to appropriate section based on client type
    const serversSection = config.mcpServers || config.servers || {};
    serversSection[name] = serverConfig;

    if (config.mcpServers) {
      config.mcpServers = serversSection;
    } else {
      config.servers = serversSection;
    }

    // Update metadata
    config.metadata = {
      ...config.metadata,
      managed_by: 'tnf-mcp-config-manager',
      last_updated: new Date().toISOString(),
      tnf_integration: tnf_integration || config.metadata?.tnf_integration || false,
    };

    await this.saveConfig(configPath, config);

    return {
      content: [
        {
          type: 'text',
          text: `MCP server '${name}' added successfully to ${configPath}\n\nConfiguration:\n${JSON.stringify(serverConfig, null, 2)}\n\nNext steps:\n- Restart your MCP client to activate the server\n- Use 'validate_config' to verify setup\n${tnf_integration ? '- Server is configured for TNF integration\n' : ''}${agent_builder_compatible ? '- Server is compatible with TNF Agent Builder\n' : ''}`,
        },
      ],
    };
  }

  private async removeMCPServer(
    args: any
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { config_path, client_type, name, create_backup = true } = args;

    const configPath = this.resolveConfigPath(config_path, client_type);
    const config = await this.loadConfig(configPath);

    if (create_backup) {
      const backupPath = `${configPath}.backup.${Date.now()}`;
      await fs.promises.writeFile(backupPath, JSON.stringify(config, null, 2));
    }

    const serversSection = config.mcpServers || config.servers || {};
    if (!serversSection[name]) {
      throw new Error(`Server '${name}' not found in configuration`);
    }

    delete serversSection[name];
    await this.saveConfig(configPath, config);

    return {
      content: [
        {
          type: 'text',
          text: `MCP server '${name}' removed from ${configPath}${create_backup ? `\nBackup created at ${configPath}.backup.${Date.now()}` : ''}\n\nRestart your MCP client to deactivate the server.`,
        },
      ],
    };
  }

  private async generateClientConfig(
    args: any
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const {
      client_type,
      output_path,
      include_servers = [],
      tnf_passthrough = true,
      network_config = { host: 'localhost', port: 3001 },
    } = args;

    // Load TNF registry
    const tnfConfig = await this.loadConfig(path.join(this.tnfCorePath, 'mcp_config.json'));

    let clientConfig: any = {};

    if (client_type === 'claude-desktop') {
      clientConfig = { mcpServers: {} };

      if (tnf_passthrough) {
        // Configure TNF as primary server with passthrough
        clientConfig.mcpServers['the-new-fuse'] = {
          command: 'node',
          args: [
            '--import',
            'tsx/esm',
            path.join(this.tnfCorePath, '..', 'src', 'mcp', 'server.ts'),
          ],
          env: {
            TNF_PASSTHROUGH: 'true',
            TNF_HOST: network_config.host,
            TNF_PORT: network_config.port.toString(),
          },
          description: 'The New Fuse MCP Server with passthrough to all registered servers',
        };
      }
    }

    // Add specific servers if requested
    if (include_servers.length > 0) {
      const tnfServers = tnfConfig.mcpServers || tnfConfig.servers || {};
      for (const serverName of include_servers) {
        if (tnfServers[serverName]) {
          clientConfig.mcpServers[serverName] = tnfServers[serverName];
        }
      }
    }

    const configText = JSON.stringify(clientConfig, null, 2);

    if (output_path) {
      await fs.promises.writeFile(output_path, configText);
    }

    return {
      content: [
        {
          type: 'text',
          text: `Generated ${client_type} configuration:\n\n${configText}${output_path ? `\n\nSaved to: ${output_path}` : ''}\n\n${tnf_passthrough ? 'Configuration uses TNF as primary server with passthrough capabilities.' : 'Configuration includes direct server connections.'}`,
        },
      ],
    };
  }

  private async syncWithTNFRegistry(
    args: any
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { config_path, direction = 'bidirectional', merge_strategy = 'merge' } = args;

    const externalConfig = await this.loadConfig(config_path);
    const tnfRegistryPath = path.join(this.tnfCorePath, 'mcp_config.json');
    const tnfConfig = await this.loadConfig(tnfRegistryPath);

    let syncResults: string[] = [];

    if (direction === 'to_tnf' || direction === 'bidirectional') {
      // Sync external config to TNF registry
      const externalServers = externalConfig.mcpServers || externalConfig.servers || {};
      const tnfServers = tnfConfig.mcpServers || tnfConfig.servers || {};

      for (const [name, config] of Object.entries(externalServers)) {
        if (merge_strategy === 'replace' || !tnfServers[name]) {
          tnfServers[name] = { ...config, managed_by: 'synced-from-external' };
          syncResults.push(`Synced '${name}' to TNF registry`);
        }
      }

      tnfConfig.mcpServers = tnfServers;
      await this.saveConfig(tnfRegistryPath, tnfConfig);
    }

    if (direction === 'from_tnf' || direction === 'bidirectional') {
      // Sync TNF registry to external config
      const tnfServers = tnfConfig.mcpServers || tnfConfig.servers || {};
      const externalServers = externalConfig.mcpServers || externalConfig.servers || {};

      for (const [name, config] of Object.entries(tnfServers)) {
        if (merge_strategy === 'replace' || !externalServers[name]) {
          externalServers[name] = config;
          syncResults.push(`Synced '${name}' from TNF registry`);
        }
      }

      externalConfig.mcpServers = externalServers;
      await this.saveConfig(config_path, externalConfig);
    }

    return {
      content: [
        {
          type: 'text',
          text: `Sync completed between ${config_path} and TNF registry:\n\n${syncResults.join('\n')}\n\nDirection: ${direction}\nMerge strategy: ${merge_strategy}`,
        },
      ],
    };
  }

  private async validateConfig(
    args: any
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const {
      config_path,
      check_tnf_compatibility = true,
      suggest_agent_builder_integration = true,
    } = args;

    const configPath = this.resolveConfigPath(config_path);
    const config = await this.loadConfig(configPath);

    const issues: string[] = [];
    const suggestions: string[] = [];

    const servers = config.mcpServers || config.servers || {};

    for (const [name, serverConfig] of Object.entries(servers)) {
      // Check if command exists
      try {
        // Basic validation
        if (!serverConfig.command) {
          issues.push(`Server '${name}': Missing command`);
        }
      } catch (error) {
        issues.push(`Server '${name}': Command validation failed`);
      }

      if (check_tnf_compatibility) {
        if (!serverConfig.tags?.includes('tnf-integrated')) {
          suggestions.push(`Server '${name}': Consider adding TNF integration`);
        }
      }

      if (suggest_agent_builder_integration) {
        if (!serverConfig.tags?.includes('agent-builder')) {
          suggestions.push(`Server '${name}': Consider enabling Agent Builder compatibility`);
        }
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: `Configuration validation for ${configPath}:\n\n${issues.length > 0 ? `Issues:\n${issues.join('\n')}\n\n` : ''}${suggestions.length > 0 ? `Suggestions:\n${suggestions.join('\n')}\n\n` : ''}${issues.length === 0 ? 'Configuration is valid!' : ''}`,
        },
      ],
    };
  }

  private async getTNFPassthroughConfig(
    args: any
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const {
      client_type,
      tnf_endpoint = 'http://localhost:3001',
      include_direct_servers = false,
    } = args;

    const passthroughConfig: any = {};

    if (client_type === 'claude-desktop') {
      passthroughConfig.mcpServers = {
        'the-new-fuse-main': {
          command: 'node',
          args: [
            '--import',
            'tsx/esm',
            path.join(this.tnfCorePath, '..', 'src', 'mcp', 'server.ts'),
          ],
          env: {
            TNF_PASSTHROUGH_MODE: 'true',
            TNF_ENDPOINT: tnf_endpoint,
            NODE_ENV: 'development',
          },
          description: 'The New Fuse MCP Server - Passthrough to all TNF registered servers',
        },
      };

      if (include_direct_servers) {
        // Add filesystem and other core servers directly
        passthroughConfig.mcpServers.filesystem = {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-filesystem', '--allow-dir', this.tnfCorePath],
          description: 'Filesystem access for TNF project',
        };
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: `TNF Passthrough Configuration for ${client_type}:\n\n${JSON.stringify(passthroughConfig, null, 2)}\n\nThis configuration connects to The New Fuse as the primary MCP server, which will provide passthrough access to all registered MCP servers in the TNF ecosystem.\n\nTNF Endpoint: ${tnf_endpoint}\nDirect servers included: ${include_direct_servers}`,
        },
      ],
    };
  }

  private resolveConfigPath(configPath?: string, clientType?: string): string {
    if (configPath) return configPath;

    // Auto-detect common config paths
    if (clientType === 'claude-desktop') {
      return path.join(
        os.homedir(),
        'Library',
        'Application Support',
        'Claude',
        'claude_desktop_config.json'
      );
    }

    if (clientType === 'tnf') {
      return path.join(this.tnfCorePath, 'mcp_config.json');
    }

    // Default to TNF config
    return path.join(this.tnfCorePath, 'mcp_config.json');
  }

  private async loadConfig(configPath: string): Promise<TNFMCPConfig> {
    try {
      const content = await fs.promises.readFile(configPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // Create default config if file doesn't exist
        const defaultConfig: TNFMCPConfig = {
          version: '2.0.0',
          mcpServers: {},
          metadata: {
            managed_by: 'tnf-mcp-config-manager',
            last_updated: new Date().toISOString(),
            tnf_integration: true,
          },
        };
        await this.saveConfig(configPath, defaultConfig);
        return defaultConfig;
      }
      throw error;
    }
  }

  private async saveConfig(configPath: string, config: TNFMCPConfig): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(configPath);
    await fs.promises.mkdir(dir, { recursive: true });

    // Update metadata
    config.metadata = {
      managed_by: 'tnf-mcp-config-manager',
      tnf_integration: false,
      ...config.metadata,
      last_updated: new Date().toISOString(),
    };

    await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2));
  }

  private detectClientType(config: TNFMCPConfig): string {
    if (config.mcpServers && !config.servers) return 'claude-desktop';
    if (config.servers && !config.mcpServers) return 'custom';
    if (config.metadata?.tnf_integration) return 'tnf';
    return 'unknown';
  }

  private async checkServerHealth(name: string, config: MCPServerConfig): Promise<string> {
    // Basic health check - could be expanded
    try {
      if (
        fs.existsSync(config.command) ||
        config.command.startsWith('npx') ||
        config.command === 'node'
      ) {
        return 'healthy';
      }
      return 'unhealthy';
    } catch {
      return 'unknown';
    }
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('TNF MCP Configuration Manager running on stdio');
  }
}

const manager = new TNFMCPConfigManager();
manager.run().catch(console.error);
