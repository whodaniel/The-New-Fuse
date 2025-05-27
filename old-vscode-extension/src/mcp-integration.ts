import * as vscode from 'vscode';
import { getLogger } from './core/logging.js';
import { MCPManagerImpl } from './mcp-integration/mcp-manager.js';
import { MCPServer, MCPTool } from './types/mcp.js';
import { getErrorMessage } from './utils/error-utils.js';

/**
 * Define the structure for tools with server context
 */
export interface ToolWithContext {
    tool: MCPTool;
    serverId: string;
    serverName: string;
}

/**
 * Extended MCPTool interface to handle additional properties used in the integration
 */
export interface ExtendedMCPTool extends MCPTool {
    serverName?: string;
    serverId?: string;
    tool?: {
        name?: string;
        description?: string;
        parameters?: any;
    };
}

/**
 * Core MCP Integration class that provides base functionality for working with MCP tools
 */
export class MCPIntegration {
    protected readonly logger;
    protected readonly mcpManager: MCPManagerImpl;

    constructor(mcpManager: MCPManagerImpl) {
        this.logger = getLogger();
        this.mcpManager = mcpManager;
    }

    /**
     * Execute a tool by name on a specified server
     */
    public async executeToolByName(toolName: string, serverName: string, params: any): Promise<any> {
        try {
            const servers = this.getServers();
            const server = servers.find(s => s.name === serverName);

            if (!server) {
                throw new Error(`Server ${serverName} not found`);
            }

            // Extract the actual tool name if it's prefixed
            const actualToolName = toolName.startsWith(`mcp.${serverName}.`)
                ? toolName.substring(`mcp.${serverName}.`.length)
                : toolName;

            this.logger.info(`Executing tool ${actualToolName} on server ${serverName}`);
            const parameters = typeof params === 'object' && params !== null ? params : {};
            
            // Create a proper Record<string, any> for the parameters
            const paramRecord: Record<string, any> = {};
            if (typeof parameters === 'object') {
                Object.assign(paramRecord, parameters);
            }
            
            // Fixed: Correctly match the expected parameter order
            return await this.mcpManager.executeTool(
                actualToolName,  // 1st param: toolName
                paramRecord,     // 2nd param: params
                server.id        // 3rd param: serverId
            );
        } catch (error) {
            this.logger.error('Tool execution failed:', getErrorMessage(error));
            throw error;
        }
    }

    /**
     * Get all tools with their server context information
     */
    public async getAllToolsWithContext(): Promise<ToolWithContext[]> {
        try {
            const toolsWithContext: ToolWithContext[] = [];
            const servers = this.mcpManager.getAllServers();

            for (const server of servers) {
                if (server.config?.tools) {
                    server.config.tools.forEach(tool => {
                        toolsWithContext.push({
                            tool: tool,
                            serverId: server.id,
                            serverName: server.name
                        });
                    });
                }
            }

            if (toolsWithContext.length === 0) {
                this.logger.warn('No tools available from MCP servers');
            }

            return toolsWithContext;
        } catch (error) {
            this.logger.error('Failed to get tools with context:', getErrorMessage(error));
            return [];
        }
    }

    /**
     * Get all available MCP servers
     */
    public getServers(): MCPServer[] {
        try {
            return this.mcpManager.getAllServers();
        } catch (error) {
            this.logger.error('Failed to get servers:', getErrorMessage(error));
            return [];
        }
    }

    /**
     * Register MCP tools with a tool provider
     */
    public async registerToolProvider(toolProvider: any) {
        const toolContexts = await this.getAllToolsWithContext();
        toolContexts.forEach(ctx => {
            const toolName = ctx.tool.name || '';
            const toolDefinition = {
                name: `mcp.${ctx.serverName}.${toolName}`,
                description: ctx.tool.description || 'No description available',
                parameters: ctx.tool.parameters || {},
                execute: async (params: Record<string, any>) => {
                    // Fixed: Correctly match the expected parameter order
                    return await this.mcpManager.executeTool(
                        toolName,      // 1st param: toolName
                        params,        // 2nd param: params
                        ctx.serverId   // 3rd param: serverId
                    );
                }
            };
            toolProvider.registerTool(toolDefinition);
            this.logger.info(`Registered tool with provider: ${toolDefinition.name}`);
        });
    }
}

/**
 * MCP Integration class for agent/LLM bridge integration
 * Extends the base MCPIntegration with additional functionality for agents
 */
export class AgentMCPIntegration extends MCPIntegration {
    private lmBridge: any;

    constructor(mcpManager: MCPManagerImpl, lmBridge: any) {
        super(mcpManager);
        this.lmBridge = lmBridge;
    }

    /**
     * Get all available tools formatted for agent usage
     */
    public async getToolsForAgent(): Promise<any[]> {
        try {
            const mcpTools = await this.mcpManager.getTools();
            
            return mcpTools.map((tool: ExtendedMCPTool) => ({
                name: `mcp.${tool.serverName || 'unknown'}.${tool.name || tool.tool?.name || 'unknown'}`,
                description: tool.description || tool.tool?.description || 'No description available',
                parameters: tool.parameters || tool.tool?.parameters || {},
                execute: async (params: Record<string, any>) => {
                    try {
                        if (!tool.serverId) {
                            throw new Error(`No server ID found for tool: ${tool.name || 'unknown'}`);
                        }
                        const toolName = tool.name || tool.tool?.name || '';
                        // Fixed: Correctly match the expected parameter order
                        return await this.mcpManager.executeTool(
                            toolName,      // 1st param: toolName
                            params,        // 2nd param: params
                            tool.serverId  // 3rd param: serverId
                        );
                    } catch (error) {
                        this.logger.error(`Tool execution failed: ${getErrorMessage(error)}`);
                        throw error;
                    }
                }
            }));
        } catch (error) {
            this.logger.error('Error getting MCP tools for agent:', error);
            return [];
        }
    }

    /**
     * Execute a tool by its full name (mcp.server.toolName)
     */
    public async executeTool(toolName: string, parameters: any): Promise<any> {
        try {
            const parts = toolName.split('.');
            if (parts.length < 3 || parts[0] !== 'mcp') {
                throw new Error(`Invalid MCP tool name: ${toolName}`);
            }
            
            const serverName = parts[1];
            const actualToolName = parts.slice(2).join('.');
            
            return await this.executeToolByName(actualToolName, serverName, parameters);
        } catch (error) {
            this.logger.error(`Tool execution failed: ${getErrorMessage(error)}`);
            throw error;
        }
    }

    /**
     * Generate text with LLM using available tools
     */
    public async generateWithTools(prompt: string): Promise<any> {
        try {
            const tools = await this.getToolsForAgent();
            if (!tools.length) {
                this.logger.warn('No tools available for generation');
                return this.lmBridge.generate({ prompt });
            }

            return await this.lmBridge.generate({
                prompt,
                tools,
                systemPrompt: `You have access to the following tools: ${tools.map(t => `${t.name}: ${t.description}`).join(', ')}`
            });
        } catch (error) {
            this.logger.error('Generation with tools failed:', error);
            throw error;
        }
    }

    /**
     * Ask the agent to perform a task, potentially using tools
     */
    public async askAgent(prompt: string, messages?: any[]): Promise<any> {
        try {
            const tools = await this.getToolsForAgent();
            
            return await this.lmBridge.generate({
                prompt,
                tools,
                messages,
                systemPrompt: `You have access to the following tools: ${tools.map(t => `${t.name}: ${t.description}`).join(', ')}`
            });
        } catch (error) {
            this.logger.error('Ask agent failed:', error);
            throw error;
        }
    }
}

/**
 * Initialize MCP integration with VS Code context
 */
export async function initializeMCP(
    context: vscode.ExtensionContext, 
    mcpManager: MCPManagerImpl, 
    lmBridge?: any
): Promise<{ integration: MCPIntegration; agentIntegration?: AgentMCPIntegration }> {
    // Create the base integration
    const integration = new MCPIntegration(mcpManager);
    
    // Create agent integration if lmBridge is provided
    let agentIntegration: AgentMCPIntegration | undefined;
    if (lmBridge) {
        agentIntegration = new AgentMCPIntegration(mcpManager, lmBridge);
    }
    
    // Register Commands
    registerMCPCommands(context, integration, agentIntegration);
    
    // Register Views
    registerMCPViews(context, integration);

    return { integration, agentIntegration };
}

/**
 * Register MCP-related VS Code commands
 */
export function registerMCPCommands(
    context: vscode.ExtensionContext,
    integration: MCPIntegration,
    agentIntegration?: AgentMCPIntegration
): void {
    // Basic tool commands
    context.subscriptions.push(
        vscode.commands.registerCommand('thefuse.mcp.testTool', async () => {
            vscode.window.showInformationMessage("Tool testing UI not implemented yet.");
        }),
        vscode.commands.registerCommand('thefuse.mcp.browseMarketplace', async () => {
            vscode.window.showInformationMessage("Marketplace browser not implemented yet.");
        }),
        vscode.commands.registerCommand('thefuse.mcp.addServer', async () => {
            vscode.window.showInformationMessage("Adding server from marketplace not implemented yet.");
        })
    );
    
    // Show available tools command
    context.subscriptions.push(
        vscode.commands.registerCommand('thefuse.mcp.showTools', async () => {
            try {
                const servers = integration.getServers();
                
                if (!servers || servers.length === 0) {
                    vscode.window.showInformationMessage('No MCP servers registered. Run "Initialize MCP Integration" first.');
                    return;
                }
                
                // Create items for the quick pick
                type MCPServerQuickPickItem = vscode.QuickPickItem & { server: MCPServer };
                const serverItems: MCPServerQuickPickItem[] = servers.map((server: MCPServer) => ({
                    label: server.name,
                    description: `${server.status} - ${server.url}`,
                    server
                }));
                
                const selected = await vscode.window.showQuickPick(serverItems, {
                    placeHolder: 'Select an MCP server to view tools',
                });
                
                if (!selected) return;
                
                // Access the server object from the selected item
                const server = selected.server;
                const tools = Object.entries(server.config?.tools || []);
                
                if (tools.length === 0) {
                    vscode.window.showInformationMessage(`No tools available from "${server.name}"`);
                    return;
                }
                
                const toolItems = tools.map(([name, tool]) => ({
                    label: name,
                    description: (tool as any).description,
                    detail: `Parameters: ${Object.keys((tool as any).parameters || {}).join(', ')}`
                }));
                
                const selectedTool = await vscode.window.showQuickPick(toolItems, {
                    placeHolder: 'Select a tool to view details',
                });
                
                if (!selectedTool) return;
                
                // Show tool details
                vscode.window.showInformationMessage(`Selected tool: ${selectedTool.label}`);
            } catch (error: any) {
                vscode.window.showErrorMessage(`Error showing MCP tools: ${error.message}`);
            }
        })
    );
    
    // Register agent command if agent integration exists
    if (agentIntegration) {
        context.subscriptions.push(
            vscode.commands.registerCommand('thefuse.mcp.askAgent', async () => {
                const prompt = await vscode.window.showInputBox({
                    placeHolder: 'What would you like the agent to do?',
                    prompt: 'Enter your request for the AI agent:'
                });
                
                if (!prompt) return;
                
                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "Asking Agent...",
                    cancellable: false
                }, async (progress) => {
                    progress.report({ increment: 0, message: "Sending request..." });
                    
                    try {
                        progress.report({ increment: 50, message: "Waiting for response..." });
                        const response = await agentIntegration!.askAgent(prompt);
                        
                        // Show the response
                        vscode.window.showInformationMessage(`Agent Response: ${JSON.stringify(response)}`);
                        progress.report({ increment: 100, message: "Completed." });
                    } catch (error: any) {
                        console.error('Error during agent execution:', error);
                        vscode.window.showErrorMessage(`Agent execution failed: ${error.message}`);
                    }
                });
            })
        );
    }
}

/**
 * Register MCP-related views in VS Code
 */
export function registerMCPViews(context: vscode.ExtensionContext, integration: MCPIntegration): void {
    const serverViewProvider = new MCPServerViewProvider(integration);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('mcp.serverView', serverViewProvider)
    );
}

/**
 * WebView provider for MCP server view
 */
class MCPServerViewProvider implements vscode.WebviewViewProvider {
    constructor(private readonly mcpIntegration: MCPIntegration) {}

    public async resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): Promise<void> {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [] // Consider adding resource roots if loading local files
        };

        const servers = this.mcpIntegration.getServers();
        const serverItems = servers.map((server: MCPServer) => ({
            id: server.id,
            name: server.name,
            status: server.status || 'unknown'
        }));

        webviewView.webview.html = this.getHtmlForWebview(serverItems);
    }

    private getHtmlForWebview(servers: { id: string; name: string; status: string }[]): string {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    .server-list { padding: 10px; }
                    .server-item { margin-bottom: 10px; }
                </style>
            </head>
            <body>
                <div class="server-list">
                    ${servers.map(server => `
                        <div class="server-item">
                            <strong>${server.name}</strong>
                            <span>(${server.status})</span>
                        </div>
                    `).join('')}
                </div>
            </body>
            </html>
        `;
    }
}

/**
 * Register MCP integration with VS Code extension
 * This is the main entry point used by extension.ts
 */
export function registerMCPIntegration(
    context: vscode.ExtensionContext,
    llmProvider: any
): { mcpManager: MCPManagerImpl; agentIntegration?: AgentMCPIntegration } {
    const logger = getLogger();
    logger.info('Initializing MCP integration');
    
    // Create the MCP manager
    const mcpManager = new MCPManagerImpl(context, logger); // Pass context and logger
    
    // Load configuration
    const config = vscode.workspace.getConfiguration('theFuse');
    const mcpEnabled = config.get<boolean>('mcpEnabled', true);
    
    if (!mcpEnabled) {
        logger.info('MCP integration is disabled by configuration');
        return { mcpManager };
    }
    
    try {
        // Create the agent integration using the LLM provider as a bridge
        const agentIntegration = new AgentMCPIntegration(mcpManager, llmProvider);
        
        // Register commands
        registerMCPCommands(context, new MCPIntegration(mcpManager), agentIntegration);
        
        // Register status bar item
        const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
        statusBarItem.text = "$(tools) MCP";
        statusBarItem.tooltip = "Model Context Protocol Integration";
        statusBarItem.command = 'thefuse.mcp.showTools';
        statusBarItem.show();
        context.subscriptions.push(statusBarItem);
        
        logger.info('MCP integration successfully initialized');
        
        return { mcpManager, agentIntegration };
    } catch (error) {
        logger.error('Failed to initialize MCP integration', error);
        vscode.window.showErrorMessage(`Failed to initialize MCP integration: ${getErrorMessage(error)}`);
        return { mcpManager };
    }
}
