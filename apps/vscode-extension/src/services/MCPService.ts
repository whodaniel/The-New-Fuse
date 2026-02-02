/**
 * The New Fuse VSCode Extension - MCP Service
 * Version 9.0.0 - Clean Architecture
 *
 * Model Context Protocol (MCP) connection management
 */

import * as vscode from 'vscode';
import { ConfigManager } from '../core/config';
import { MCPConnection, MCPResource, MCPServerConfig, MCPTool } from '../core/types';
import { generateId } from '../utils/helpers';
import { log } from '../utils/logger';
import { Client } from '../vendor/modelcontextprotocol-sdk-dereferenced/dist/esm/client/index.js';
import { StdioClientTransport } from '../vendor/modelcontextprotocol-sdk-dereferenced/dist/esm/client/stdio.js';

/**
 * MCP Service for managing Model Context Protocol connections
 */
export class MCPService {
  private static instance: MCPService;
  private connections = new Map<string, MCPConnectionState>();
  private onConnectionChangeCallbacks: ((connections: MCPConnection[]) => void)[] = [];

  private constructor() {}

  static getInstance(): MCPService {
    if (!MCPService.instance) {
      MCPService.instance = new MCPService();
    }
    return MCPService.instance;
  }

  async initialize(): Promise<void> {
    log.info('Initializing MCP Service');

    const config = ConfigManager.getInstance();
    const servers = config.getMCPServers();

    // Auto-connect to enabled servers
    for (const server of servers.filter((s) => s.enabled)) {
      try {
        await this.connect(server);
      } catch (error) {
        log.error(`Failed to connect to MCP server: ${server.name}`, error);
      }
    }

    log.info(`MCP Service initialized with ${this.connections.size} connections`);
  }

  /**
   * Connect to an MCP server
   */
  async connect(serverConfig: MCPServerConfig): Promise<MCPConnection> {
    const connectionId = generateId();

    log.info(`Connecting to MCP server: ${serverConfig.name}`);

    // Create initial connection state
    const state: MCPConnectionState = {
      id: connectionId,
      config: serverConfig,
      status: 'connecting',
      client: null,
      transport: null,
      tools: [],
      resources: [],
    };

    this.connections.set(connectionId, state);
    this.notifyConnectionChange();

    try {
      // Create transport
      const transport = new StdioClientTransport({
        command: serverConfig.command,
        args: serverConfig.args || [],
        env: serverConfig.env,
      });

      // Create client
      const client = new Client({
        name: 'the-new-fuse-vscode',
        version: '9.0.0',
      });

      // Connect
      await client.connect(transport);

      // List available tools
      const toolsResult = await client.listTools();

      // Apply defer_loading based on server configuration
      const allTools: MCPTool[] = toolsResult.tools.map((t) => ({
        name: t.name,
        description: t.description || '',
        inputSchema: t.inputSchema as Record<string, unknown>,
        // Tool Discovery Protocol: Apply deferral based on config
        defer_loading: this.shouldDeferTool(t.name, serverConfig),
        always_load: this.shouldAlwaysLoad(t.name, serverConfig),
      }));

      // Separate active (non-deferred) tools from deferred tools
      const activeTools = allTools.filter((t) => !t.defer_loading || t.always_load);
      const deferredTools = allTools.filter((t) => t.defer_loading && !t.always_load);

      // List available resources
      let resources: MCPResource[] = [];
      try {
        const resourcesResult = await client.listResources();
        resources = resourcesResult.resources.map((r) => ({
          uri: r.uri,
          name: r.name,
          mimeType: r.mimeType,
          description: r.description,
        }));
      } catch {
        // Resources might not be supported
        log.debug('Resources not available for this MCP server');
      }

      // Update state with Tool Discovery Protocol support
      state.client = client;
      state.transport = transport;
      state.status = 'connected';
      state.tools = activeTools; // Only active tools loaded initially
      state.deferredTools = deferredTools; // Deferred tools for lazy loading
      state.allTools = allTools; // All tools for reference
      state.resources = resources;

      log.info(`Connected to MCP server: ${serverConfig.name}`, {
        activeTools: activeTools.length,
        deferredTools: deferredTools.length,
        totalTools: allTools.length,
        resources: resources.length,
      });

      this.notifyConnectionChange();

      return this.toMCPConnection(state);
    } catch (error) {
      state.status = 'error';
      state.lastError = (error as Error).message;
      this.notifyConnectionChange();
      throw error;
    }
  }

  /**
   * Disconnect from an MCP server
   */
  async disconnect(connectionId: string): Promise<void> {
    const state = this.connections.get(connectionId);
    if (!state) {
      throw new Error(`Connection not found: ${connectionId}`);
    }

    log.info(`Disconnecting from MCP server: ${state.config.name}`);

    try {
      if (state.client) {
        await state.client.close();
      }
    } catch (error) {
      log.warn(`Error closing MCP connection: ${(error as Error).message}`);
    }

    this.connections.delete(connectionId);
    this.notifyConnectionChange();
  }

  /**
   * Disconnect all MCP servers
   */
  async disconnectAll(): Promise<void> {
    const connectionIds = Array.from(this.connections.keys());
    for (const id of connectionIds) {
      await this.disconnect(id).catch(() => {});
    }
  }

  /**
   * Get all connections
   */
  getConnections(): MCPConnection[] {
    return Array.from(this.connections.values()).map((s) => this.toMCPConnection(s));
  }

  /**
   * Get a specific connection
   */
  getConnection(connectionId: string): MCPConnection | undefined {
    const state = this.connections.get(connectionId);
    return state ? this.toMCPConnection(state) : undefined;
  }

  /**
   * Execute a tool on an MCP server
   */
  async executeTool(
    connectionId: string,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    const state = this.connections.get(connectionId);
    if (!state || !state.client) {
      throw new Error(`Connection not found or not connected: ${connectionId}`);
    }

    log.debug(`Executing MCP tool: ${toolName}`, { connectionId, args });

    const result = await state.client.callTool({
      name: toolName,
      arguments: args,
    });

    return result;
  }

  /**
   * Read a resource from an MCP server
   */
  async readResource(connectionId: string, uri: string): Promise<string> {
    const state = this.connections.get(connectionId);
    if (!state || !state.client) {
      throw new Error(`Connection not found or not connected: ${connectionId}`);
    }

    log.debug(`Reading MCP resource: ${uri}`, { connectionId });

    const result = await state.client.readResource({ uri });

    // Return the first content item's text
    if (result.contents && result.contents.length > 0) {
      const content = result.contents[0];
      if ('text' in content) {
        return content.text;
      }
    }

    return '';
  }

  /**
   * Get all available tools across all connections (active tools only)
   */
  getAllTools(): (MCPTool & { connectionId: string; serverName: string })[] {
    const tools: (MCPTool & { connectionId: string; serverName: string })[] = [];

    for (const [id, state] of this.connections) {
      if (state.status === 'connected') {
        for (const tool of state.tools) {
          tools.push({
            ...tool,
            connectionId: id,
            serverName: state.config.name,
          });
        }
      }
    }

    return tools;
  }

  /**
   * Get all deferred tools across all connections
   * Tool Discovery Protocol: These tools are loaded lazily via search
   */
  getAllDeferredTools(): (MCPTool & { connectionId: string; serverName: string })[] {
    const tools: (MCPTool & { connectionId: string; serverName: string })[] = [];

    for (const [id, state] of this.connections) {
      if (state.status === 'connected' && state.deferredTools) {
        for (const tool of state.deferredTools) {
          tools.push({
            ...tool,
            connectionId: id,
            serverName: state.config.name,
          });
        }
      }
    }

    return tools;
  }

  /**
   * Get all tools (active + deferred) across all connections
   */
  getAllToolsIncludingDeferred(): (MCPTool & { connectionId: string; serverName: string })[] {
    const tools: (MCPTool & { connectionId: string; serverName: string })[] = [];

    for (const [id, state] of this.connections) {
      if (state.status === 'connected' && state.allTools) {
        for (const tool of state.allTools) {
          tools.push({
            ...tool,
            connectionId: id,
            serverName: state.config.name,
          });
        }
      }
    }

    return tools;
  }

  /**
   * Load a deferred tool on demand (move from deferred to active)
   * Tool Discovery Protocol: Called when tool_search returns a tool_reference
   */
  async loadDeferredTool(connectionId: string, toolName: string): Promise<MCPTool | null> {
    const state = this.connections.get(connectionId);
    if (!state || !state.deferredTools) {
      return null;
    }

    const toolIndex = state.deferredTools.findIndex((t) => t.name === toolName);
    if (toolIndex === -1) {
      return null;
    }

    // Move tool from deferred to active
    const tool = state.deferredTools[toolIndex];
    tool.defer_loading = false; // Mark as now loaded
    state.tools.push(tool);
    state.deferredTools.splice(toolIndex, 1);

    log.info(`Loaded deferred tool: ${toolName} from ${state.config.name}`);
    this.notifyConnectionChange();

    return tool;
  }

  /**
   * Load multiple deferred tools by name
   * Tool Discovery Protocol: Bulk load after tool_search
   */
  async loadDeferredTools(toolNames: string[]): Promise<MCPTool[]> {
    const loadedTools: MCPTool[] = [];

    for (const [connectionId, state] of this.connections) {
      if (state.status === 'connected' && state.deferredTools) {
        for (const name of toolNames) {
          const tool = await this.loadDeferredTool(connectionId, name);
          if (tool) {
            loadedTools.push(tool);
          }
        }
      }
    }

    return loadedTools;
  }

  /**
   * Determine if a tool should be deferred based on server config
   */
  private shouldDeferTool(toolName: string, config: MCPServerConfig): boolean {
    // Check if tool is in always-loaded list
    if (config.always_loaded_tools?.includes(toolName)) {
      return false;
    }

    // Apply default deferral setting (defaults to false if not specified)
    return config.default_defer_loading ?? false;
  }

  /**
   * Determine if a tool should always be loaded
   */
  private shouldAlwaysLoad(toolName: string, config: MCPServerConfig): boolean {
    return config.always_loaded_tools?.includes(toolName) ?? false;
  }

  /**
   * Subscribe to connection changes
   */
  onConnectionChange(callback: (connections: MCPConnection[]) => void): vscode.Disposable {
    this.onConnectionChangeCallbacks.push(callback);
    return {
      dispose: () => {
        const index = this.onConnectionChangeCallbacks.indexOf(callback);
        if (index >= 0) {
          this.onConnectionChangeCallbacks.splice(index, 1);
        }
      },
    };
  }

  private notifyConnectionChange(): void {
    const connections = this.getConnections();
    for (const callback of this.onConnectionChangeCallbacks) {
      try {
        callback(connections);
      } catch (error) {
        log.error('Error in connection change callback', error);
      }
    }
  }

  private toMCPConnection(state: MCPConnectionState): MCPConnection {
    return {
      id: state.id,
      name: state.config.name,
      status: state.status,
      tools: state.tools,
      resources: state.resources,
      lastError: state.lastError,
    };
  }

  /**
   * Show MCP server picker
   */
  async showServerPicker(): Promise<void> {
    const config = ConfigManager.getInstance();
    const servers = config.getMCPServers();
    const connections = this.getConnections();

    const items: vscode.QuickPickItem[] = [
      { label: '$(add) Add New MCP Server', description: 'Configure a new MCP server' },
      { label: '', kind: vscode.QuickPickItemKind.Separator },
    ];

    for (const server of servers) {
      const connection = connections.find((c) => c.name === server.name);
      const status = connection?.status || 'disconnected';
      const icon =
        status === 'connected'
          ? '$(check)'
          : status === 'connecting'
            ? '$(sync~spin)'
            : '$(circle-slash)';

      items.push({
        label: `${icon} ${server.name}`,
        description: status,
        detail: `${server.command} ${(server.args || []).join(' ')}`,
      });
    }

    const selection = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select an MCP server to manage',
      title: 'MCP Server Management',
    });

    if (!selection) {
      return;
    }

    if (selection.label.includes('Add New')) {
      await this.showAddServerDialog();
    } else {
      const serverName = selection.label.replace(/^\$\([^)]+\)\s*/, '');
      await this.showServerActions(serverName);
    }
  }

  private async showAddServerDialog(): Promise<void> {
    const name = await vscode.window.showInputBox({
      prompt: 'Enter server name',
      placeHolder: 'my-mcp-server',
    });
    if (!name) {
      return;
    }

    const command = await vscode.window.showInputBox({
      prompt: 'Enter command to start the server',
      placeHolder: 'npx @modelcontextprotocol/server-filesystem',
    });
    if (!command) {
      return;
    }

    const argsInput = await vscode.window.showInputBox({
      prompt: 'Enter arguments (space-separated, optional)',
      placeHolder: '/path/to/directory',
    });

    const args = argsInput ? argsInput.split(' ').filter((a) => a) : [];

    const serverConfig: MCPServerConfig = {
      name,
      command,
      args,
      enabled: true,
    };

    const config = ConfigManager.getInstance();
    await config.addMCPServer(serverConfig);

    const connect = await vscode.window.showInformationMessage(
      `MCP server "${name}" added. Connect now?`,
      'Connect',
      'Later'
    );

    if (connect === 'Connect') {
      await this.connect(serverConfig);
    }
  }

  private async showServerActions(serverName: string): Promise<void> {
    const connections = this.getConnections();
    const connection = connections.find((c) => c.name === serverName);
    const isConnected = connection?.status === 'connected';

    const actions = isConnected
      ? ['Disconnect', 'View Tools', 'View Resources', 'Remove']
      : ['Connect', 'Remove'];

    const action = await vscode.window.showQuickPick(actions, {
      placeHolder: `Actions for ${serverName}`,
    });

    if (!action) {
      return;
    }

    const config = ConfigManager.getInstance();
    const servers = config.getMCPServers();
    const serverConfig = servers.find((s) => s.name === serverName);

    switch (action) {
      case 'Connect':
        if (serverConfig) {
          await vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: `Connecting to ${serverName}...`,
            },
            () => this.connect(serverConfig)
          );
          vscode.window.showInformationMessage(`Connected to ${serverName}`);
        }
        break;

      case 'Disconnect':
        if (connection) {
          await this.disconnect(connection.id);
          vscode.window.showInformationMessage(`Disconnected from ${serverName}`);
        }
        break;

      case 'View Tools':
        if (connection?.tools) {
          const toolItems = connection.tools.map((t) => ({
            label: t.name,
            description: t.description,
          }));
          await vscode.window.showQuickPick(toolItems, {
            placeHolder: `Tools available in ${serverName}`,
          });
        }
        break;

      case 'View Resources':
        if (connection?.resources) {
          const resourceItems = connection.resources.map((r) => ({
            label: r.name,
            description: r.uri,
          }));
          await vscode.window.showQuickPick(resourceItems, {
            placeHolder: `Resources available in ${serverName}`,
          });
        }
        break;

      case 'Remove': {
        const confirm = await vscode.window.showWarningMessage(
          `Remove ${serverName}?`,
          'Remove',
          'Cancel'
        );
        if (confirm === 'Remove') {
          if (connection) {
            await this.disconnect(connection.id);
          }
          await config.removeMCPServer(serverName);
          vscode.window.showInformationMessage(`Removed ${serverName}`);
        }
        break;
      }
    }
  }
}

interface MCPConnectionState {
  id: string;
  config: MCPServerConfig;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  client: Client | null;
  transport: StdioClientTransport | null;
  tools: MCPTool[]; // Active (non-deferred) tools
  resources: MCPResource[];
  lastError?: string;
  // Tool Discovery Protocol support
  deferredTools?: MCPTool[]; // Tools marked for lazy loading
  allTools?: MCPTool[]; // All tools (active + deferred)
}

// Export singleton getter
export function getMCPService(): MCPService {
  return MCPService.getInstance();
}
