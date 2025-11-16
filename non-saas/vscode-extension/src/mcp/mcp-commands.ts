/**
 * Functions for registering MCP-related commands
 */

import * as vscode from 'vscode';
import { MCPClient } from '../types/mcp';
import { ModelContextProtocolClient } from './ModelContextProtocolClient';
import { EnhancedModelContextProtocolClient, MCPProgressCallback } from './EnhancedModelContextProtocolClient';

/**
 * Register all MCP-related commands
 */
export function registerMCPCommands(
    context: vscode.ExtensionContext,
    mcpClient?: MCPClient
): void {
    // Connect to MCP server
    context.subscriptions.push(
        vscode.commands.registerCommand('the-new-fuse.connectMCP', async () => {
            await connectMCP(context, mcpClient);
        })
    );
    
    // Disconnect from MCP server
    context.subscriptions.push(
        vscode.commands.registerCommand('the-new-fuse.disconnectMCP', async () => {
            await disconnectMCP(mcpClient);
        })
    );
    
    // Check MCP server health
    context.subscriptions.push(
        vscode.commands.registerCommand('the-new-fuse.checkMCPHealth', async () => {
            await checkMCPHealth(mcpClient);
        })
    );
    
    // Configure MCP settings
    context.subscriptions.push(
        vscode.commands.registerCommand('the-new-fuse.configureMCP', () => {
            vscode.commands.executeCommand('workbench.action.openSettings', 'theNewFuse.mcp');
        })
    );
    
    // Show MCP menu
    context.subscriptions.push(
        vscode.commands.registerCommand('the-new-fuse.mcpMenu', async () => {
            await showMCPMenu(context, mcpClient);
        })
    );
    
    console.log('MCP commands registered');
}

/**
 * Connect to MCP server
 */
export async function connectMCP(
    context: vscode.ExtensionContext,
    mcpClient?: MCPClient
): Promise<MCPClient | undefined> {
    try {
        // Show progress notification
        return await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Connecting to MCP server...',
            cancellable: false
        }, async () => {
            let client = mcpClient;
            
            // If client doesn't exist, create a new one
            if (!client) {
                const mcpConfig = vscode.workspace.getConfiguration('theNewFuse.mcp');
                const mcpUrl = mcpConfig.get<string>('url', 'ws://localhost:3000/mcp');
                const useEnhancedClient = mcpConfig.get<boolean>('useEnhancedClient', true);
                
                if (useEnhancedClient) {
                    // Create enhanced client
                    client = new EnhancedModelContextProtocolClient(mcpUrl, context);
                    
                    // Set up event listeners
                    (client as EnhancedModelContextProtocolClient).on('connected', () => {
                        vscode.window.setStatusBarMessage('MCP: Connected', 3000);
                    });
                    
                    (client as EnhancedModelContextProtocolClient).on('disconnected', () => {
                        vscode.window.setStatusBarMessage('MCP: Disconnected', 3000);
                    });
                    
                    (client as EnhancedModelContextProtocolClient).on('error', (errorInfo) => {
                        console.error('MCP client error:', errorInfo);
                        // Show UI notifications for important errors
                        if (errorInfo.context === 'connectionFailed' || errorInfo.context === 'checkHealth') {
                            vscode.window.showErrorMessage(`MCP error: ${errorInfo.error}`);
                        }
                    });
                } else {
                    // Create basic client
                    client = new ModelContextProtocolClient(mcpUrl, context);
                }
            }
            
            // Connect to server
            await client.connect();
            
            // Show success message
            vscode.window.showInformationMessage('Connected to MCP server successfully');
            
            return client;
        });
    } catch (error) {
        // Show error message
        console.error('Failed to connect to MCP server:', error);
        vscode.window.showErrorMessage(`Failed to connect to MCP server: ${error instanceof Error ? error.message : String(error)}`);
        
        return undefined;
    }
}

/**
 * Disconnect from MCP server
 */
export async function disconnectMCP(mcpClient?: MCPClient): Promise<void> {
    if (!mcpClient) {
        vscode.window.showWarningMessage('No active MCP connection');
        return;
    }
    
    try {
        // Show progress notification
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Disconnecting from MCP server...',
            cancellable: false
        }, async () => {
            await mcpClient.disconnect();
        });
        
        // Show success message
        vscode.window.showInformationMessage('Disconnected from MCP server');
    } catch (error) {
        // Show error message
        console.error('Failed to disconnect from MCP server:', error);
        vscode.window.showErrorMessage(`Failed to disconnect from MCP server: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Check MCP server health
 */
export async function checkMCPHealth(mcpClient?: MCPClient): Promise<void> {
    if (!mcpClient) {
        vscode.window.showWarningMessage('No active MCP connection');
        return;
    }
    
    try {
        // Show progress notification
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Checking MCP server health...',
            cancellable: false
        }, async () => {
            // Special handling for enhanced client
            if (mcpClient instanceof EnhancedModelContextProtocolClient) {
                const isHealthy = await mcpClient.checkHealth();
                
                if (isHealthy) {
                    vscode.window.showInformationMessage('MCP server is healthy');
                } else {
                    vscode.window.showWarningMessage('MCP server is not responding correctly');
                }
            } else {
                // Basic health check for standard client
                const isConnected = mcpClient.isConnected();
                
                if (isConnected) {
                    vscode.window.showInformationMessage('MCP server connection is active');
                } else {
                    vscode.window.showWarningMessage('Not connected to MCP server');
                }
            }
        });
    } catch (error) {
        // Show error message
        console.error('Failed to check MCP server health:', error);
        vscode.window.showErrorMessage(`Failed to check MCP server health: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Show MCP menu
 */
export async function showMCPMenu(
    context: vscode.ExtensionContext,
    mcpClient?: MCPClient
): Promise<void> {
    const isConnected = mcpClient?.isConnected() || false;
    
    // Build menu items based on connection state
    const menuItems = [
        {
            label: isConnected ? '$(debug-disconnect) Disconnect from MCP Server' : '$(plug) Connect to MCP Server',
            id: isConnected ? 'disconnect' : 'connect'
        },
        { label: '$(pulse) Check MCP Server Health', id: 'health' },
        { label: '$(gear) Configure MCP Settings', id: 'settings' }
    ];
    
    // Show quick pick menu
    const selected = await vscode.window.showQuickPick(menuItems, {
        placeHolder: `MCP Status: ${isConnected ? 'Connected' : 'Disconnected'}`,
        title: 'MCP Server Options'
    });
    
    if (selected) {
        switch (selected.id) {
            case 'connect':
                await connectMCP(context, mcpClient);
                break;
            case 'disconnect':
                await disconnectMCP(mcpClient);
                break;
            case 'health':
                await checkMCPHealth(mcpClient);
                break;
            case 'settings':
                vscode.commands.executeCommand('workbench.action.openSettings', 'theNewFuse.mcp');
                break;
        }
    }
}

/**
 * Execute a tool through MCP with progress reporting
 */
export async function executeMCPTool(
    mcpClient: MCPClient,
    toolName: string,
    parameters: Record<string, any>
): Promise<any> {
    if (!mcpClient) {
        throw new Error('No active MCP connection');
    }
    
    // If enhanced client, use progress reporting
    if (mcpClient instanceof EnhancedModelContextProtocolClient) {
        return await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Executing ${toolName}...`,
            cancellable: false
        }, async (progress) => {
            // Create progress callback
            const progressCallback: MCPProgressCallback = (percent, message) => {
                progress.report({
                    message: `${message} (${percent}%)`,
                    increment: percent - (progress as any).lastPercent || 0
                });
                (progress as any).lastPercent = percent;
            };
            
            // Execute tool with progress reporting
            return await mcpClient.executeToolWithProgress(toolName, parameters, progressCallback);
        });
    } else {
        // For basic client, no progress reporting
        throw new Error('Enhanced MCP client required for executing tools with progress');
    }
}
