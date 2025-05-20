import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../core/logging.js';
import { MCPClient } from './mcp-client.js';
import { MCPServer, MCPServerConfig, MCPTool, MCPManager } from '../types/mcp.js';
import { BrowserMCPServerManager } from './browser-mcp-server.js';
import { WebSearchMCPServerManager } from './web-search-mcp-server.js';
import { getErrorMessage } from '../utils/error-utils.js';
export class MCPManagerImpl implements vscode.Disposable, MCPManager {
  private servers: Map<string, MCPServer> = new Map();
  private clients: Map<string, MCPClient> = new Map();
  private logger: Logger;
  private context: vscode.ExtensionContext;
  private browserMCPManager: BrowserMCPServerManager;
  private webSearchMCPManager: WebSearchMCPServerManager;
  private statusBarItem: vscode.StatusBarItem;
  private mcpServerChooser: MCPServerQuickPick;
  
  private _onServerAdded = new vscode.EventEmitter<MCPServer>();
  readonly onServerAdded = this._onServerAdded.event;
  
  private _onServerRemoved = new vscode.EventEmitter<string>();
  readonly onServerRemoved = this._onServerRemoved.event;
  
  private _onServerUpdated = new vscode.EventEmitter<MCPServer>();
  readonly onServerUpdated = this._onServerUpdated.event;
  
  private _onActiveServerChanged = new vscode.EventEmitter<MCPServer | undefined>();
  readonly onActiveServerChanged = this._onActiveServerChanged.event;
  
  private activeServerId: string | undefined;
  private _initialized = false;
  
  constructor(context: vscode.ExtensionContext, logger: Logger) {
    this.context = context;
    this.logger = logger;
    this.browserMCPManager = new BrowserMCPServerManager(logger);
    
    // Create status bar item
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.statusBarItem.command = 'thefuse.selectMCPServer';
    context.subscriptions.push(this.statusBarItem);
    
    // Create MCP server chooser
    this.mcpServerChooser = new MCPServerQuickPick(this);
    
    // Register commands
    context.subscriptions.push(
      vscode.commands.registerCommand('thefuse.selectMCPServer', this.showServerPicker.bind(this)),
      vscode.commands.registerCommand('thefuse.addMCPServer', this.showAddServerDialog.bind(this)),
      vscode.commands.registerCommand('thefuse.removeMCPServer', this.showRemoveServerDialog.bind(this)),
      vscode.commands.registerCommand('thefuse.connectMCPServer', this.showConnectDialog.bind(this)),
      vscode.commands.registerCommand('thefuse.disconnectMCPServer', this.showDisconnectDialog.bind(this)),
      vscode.commands.registerCommand('thefuse.refreshMCPServer', this.refreshServerConfig.bind(this)),
      vscode.commands.registerCommand('thefuse.executeMCPTool', this.showExecuteToolDialog.bind(this))
    );
    
    // Show the status bar item
    this.updateStatusBar();
    this.statusBarItem.show();
  }
  
  /**
   * Initialize built-in MCP servers
   */
  private async discoverBuiltInServers(): Promise<void> {
    this.log('Discovering built-in MCP servers');
    
    try {
      // Check for the context7 MCP server built into Copilot
      await this.discoverContext7Server();
      
      // Discover any other known MCP servers
      await this.discoverNetworkServers();
    } catch (error) {
      this.log(`Error discovering built-in servers: ${getErrorMessage(error)}`);
    }
  }
  
  /**
   * Discover the Context7 MCP server built into Copilot
   */
  private async discoverContext7Server(): Promise<void> {
    try {
      // Check if Copilot extension is available
      const copilotExtension = vscode.extensions.getExtension('GitHub.copilot');
      if (!copilotExtension) {
        this.log('GitHub Copilot extension not found, skipping Context7 discovery');
        return;
      }
      
      // Check if extension is active
      if (!copilotExtension.isActive) {
        await copilotExtension.activate();
      }
      
      // Get the context7 server URL from Copilot's API
      const context7Url = await this.getContext7Url();
      if (!context7Url) {
        this.log('Context7 server URL not found in Copilot');
        return;
      }
      
      // Register the server
      const serverId = 'copilot-context7';
      const server: MCPServer = {
        id: serverId,
        name: 'Copilot Context7',
        url: context7Url,
        status: 'offline',
        isBuiltIn: true,
        config: {
          version: "1.0",
          tools: [] // Will be populated when connected
        }
      };
      
      this.addServer(server);
      this.log(`Added Copilot Context7 server: ${context7Url}`);
      
      // Try to connect to get the tools
      try {
        await this.connectToServer(serverId);
      } catch (error) {
        this.log(`Failed to connect to Context7 server: ${getErrorMessage(error)}`);
      }
    } catch (error) {
      this.log(`Error discovering Context7 server: ${getErrorMessage(error)}`);
    }
  }
  
  /**
   * Get the Context7 MCP server URL from Copilot
   */
  private async getContext7Url(): Promise<string | undefined> {
    try {
      // Try to execute the Copilot command to get MCP servers
      // Note: This is a theoretical implementation as the actual
      // Copilot API might be different or not publicly accessible
      const result = await vscode.commands.executeCommand('github.copilot.getMCPServers');
      
      if (result && Array.isArray(result) && result.length > 0) {
        const context7Server = result.find((server: any) => 
          server.name === 'context7' || server.id === 'context7'
        );
        
        if (context7Server && context7Server.url) {
          return context7Server.url;
        }
      }
      
      // Fallback to well-known URL patterns used by Copilot
      // These are educated guesses based on common patterns
      return 'ws://localhost:7777/mcp'; // Example URL
    } catch (error) {
      this.log(`Failed to get Context7 URL: ${getErrorMessage(error)}`);
      return undefined;
    }
  }
  
  /**
   * Discover network MCP servers using mDNS or other service discovery
   */
  private async discoverNetworkServers(): Promise<void> {
    // This would be implemented with a service discovery protocol like mDNS
    // For now, it's just a placeholder
    return Promise.resolve();
  }
  
  /**
   * Load saved MCP servers from extension storage
   */
  private loadSavedServers(): void {
    try {
      const savedServers = this.context.globalState.get<MCPServer[]>('thefuse.mcpServers', []);
      
      for (const server of savedServers) {
        if (!this.servers.has(server.id)) {
          this.addServer({
            ...server,
            status: 'offline' // Always start in offline state
          });
        }
      }
      
      // Load active server
      const activeServerId = this.context.globalState.get<string>('thefuse.activeMCPServer');
      if (activeServerId && this.servers.has(activeServerId)) {
        this.setActiveServer(activeServerId);
      } else if (this.servers.size > 0) {
        // Set first server as active if none is saved
        const firstServer = this.servers.values().next().value;
        if (firstServer) { // Add null check
            this.setActiveServer(firstServer.id);
        }
      }
      
      this.log(`Loaded ${savedServers.length} saved MCP servers`);
    } catch (error) {
      this.log(`Error loading saved servers: ${getErrorMessage(error)}`);
    }
  }
  
  /**
   * Save MCP servers to extension storage
   */
  private saveServers(): void {
    try {
      const servers = Array.from(this.servers.values())
        .filter(server => !server.isBuiltIn); // Don't save built-in servers
      
      this.context.globalState.update('thefuse.mcpServers', servers);
      
      if (this.activeServerId) {
        this.context.globalState.update('thefuse.activeMCPServer', this.activeServerId);
      }
      
      this.log(`Saved ${servers.length} MCP servers`);
    } catch (error) {
      this.log(`Error saving servers: ${getErrorMessage(error)}`);
    }
  }
  
  /**
   * Add a new MCP server
   */
  public addServer(server: MCPServer): MCPServer {
    if (this.servers.has(server.id)) {
      throw new Error(`Server with ID ${server.id} already exists`);
    }
    
    this.servers.set(server.id, server);
    
    // Create a client for this server
    const client = new MCPClient(server, this.logger);
    
    // Listen for connection status changes
    client.onConnectionStatusChanged(connected => {
      if (connected) {
        this.refreshServerConfig(server.id);
      }
      this.updateStatusBar();
      this._onServerUpdated.fire(server);
    });
    
    // Listen for server updates
    client.onServerUpdated(updatedServer => {
      this.servers.set(updatedServer.id, updatedServer);
      this._onServerUpdated.fire(updatedServer);
      this.updateStatusBar();
    });
    
    this.clients.set(server.id, client);
    
    // Set as active if this is the first server
    if (this.servers.size === 1) {
      this.setActiveServer(server.id);
    }
    
    // Save servers
    this.saveServers();
    
    // Emit event
    this._onServerAdded.fire(server);
    
    // Update status bar
    this.updateStatusBar();
    
    return server;
  }
  
  /**
   * Remove an MCP server
   */
  public removeServer(serverId: string): boolean {
    const server = this.servers.get(serverId);
    if (!server) {
      return false;
    }
    
    // Don't allow removing built-in servers
    if (server.isBuiltIn) {
      throw new Error(`Cannot remove built-in server: ${server.name}`);
    }
    
    // Disconnect if connected
    const client = this.clients.get(serverId);
    if (client) {
      client.disconnect();
      client.dispose();
      this.clients.delete(serverId);
    }
    
    // Remove server
    this.servers.delete(serverId);
    
    // If this was the active server, select another one
    if (this.activeServerId === serverId) {
      if (this.servers.size > 0) {
        const firstServer = this.servers.values().next().value;
        if (firstServer) { // Add null check
            this.setActiveServer(firstServer.id);
        } else {
            this.setActiveServer(undefined); // Should not happen if size > 0, but safe
        }
      } else {
        this.activeServerId = undefined;
        this._onActiveServerChanged.fire(undefined);
      }
    }
    
    // Save servers
    this.saveServers();
    
    // Emit event
    this._onServerRemoved.fire(serverId);
    
    // Update status bar
    this.updateStatusBar();
    
    return true;
  }
  
  /**
   * Get all registered MCP servers
   */
  public getAllServers(): MCPServer[] {
    return Array.from(this.servers.values());
  }
  
  /**
   * Get a server by ID
   */
  public getServer(serverId: string): MCPServer | undefined {
    return this.servers.get(serverId);
  }
  
  /**
   * Get the active server
   */
  public getActiveServer(): MCPServer | undefined {
    return this.activeServerId ? this.servers.get(this.activeServerId) : undefined;
  }
  
  /**
   * Set the active server
   */
  public setActiveServer(serverId: string | undefined): boolean {
    if (serverId === undefined) {
      this.activeServerId = undefined;
      this._onActiveServerChanged.fire(undefined);
      this.updateStatusBar();
      return true;
    }
    
    const server = this.servers.get(serverId);
    if (!server) {
      return false;
    }
    
    this.activeServerId = serverId;
    
    // Save the active server ID
    this.context.globalState.update('thefuse.activeMCPServer', serverId);
    
    // Emit event
    this._onActiveServerChanged.fire(server);
    
    // Update status bar
    this.updateStatusBar();
    
    return true;
  }
  
  /**
   * Connect to an MCP server by ID
   */
  public async connectToServer(serverId: string): Promise<boolean> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server with ID ${serverId} not found`);
    }
    
    const client = this.clients.get(serverId);
    if (!client) {
      throw new Error(`Client for server ${serverId} not found`);
    }
    
    const connected = await client.connect();
    if (connected) {
      // Refresh server config
      try {
        await this.refreshServerConfig(serverId);
      } catch (error) {
        this.log(`Failed to refresh server config: ${getErrorMessage(error)}`);
      }
    }
    
    return connected;
  }
  
  /**
   * Disconnect from an MCP server by ID
   */
  public disconnectFromServer(serverId: string): void {
    const client = this.clients.get(serverId);
    if (!client) {
      return;
    }
    
    client.disconnect();
  }
  
  /**
   * Refresh the configuration for a server
   */
  public async refreshServerConfig(serverId: string): Promise<MCPServerConfig | undefined> {
    const client = this.clients.get(serverId);
    if (!client) {
      throw new Error(`Client for server ${serverId} not found`);
    }
    
    try {
      const config = await client.getConfig();
      return config;
    } catch (error) {
      this.log(`Failed to refresh server config: ${getErrorMessage(error)}`);
      throw error;
    }
  }
  
  /**
   * Execute a tool on the active MCP server
   */
  public async executeTool(
    serverId: string,
    toolName: string, 
    params: Record<string, any>
  ): Promise<any> {
    const client = this.clients.get(serverId);
    if (!client) {
      throw new Error(`Client for server ${serverId} not found`);
    }
    
    try {
      // Execute tool via WebSocket
      const response = await client.sendMessage({
        type: 'execute_tool',
        tool: toolName,
        params: params
      });
      
      return response.result;
    } catch (error) {
      this.log(`Failed to execute tool ${toolName}: ${getErrorMessage(error)}`);
      throw error;
    }
  }
  
  /**
   * Get tools available on the active server
   */
  public async getTools(serverId?: string): Promise<MCPTool[]> {
    const targetServerId = serverId || this.activeServerId;
    if (!targetServerId) {
      return [];
    }
    
    const client = this.clients.get(targetServerId);
    if (!client) {
      return [];
    }
    
    try {
      return await client.getTools();
    } catch (error) {
      this.log(`Failed to get tools: ${getErrorMessage(error)}`);
      return [];
    }
  }
  
  /**
   * Update the status bar item
   */
  private updateStatusBar(): void {
    const activeServer = this.getActiveServer();
    
    if (activeServer) {
      // Show connection status
      let statusIcon = '$(server)';
      if (activeServer.status === 'online') {
        statusIcon = '$(check)';
      } else if (activeServer.status === 'error') {
        statusIcon = '$(error)';
      }
      
      this.statusBarItem.text = `${statusIcon} MCP: ${activeServer.name}`;
      this.statusBarItem.tooltip = `Active MCP Server: ${activeServer.name} (${activeServer.status})`;
    } else {
      this.statusBarItem.text = '$(server) MCP: None';
      this.statusBarItem.tooltip = 'No active MCP server';
    }
  }
  
  /**
   * Show server picker quick pick
   */
  private async showServerPicker(): Promise<void> {
    const server = await this.mcpServerChooser.pickServer("Select MCP Server");
    if (server) {
      this.setActiveServer(server.id);
    }
  }
  
  /**
   * Show add server dialog
   */
  private async showAddServerDialog(): Promise<void> {
    const name = await vscode.window.showInputBox({
      prompt: 'Enter a name for the MCP server',
      placeHolder: 'e.g. My MCP Server',
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Name is required';
        }
        return null;
      }
    });
    
    if (!name) {
      return;
    }
    
    const url = await vscode.window.showInputBox({
      prompt: 'Enter the WebSocket URL for the MCP server',
      placeHolder: 'e.g. ws://localhost:8765',
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return 'URL is required';
        }
        if (!value.startsWith('ws://') && !value.startsWith('wss://')) {
          return 'URL must start with ws:// or wss://';
        }
        return null;
      }
    });
    
    if (!url) {
      return;
    }
    
    try {
      const serverId = uuidv4();
      const server: MCPServer = {
        id: serverId,
        name,
        url,
        status: 'offline',
        config: {
          version: "1.0",
          tools: []
        }
      };
      
      this.addServer(server);
      
      vscode.window.showInformationMessage(`Added MCP server: ${name}`);
      
      // Ask if the user wants to connect now
      const connect = await vscode.window.showQuickPick(['Yes', 'No'], {
        placeHolder: 'Connect to the server now?'
      });
      
      if (connect === 'Yes') {
        await this.connectToServer(serverId);
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to add MCP server: ${getErrorMessage(error)}`);
    }
  }
  
  /**
   * Show remove server dialog
   */
  private async showRemoveServerDialog(): Promise<void> {
    const server = await this.mcpServerChooser.pickServer("Select MCP Server to Remove");
    if (!server) {
      return;
    }
    
    if (server.isBuiltIn) {
      vscode.window.showWarningMessage(`Cannot remove built-in server: ${server.name}`);
      return;
    }
    
    const confirm = await vscode.window.showQuickPick(['Yes', 'No'], {
      placeHolder: `Are you sure you want to remove ${server.name}?`
    });
    
    if (confirm !== 'Yes') {
      return;
    }
    
    try {
      this.removeServer(server.id);
      vscode.window.showInformationMessage(`Removed MCP server: ${server.name}`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to remove server: ${getErrorMessage(error)}`);
    }
  }
  
  /**
   * Show connect dialog
   */
  private async showConnectDialog(): Promise<void> {
    const server = await this.mcpServerChooser.pickServer("Select MCP Server to Connect");
    if (!server) {
      return;
    }
    
    try {
      await this.connectToServer(server.id);
      vscode.window.showInformationMessage(`Connected to MCP server: ${server.name}`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to connect to server: ${getErrorMessage(error)}`);
    }
  }
  
  /**
   * Show disconnect dialog
   */
  private async showDisconnectDialog(): Promise<void> {
    const server = await this.mcpServerChooser.pickServer("Select MCP Server to Disconnect");
    if (!server) {
      return;
    }
    
    try {
      this.disconnectFromServer(server.id);
      vscode.window.showInformationMessage(`Disconnected from MCP server: ${server.name}`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to disconnect from server: ${getErrorMessage(error)}`);
    }
  }
  
  /**
   * Show execute tool dialog
   */
  private async showExecuteToolDialog(): Promise<void> {
    const activeServer = this.getActiveServer();
    if (!activeServer) {
      vscode.window.showWarningMessage('No active MCP server');
      return;
    }
    
    // Get tools
    const tools = await this.getTools();
    if (tools.length === 0) {
      vscode.window.showWarningMessage(`No tools available on server: ${activeServer.name}`);
      return;
    }
    
    // Pick a tool
    const toolItems = tools.map(tool => ({
      label: tool.name,
      description: tool.description,
      tool
    }));
    
    const selectedTool = await vscode.window.showQuickPick(toolItems, {
      placeHolder: 'Select a tool to execute'
    });
    
    if (!selectedTool) {
      return;
    }
    
    // Collect parameters
    const params: Record<string, any> = {};
    
    if (selectedTool.tool.parameters) {
      for (const param of selectedTool.tool.parameters) {
        const value = await vscode.window.showInputBox({
          prompt: `Enter value for parameter: ${param.name}`,
          placeHolder: param.description,
          value: param.default?.toString(),
          validateInput: (value) => {
            if (param.required && (!value || value.trim().length === 0)) {
              return `Parameter ${param.name} is required`;
            }
            return null;
          }
        });
        
        if (param.required && (value === undefined)) {
          return; // User cancelled
        }
        
        if (value !== undefined) {
          // Convert value to the appropriate type
          if (param.type === 'number') {
            params[param.name] = parseFloat(value);
          } else if (param.type === 'boolean') {
            params[param.name] = value.toLowerCase() === 'true';
          } else {
            params[param.name] = value;
          }
        }
      }
    }
    
    // Execute the tool
    try {
      const result = await this.executeTool(selectedTool.tool.name, params);
      
      // Show result
      const resultStr = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
      
      // Create output channel to show result
      const outputChannel = vscode.window.createOutputChannel(`MCP Tool: ${selectedTool.tool.name}`);
      outputChannel.appendLine(`Executed tool: ${selectedTool.tool.name}`);
      outputChannel.appendLine(`Server: ${activeServer.name}`);
      outputChannel.appendLine(`Parameters: ${JSON.stringify(params, null, 2)}`);
      outputChannel.appendLine('\nResult:');
      outputChannel.appendLine(resultStr);
      outputChannel.show();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to execute tool: ${getErrorMessage(error)}`);
    }
  }
  
  /**
   * Initialize the MCPManager
   */
  public async initialize(): Promise<void> {
    if (this._initialized) {
      return;
    }

    try {
      // Initialize browser MCP server
      const browserServer = await this.browserMCPManager.createServer();
      this.addServer(browserServer);

      // Initialize web search MCP server
      this.webSearchMCPManager = new WebSearchMCPServerManager(this.logger);
      const webSearchServer = await this.webSearchMCPManager.createServer();
      this.addServer(webSearchServer);
      
      await this.discoverBuiltInServers();
      this.loadSavedServers();
      this._initialized = true;

      // Attempt to connect browser MCP server
      try {
        await this.browserMCPManager.connect();
      } catch (error) {
        this.logger.error(`Failed to connect browser MCP server: ${error}`);
        // Don't throw here, as we want the rest of initialization to continue
      }
    } catch (error) {
      this.logger.error(`Failed to initialize MCPManager: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  /**
   * Register a new MCP server
   */
  public async registerServer(server: MCPServer): Promise<void> {
    this.addServer(server);
  }

  /**
   * Unregister an MCP server
   */
  public async unregisterServer(serverId: string): Promise<void> {
    this.removeServer(serverId);
  }

  /**
   * Update the configuration of a server
   */
  public async updateServerConfig(serverId: string, config: MCPServerConfig): Promise<void> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server with ID ${serverId} not found`);
    }
    
    server.config = config;
    this._onServerUpdated.fire(server);
    this.saveServers();
  }

  /**
   * Properly implementing the onToolsUpdated method required by the interface
   */
  public async onToolsUpdated(): Promise<void> {
    // No-op for now, can be implemented based on requirements
  }
  
  /**
   * Log a message
   */
  private log(message: string): void {
    this.logger.info(`[MCPManager] ${message}`);
  }
  
  /**
   * Dispose of resources
   */
  public dispose(): void {
    // Dispose browser MCP manager
    this.browserMCPManager.dispose();

    // Dispose web search MCP manager
    this.webSearchMCPManager?.dispose();

    // Disconnect all clients
    for (const client of this.clients.values()) {
      client.dispose();
    }
    
    // Clear collections
    this.clients.clear();
    this.servers.clear();
    
    // Dispose status bar item
    this.statusBarItem.dispose();
  }
}

/**
 * Helper class for showing MCP server quick picks
 */
class MCPServerQuickPick {
  private manager: MCPManagerImpl;
  
  constructor(manager: MCPManagerImpl) {
    this.manager = manager;
  }
  
  /**
   * Show a quick pick for selecting an MCP server
   */
  public async pickServer(placeholder: string): Promise<MCPServer | undefined> {
    const servers = this.manager.getAllServers();
    if (servers.length === 0) {
      vscode.window.showInformationMessage('No MCP servers available. Add a server first.');
      return undefined;
    }
    
    const items = servers.map(server => {
      let statusIcon = '$(server)';
      if (server.status === 'online') {
        statusIcon = '$(check)';
      } else if (server.status === 'error') {
        statusIcon = '$(error)';
      }
      
      let description = server.isBuiltIn ? '(Built-in)' : '';
      if (server.id === this.manager.getActiveServer()?.id) {
        description = `${description ? description + ' ' : ''}(Active)`;
      }
      
      return {
        label: `${statusIcon} ${server.name}`,
        description,
        detail: `URL: ${server.url}, Status: ${server.status}`,
        server
      };
    });
    
    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: placeholder
    });
    
    return selected?.server;
  }
}
