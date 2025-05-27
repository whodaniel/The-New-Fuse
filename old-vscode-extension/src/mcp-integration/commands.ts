import * as vscode from 'vscode';
import { MCPClient } from './mcp-client.js';
import { ConfigurationService } from '../core/configuration.js';
import { MCPWebSocketProtocol } from './websocket-protocol.js';
import { MCPStatusView } from './status-view.js';
import { MCPMonitor } from './monitoring.js';
import { MCPBenchmark } from './benchmark.js';
import { MCPTool, MCPServer, MCPServerConfig } from '../types/mcp.js';



// Progress notification options
const progressOptions = {
    location: vscode.ProgressLocation.Notification,
    title: 'MCP',
    cancellable: false
};

export class MCPCommandHandler {
    private client: MCPClient | null = null;
    private wsProtocol: MCPWebSocketProtocol | null = null;
    private outputChannel: vscode.OutputChannel;
    private benchmark: MCPBenchmark;
    private monitor: MCPMonitor;
    private statusView: MCPStatusView;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('MCP Commands');
        this.benchmark = new MCPBenchmark(this.outputChannel);
        this.monitor = MCPMonitor.getInstance();
        this.statusView = new MCPStatusView(this.monitor);
        this.statusView.start();
    }

    /**
     * Initialize MCP system
     */
    async initializeMCP(): Promise<void> {
        return vscode.window.withProgress(progressOptions, async (progress) => {
            try {
                progress.report({ message: 'Initializing MCP...' });
                
                // Load configuration
                const configService = ConfigurationService.getInstance();
                const mcpPort = configService.getSetting<number>('mcpPort', 9229);
                // Construct initial MCPServerConfig
                const mcpServerConfig: MCPServerConfig = {
                    version: "1.0",
                    name: "Default MCP Server",
                    description: "Local MCP server instance",
                    tools: []
                };

                // Create MCPServer object
                const mcpServer: MCPServer = {
                    id: 'default',
                    name: 'Default MCP Server',
                    url: `ws://localhost:${mcpPort}`,
                    status: 'offline',
                    config: mcpServerConfig
                };

                this.client = new MCPClient(mcpServer, getLogger('MCPClient'));


                progress.report({ message: 'Starting WebSocket connection...' });
                
                // Initialize WebSocket connection
                this.wsProtocol = new MCPWebSocketProtocol({
                    url: `ws://localhost:${mcpPort}`, // Get from config
                    outputChannel: this.outputChannel
                });
                
                const wsConnected = await this.wsProtocol.connect();
                if (!wsConnected) {
                    throw new Error('Failed to establish WebSocket connection');
                }

                progress.report({ message: 'Discovering tools...' });
                
                // Start client and discover tools
                const connected = await this.client.connect();
                if (!connected) {
                    throw new Error('Failed to connect to MCP server');
                }
                const tools = await this.client.getTools();
                
                vscode.window.showInformationMessage(
                    `MCP initialized successfully with ${tools.length} tools`
                );
                
            } catch (error: any) {
                const message = `Failed to initialize MCP: ${error.message}`;
                this.outputChannel.appendLine(message);
                vscode.window.showErrorMessage(message);
                throw error;
            }
        });
    }

    /**
     * Show available MCP tools
     */
    async showTools(): Promise<void> {
        if (!this.client?.isConnected()) {
            const result = await vscode.window.showWarningMessage(
                'MCP is not initialized. Would you like to initialize it now?',
                'Yes',
                'No'
            );
            
            if (result === 'Yes') {
                await this.initializeMCP();
            } else {
                return;
            }
        }

        const tools = await this.client!.getTools();
        if (tools.length === 0) {
            vscode.window.showInformationMessage('No MCP tools available');
            return;
        }

        const toolItems = tools.map((tool: MCPTool) => ({
            label: tool.name,
            description: tool.description,
            detail: `Parameters: ${JSON.stringify(tool.parameters, null, 2)}`
        }));

        const selected = await vscode.window.showQuickPick(toolItems, {
            placeHolder: 'Select a tool to view details',
            matchOnDescription: true,
            matchOnDetail: true
        });

        if (selected) {
            const selectedToolItem: { label: string } = selected;
            // Show tool details in a new editor
            const doc = await vscode.workspace.openTextDocument({
                content: JSON.stringify(
                    tools.find((t: MCPTool) => t.name === selectedToolItem.label),
                    null,
                    2
                ),
                language: 'json'
            });
            await vscode.window.showTextDocument(doc);
        }
    }

    /**
     * Test an MCP tool
     */
    async testTool(): Promise<void> {
        if (!this.client?.isConnected()) {
            vscode.window.showErrorMessage('MCP is not initialized');
            return;
        }

        const tools = await this.client.getTools();
        const toolItems = tools.map((tool: MCPTool) => ({
            label: tool.name,
            description: tool.description
        }));

        const selected = await vscode.window.showQuickPick(toolItems, {
            placeHolder: 'Select a tool to test'
        });

        if (!selected) return;
        const selectedToolItem: { label: string } = selected;

        const tool = tools.find((t: MCPTool) => t.name === selectedToolItem.label);
        if (!tool) return;

        try {
            // Show input box for parameters
            const params = await vscode.window.showInputBox({
                prompt: 'Enter tool parameters (JSON)',
                value: '{}',
                validateInput: input => {
                    try {
                        JSON.parse(input);
                        return null;
                    } catch {
                        return 'Invalid JSON';
                    }
                }
            });

            if (!params) return;

            // Execute tool with progress
            await vscode.window.withProgress(progressOptions, async progress => {
                progress.report({ message: `Executing ${tool.name}...` });
                const result = await this.client!.executeTool(tool.tool.name, JSON.parse(params));
                
                // Show result in new editor
                const doc = await vscode.workspace.openTextDocument({
                    content: JSON.stringify(result, null, 2),
                    language: 'json'
                });
                await vscode.window.showTextDocument(doc);
            });

        } catch (error: any) {
            const message = `Error testing tool: ${error.message}`;
            this.outputChannel.appendLine(message);
            vscode.window.showErrorMessage(message);
        }
    }

    /**
     * Ask agent with MCP tools
     */
    async askAgent(): Promise<void> {
        if (!this.client?.isConnected()) {
            vscode.window.showErrorMessage('MCP is not initialized');
            return;
        }

        const question = await vscode.window.showInputBox({
            prompt: 'What would you like the agent to do?',
            placeHolder: 'e.g. Find all TODO comments in the workspace'
        });

        if (!question) return;

        await vscode.window.withProgress(progressOptions, async progress => {
            try {
                progress.report({ message: 'Agent is working...' });
                
                // Send question to agent through WebSocket
                this.wsProtocol?.sendMessage({
                    type: 'agent_request',
                    data: {
                        question,
                        timestamp: Date.now()
                    }
                });

                // Wait for response (this should be handled by message handlers)
                // For now, just show a message
                vscode.window.showInformationMessage(
                    'Request sent to agent. Check the output channel for results.'
                );

            } catch (error: any) {
                const message = `Error processing request: ${error.message}`;
                this.outputChannel.appendLine(message);
                vscode.window.showErrorMessage(message);
            }
        });
    }

    /**
     * Run MCP benchmark
     */
    async runBenchmark(): Promise<void> {
        const options = {
            duration: 30000,
            messageCount: 10000,
            messageSize: 1024,
            concurrency: 1,
            reportInterval: 1000
        };

        // Allow configuration through quick pick
        const configureOption = await vscode.window.showQuickPick(
            ['Run with defaults', 'Configure benchmark'],
            { placeHolder: 'Choose benchmark configuration' }
        );

        if (!configureOption) return;

        if (configureOption === 'Configure benchmark') {
            // Configure duration
            const durationInput = await vscode.window.showInputBox({
                prompt: 'Enter benchmark duration (ms)',
                value: options.duration.toString(),
                validateInput: input => {
                    const num = parseInt(input);
                    return (!isNaN(num) && num > 0) ? null : 'Please enter a valid number';
                }
            });
            if (!durationInput) return;
            options.duration = parseInt(durationInput);

            // Configure message count
            const countInput = await vscode.window.showInputBox({
                prompt: 'Enter number of messages to send',
                value: options.messageCount.toString(),
                validateInput: input => {
                    const num = parseInt(input);
                    return (!isNaN(num) && num > 0) ? null : 'Please enter a valid number';
                }
            });
            if (!countInput) return;
            options.messageCount = parseInt(countInput);

            // Configure concurrency
            const concurrencyInput = await vscode.window.showInputBox({
                prompt: 'Enter number of concurrent connections',
                value: options.concurrency.toString(),
                validateInput: input => {
                    const num = parseInt(input);
                    return (!isNaN(num) && num > 0) ? null : 'Please enter a valid number';
                }
            });
            if (!concurrencyInput) return;
            options.concurrency = parseInt(concurrencyInput);
        }

        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Running MCP Benchmark',
            cancellable: true
        }, async (progress, token) => {
            try {
                // Setup progress reporting
                this.benchmark.on('progress', (data) => {
                    if (token.isCancellationRequested) {
                        return;
                    }
                    progress.report({
                        message: `Messages: ${data.messageCount}, Rate: ${Math.round(data.currentRate)}/sec`
                    });
                });

                // Run benchmark
                const results = await this.benchmark.runBenchmark(options);

                // Show results in new editor
                const doc = await vscode.workspace.openTextDocument({
                    content: JSON.stringify(results, null, 2),
                    language: 'json'
                });
                await vscode.window.showTextDocument(doc);

                vscode.window.showInformationMessage(
                    `Benchmark complete: ${Math.round(results.messagesPerSecond)} msg/sec`
                );

            } catch (error: any) {
                vscode.window.showErrorMessage(
                    `Benchmark failed: ${error.message}`
                );
            }
        });
    }

    /**
     * Show monitoring view
     */
    async showMonitoring(): Promise<void> {
        await this.statusView.showDetailedView();
    }

    /**
     * Register all MCP commands
     */
    registerCommands(context: vscode.ExtensionContext): void {
        context.subscriptions.push(
            vscode.commands.registerCommand(
                'thefuse.mcp.initialize',
                () => this.initializeMCP()
            ),
            vscode.commands.registerCommand(
                'thefuse.mcp.showTools',
                () => this.showTools()
            ),
            vscode.commands.registerCommand(
                'thefuse.mcp.testTool',
                () => this.testTool()
            ),
            vscode.commands.registerCommand(
                'thefuse.mcp.askAgent',
                () => this.askAgent()
            ),
            vscode.commands.registerCommand(
                'thefuse.mcp.runBenchmark',
                () => this.runBenchmark()
            ),
            vscode.commands.registerCommand(
                'thefuse.mcp.showMonitoring',
                () => this.showMonitoring()
            )
        );
    }

    /**
     * Clean up resources
     */
    dispose(): void {
        this.client?.dispose();
        this.wsProtocol?.disconnect();
        this.monitor.dispose();
        this.statusView.dispose();
        this.outputChannel.dispose();
    }
}

export function registerMCPCommands(context: vscode.ExtensionContext) {
    const monitor = MCPMonitor.getInstance();
    const statusView = new MCPStatusView(monitor);

    // Start monitoring when extension activates
    statusView.start();

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('thefuse.mcp.showMonitoring', () => {
            statusView.showDetailedView();
        }),

        vscode.commands.registerCommand('thefuse.mcp.clearAlerts', () => {
            monitor.getAlerts().length = 0;
            vscode.window.showInformationMessage('MCP alerts cleared');
        }),

        // Clean up when deactivating
        new vscode.Disposable(() => {
            statusView.dispose();
            monitor.dispose();
        })
    );
}