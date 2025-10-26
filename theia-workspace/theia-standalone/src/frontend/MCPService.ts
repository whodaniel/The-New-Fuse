/**
 * MCP Service for The New Fuse Theia IDE
 * Integrates Theia's MCP functionality with TNF's MCP ecosystem
 */

import { injectable, inject } from '@theia/core/shared/inversify';
import { MessageService } from '@theia/core/lib/common/message-service';
import { CommandService } from '@theia/core/lib/common/command';
import { StorageService } from '@theia/core/lib/browser/storage-service';
import { mcpService as frontendMCPService, MCPServer, MCPTool, MCPExecutionResult } from '../../../frontend/src/services/MCPService';

export interface TheiaMCPTool extends MCPTool {
  theiaCommand?: string;
  keybinding?: string;
  menuPath?: string[];
  when?: string;
}

export interface TheiaMCPServer extends MCPServer {
  theiaExtensions?: string[];
  workspaceIntegration?: boolean;
  autoStart?: boolean;
}

export interface MCPIntegrationConfig {
  enabled: boolean;
  autoDiscovery: boolean;
  workspaceServers: string[];
  globalServers: string[];
  toolKeybindings: Record<string, string>;
  serverTimeouts: {
    connection: number;
    execution: number;
    discovery: number;
  };
}

export interface MCPWorkspaceIntegration {
  serverId: string;
  workspacePath: string;
  configFiles: string[];
  environmentVariables: Record<string, string>;
  mountedVolumes: string[];
}

@injectable()
export class MCPService {
  private config: MCPIntegrationConfig;
  private workspaceIntegrations: Map<string, MCPWorkspaceIntegration> = new Map();
  private serverListeners: Set<(servers: TheiaMCPServer[]) => void> = new Set();
  private toolListeners: Set<(tools: TheiaMCPTool[]) => void> = new Set();

  constructor(
    @inject(MessageService) private readonly messageService: MessageService,
    @inject(CommandService) private readonly commandService: CommandService,
    @inject(StorageService) private readonly storageService: StorageService
  ) {
    this.initializeConfiguration();
    this.setupEventListeners();
    this.registerTheiaCommands();
  }

  /**
   * Initialize MCP integration configuration
   */
  private async initializeConfiguration(): Promise<void> {
    try {
      const stored = await this.storageService.getData('tnf-mcp-config');
      this.config = stored || this.getDefaultConfig();
    } catch (error) {
      console.warn('Failed to load MCP configuration:', error);
      this.config = this.getDefaultConfig();
    }
  }

  /**
   * Get default MCP configuration
   */
  private getDefaultConfig(): MCPIntegrationConfig {
    return {
      enabled: true,
      autoDiscovery: true,
      workspaceServers: [],
      globalServers: [],
      toolKeybindings: {},
      serverTimeouts: {
        connection: 10000,
        execution: 30000,
        discovery: 5000
      }
    };
  }

  /**
   * Setup event listeners for MCP integration
   */
  private setupEventListeners(): void {
    // Setup periodic server discovery if enabled
    if (this.config.autoDiscovery) {
      this.startServerDiscovery();
    }

    // Setup workspace change listeners
    this.setupWorkspaceIntegration();
  }

  /**
   * Register Theia commands for MCP tools
   */
  private registerTheiaCommands(): void {
    // Register MCP-related commands
    this.registerMCPCommands();
  }

  /**
   * Start periodic server discovery
   */
  private startServerDiscovery(): void {
    // Discover servers every 30 seconds
    setInterval(async () => {
      try {
        await this.discoverServers();
      } catch (error) {
        console.warn('MCP server discovery failed:', error);
      }
    }, 30000);

    // Initial discovery
    this.discoverServers();
  }

  /**
   * Setup workspace integration for MCP servers
   */
  private setupWorkspaceIntegration(): void {
    // Listen for workspace changes and update MCP server configurations
    console.log('🔧 Setting up MCP workspace integration...');
  }

  /**
   * Register MCP-related commands in Theia
   */
  private registerMCPCommands(): void {
    // Register commands for MCP tool execution, server management, etc.
    console.log('⚡ Registering MCP commands in Theia...');
  }

  /**
   * Discover available MCP servers
   */
  async discoverServers(): Promise<TheiaMCPServer[]> {
    try {
      console.log('🔍 Discovering MCP servers...');

      // Get servers from the frontend MCP service
      const servers = await frontendMCPService.getServers();

      // Enhance servers with Theia-specific metadata
      const theiaServers: TheiaMCPServer[] = servers.map(server => ({
        ...server,
        theiaExtensions: this.getTheiaExtensionsForServer(server),
        workspaceIntegration: this.hasWorkspaceIntegration(server.id),
        autoStart: this.config.globalServers.includes(server.id)
      }));

      // Notify listeners
      this.serverListeners.forEach(listener => listener(theiaServers));

      return theiaServers;
    } catch (error) {
      console.error('Failed to discover MCP servers:', error);
      throw error;
    }
  }

  /**
   * Get Theia extensions associated with an MCP server
   */
  private getTheiaExtensionsForServer(server: MCPServer): string[] {
    // Map MCP server capabilities to Theia extensions
    const extensionMap: Record<string, string[]> = {
      'file-system': ['@theia/filesystem'],
      'git': ['@theia/git'],
      'terminal': ['@theia/terminal'],
      'debug': ['@theia/debug'],
      'search': ['@theia/search-in-workspace']
    };

    const extensions: string[] = [];
    server.tools.forEach(tool => {
      const toolExtensions = extensionMap[tool.name] || [];
      extensions.push(...toolExtensions);
    });

    return [...new Set(extensions)]; // Remove duplicates
  }

  /**
   * Check if server has workspace integration
   */
  private hasWorkspaceIntegration(serverId: string): boolean {
    return this.workspaceIntegrations.has(serverId);
  }

  /**
   * Get all available MCP tools
   */
  async getAvailableTools(serverId?: string): Promise<TheiaMCPTool[]> {
    try {
      const tools = await frontendMCPService.getTools(serverId);

      // Enhance tools with Theia-specific metadata
      const theiaTools: TheiaMCPTool[] = tools.map(tool => ({
        ...tool,
        theiaCommand: this.getTheiaCommandForTool(tool),
        keybinding: this.config.toolKeybindings[tool.id],
        menuPath: this.getMenuPathForTool(tool),
        when: this.getWhenClauseForTool(tool)
      }));

      // Notify listeners
      this.toolListeners.forEach(listener => listener(theiaTools));

      return theiaTools;
    } catch (error) {
      console.error('Failed to get MCP tools:', error);
      throw error;
    }
  }

  /**
   * Get Theia command ID for MCP tool
   */
  private getTheiaCommandForTool(tool: MCPTool): string {
    return `mcp.tool.${tool.id}`;
  }

  /**
   * Get menu path for MCP tool
   */
  private getMenuPathForTool(tool: MCPTool): string[] {
    // Determine menu placement based on tool type
    if (tool.name.includes('file') || tool.name.includes('folder')) {
      return ['File', 'MCP Tools'];
    } else if (tool.name.includes('git')) {
      return ['Git', 'MCP Tools'];
    } else if (tool.name.includes('terminal') || tool.name.includes('command')) {
      return ['Terminal', 'MCP Tools'];
    } else {
      return ['Tools', 'MCP'];
    }
  }

  /**
   * Get when clause for MCP tool
   */
  private getWhenClauseForTool(tool: MCPTool): string {
    // Define when the tool should be available
    if (tool.name.includes('editor')) {
      return 'editorTextFocus';
    } else if (tool.name.includes('file')) {
      return 'explorerViewletFocus';
    } else {
      return 'true';
    }
  }

  /**
   * Execute MCP tool with Theia integration
   */
  async executeTool(
    toolId: string,
    parameters: Record<string, any>,
    options?: {
      serverId?: string;
      showProgress?: boolean;
      timeout?: number;
    }
  ): Promise<MCPExecutionResult> {
    try {
      if (options?.showProgress) {
        this.messageService.info(`Executing MCP tool: ${toolId}...`);
      }

      console.log(`🔧 Executing MCP tool: ${toolId}`, parameters);

      const result = await frontendMCPService.executeTool(
        toolId,
        parameters,
        options?.serverId
      );

      if (result.success) {
        console.log(`✅ MCP tool executed successfully: ${toolId}`);

        if (options?.showProgress) {
          this.messageService.info(`MCP tool completed: ${toolId}`);
        }

        // Handle tool-specific post-execution actions
        await this.handleToolPostExecution(toolId, result);
      } else {
        console.error(`❌ MCP tool failed: ${toolId}`, result.error);

        if (options?.showProgress) {
          this.messageService.error(`MCP tool failed: ${result.error}`);
        }
      }

      return result;
    } catch (error) {
      console.error(`Failed to execute MCP tool ${toolId}:`, error);

      if (options?.showProgress) {
        this.messageService.error(`Failed to execute MCP tool: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle post-execution actions for MCP tools
   */
  private async handleToolPostExecution(toolId: string, _result: MCPExecutionResult): Promise<void> {
    // Handle tool-specific actions like refreshing views, updating editors, etc.
    if (toolId.includes('file') || toolId.includes('folder')) {
      // Refresh file explorer
      await this.commandService.executeCommand('fileExplorer.refresh');
    } else if (toolId.includes('git')) {
      // Refresh git view
      await this.commandService.executeCommand('git.refresh');
    } else if (toolId.includes('terminal')) {
      // Focus terminal
      await this.commandService.executeCommand('terminal.focus');
    }
  }

  /**
   * Register MCP server with workspace integration
   */
  async registerWorkspaceServer(
    serverId: string,
    workspacePath: string,
    config: Partial<MCPWorkspaceIntegration>
  ): Promise<void> {
    try {
      const integration: MCPWorkspaceIntegration = {
        serverId,
        workspacePath,
        configFiles: config.configFiles || [],
        environmentVariables: config.environmentVariables || {},
        mountedVolumes: config.mountedVolumes || [],
        ...config
      };

      this.workspaceIntegrations.set(serverId, integration);

      // Update configuration
      if (!this.config.workspaceServers.includes(serverId)) {
        this.config.workspaceServers.push(serverId);
        await this.saveConfiguration();
      }

      console.log(`📁 Registered MCP server ${serverId} for workspace ${workspacePath}`);
    } catch (error) {
      console.error(`Failed to register workspace server ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Unregister MCP server from workspace
   */
  async unregisterWorkspaceServer(serverId: string): Promise<void> {
    try {
      this.workspaceIntegrations.delete(serverId);

      // Update configuration
      const index = this.config.workspaceServers.indexOf(serverId);
      if (index > -1) {
        this.config.workspaceServers.splice(index, 1);
        await this.saveConfiguration();
      }

      console.log(`📁 Unregistered MCP server ${serverId} from workspace`);
    } catch (error) {
      console.error(`Failed to unregister workspace server ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Get workspace integrations
   */
  getWorkspaceIntegrations(): MCPWorkspaceIntegration[] {
    return Array.from(this.workspaceIntegrations.values());
  }

  /**
   * Update MCP configuration
   */
  async updateConfiguration(updates: Partial<MCPIntegrationConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    await this.saveConfiguration();

    // Reinitialize if necessary
    if (updates.enabled !== undefined || updates.autoDiscovery !== undefined) {
      this.setupEventListeners();
    }
  }

  /**
   * Save configuration to storage
   */
  private async saveConfiguration(): Promise<void> {
    try {
      await this.storageService.setData('tnf-mcp-config', this.config);
    } catch (error) {
      console.error('Failed to save MCP configuration:', error);
    }
  }

  /**
   * Test MCP server connectivity
   */
  async testServerConnectivity(serverId: string): Promise<{
    success: boolean;
    responseTime?: number;
    error?: string;
  }> {
    try {
      console.log(`🔗 Testing connectivity to MCP server: ${serverId}`);

      const startTime = Date.now();
      const isConnected = await frontendMCPService.testConnection(serverId);
      const responseTime = Date.now() - startTime;

      return {
        success: isConnected,
        responseTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  /**
   * Add server change listener
   */
  onServersChange(listener: (servers: TheiaMCPServer[]) => void): () => void {
    this.serverListeners.add(listener);
    return () => this.serverListeners.delete(listener);
  }

  /**
   * Add tool change listener
   */
  onToolsChange(listener: (tools: TheiaMCPTool[]) => void): () => void {
    this.toolListeners.add(listener);
    return () => this.toolListeners.delete(listener);
  }

  /**
   * Get MCP integration statistics
   */
  getStatistics(): {
    totalServers: number;
    workspaceServers: number;
    globalServers: number;
    availableTools: number;
    config: MCPIntegrationConfig;
  } {
    return {
      totalServers: this.config.workspaceServers.length + this.config.globalServers.length,
      workspaceServers: this.config.workspaceServers.length,
      globalServers: this.config.globalServers.length,
      availableTools: 0, // Would need to query this from frontend service
      config: { ...this.config }
    };
  }

  /**
   * Export MCP configuration
   */
  exportConfiguration(): string {
    return JSON.stringify({
      config: this.config,
      workspaceIntegrations: Array.from(this.workspaceIntegrations.entries())
    }, null, 2);
  }

  /**
   * Import MCP configuration
   */
  async importConfiguration(configJson: string): Promise<void> {
    try {
      const imported = JSON.parse(configJson);

      if (imported.config) {
        await this.updateConfiguration(imported.config);
      }

      if (imported.workspaceIntegrations) {
        // Clear existing integrations
        this.workspaceIntegrations.clear();

        // Import workspace integrations
        for (const [serverId, integration] of imported.workspaceIntegrations) {
          this.workspaceIntegrations.set(serverId, integration);
        }
      }

      console.log('📥 Imported MCP configuration successfully');
    } catch (error) {
      throw new Error(`Failed to import MCP configuration: ${error instanceof Error ? error.message : 'Invalid format'}`);
    }
  }
}

export default MCPService;