import * as vscode from 'vscode';
import * as fs from 'fs/promises'; // Added
import * as path from 'path'; // Added
import { Logger, getLogger } from './core/logging.js';
import { TelemetryService } from './core/telemetry.js';
import { LLMProviderManager } from './llm/LLMProviderManager.js';
import { createFuseMonitoringClient } from './monitoring/FuseMonitoringClient.js';
import { MonitoredLLMProviderManager } from './llm/monitored-llm-provider-manager.js';
import { registerMCPIntegration } from './mcp-integration.js';
import { OpenAIProvider } from './llm/providers/openai-provider.js';
import { AnthropicProvider } from './llm/providers/anthropic-provider.js';
import { OllamaProvider } from './llm/providers/ollama-provider.js';
import { VSCodeLLMProvider } from './llm/providers/vscode-llm-provider.js';
import { CerebrasProvider } from './llm/providers/CerebrasProvider.js'; // Added
import { MCPMarketplace } from './mcp-integration/mcp-marketplace.js';
import { ChatView } from './web-ui/chat-view.js';
// import { WebViewMessageRouter } from './webview-message-router.js'; // Removed
import { TheFuseAPI } from './types.js';
import { ChromeWebSocketService } from './services/chrome-websocket-service.js';
import { WebSocketServer } from './websocketServer.js';
import { VSCodeSecurityManager } from './vscodeSecurityManager.js';
import { BaseMessage, MessageType, MessageSource, LLMResponseMessage, RequestLLMActionMessage, SendBrowserContextMessage, ErrorMessage } from './shared-protocol.js';
import { randomUUID } from 'crypto';
import { registerAgentCoordinationCommand } from './agent-service.js'; // Added for agent coordination

let wsServer: WebSocketServer | null = null;
let securityManager: VSCodeSecurityManager | null = null;

export async function activate(context: vscode.ExtensionContext): Promise<TheFuseAPI> {
    const logger = new Logger('TheFuse');
    const telemetry = TelemetryService.getInstance();
    telemetry.recordEvent('extension_activated');
    const monitoringClient = createFuseMonitoringClient(context);
    const llmManager = new LLMProviderManager();
    const monitoredLLMManager = new MonitoredLLMProviderManager(context, llmManager, monitoringClient);
    const { mcpManager, agentIntegration } = registerMCPIntegration(context, monitoredLLMManager);

    try {
        logger.info('Activating The New Fuse extension');

        // Initialize Security Manager and WebSocket Server
        securityManager = new VSCodeSecurityManager();
        wsServer = new WebSocketServer(securityManager);
        wsServer.start();

        wsServer.on('message', (message: BaseMessage, client: import('ws')) => {
            logger.info(`[Extension] Received message from Chrome client: ${message.type}`);
            handleIncomingMessageFromChrome(message, client, llmManager, logger);
        });

        // Register LLM providers
        const config = vscode.workspace.getConfiguration('thefuse');
        const apiKeys = {
            openai: config.get<string>('openaiApiKey'),
            anthropic: config.get<string>('anthropicApiKey')
        };

        if (apiKeys.openai) {
            llmManager.registerProvider(new OpenAIProvider(apiKeys.openai));
        }
        if (apiKeys.anthropic) {
            llmManager.registerProvider(new AnthropicProvider(apiKeys.anthropic));
        }

        llmManager.registerProvider(new OllamaProvider());
        llmManager.registerProvider(new VSCodeLLMProvider(context));
        llmManager.registerProvider(new CerebrasProvider(context)); // Added

        // Initialize marketplace service
        const marketplace = new MCPMarketplace();
        await marketplace.initialize();

        // Register webview providers
        const chatViewProvider = new ChatView(context.extensionUri, context, monitoredLLMManager); // Pass context and llmManager
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider(ChatView.viewType, chatViewProvider) // Use static viewType
        );

        // WebViewMessageRouter might still be used by other webviews or could be removed if ChatView is the only one.
        // For now, its initialization is commented out as per original, but if it were used:
        // const relayServiceForRouter = new RelayService(logger, /* needs a way to post to a specific webview or all */);
        // const messageRouter = new WebViewMessageRouter(logger, monitoredLLMManager, relayServiceForRouter);
        // And then ensure messages from other webviews are piped to messageRouter.handleMessage(message)

        // Create status bar item
        const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
        statusBarItem.text = "$(rocket) The New Fuse";
        statusBarItem.tooltip = "The New Fuse AI Tools & Connection";
        statusBarItem.command = 'thefuse.showConnectionStatus';
        statusBarItem.show();
        context.subscriptions.push(statusBarItem);

        // Add WebSocket server to disposables
        context.subscriptions.push({ dispose: () => wsServer?.stop() });

        // Register WebSocket-related commands
        context.subscriptions.push(
            vscode.commands.registerCommand('thefuse.showConnectionStatus', () => {
                if (wsServer) {
                    const clients = wsServer['connectedClients']?.size || 0;
                    vscode.window.showInformationMessage(
                        `WebSocket Server Status: Running on port ${wsServer['port']}\n` +
                        `Connected clients: ${clients}`
                    );
                } else {
                    vscode.window.showWarningMessage('WebSocket Server is not running.');
                }
            })
        );

        context.subscriptions.push(
            vscode.commands.registerCommand('thefuse.restartChromeWebSocketServer', async () => {
                if (wsServer) {
                    try {
                        logger.info('Restarting WebSocket server...');
                        wsServer.restart();
                        vscode.window.showInformationMessage('WebSocket server restarted successfully.');
                    } catch (error: any) {
                        logger.error('Failed to restart WebSocket server:', error);
                        vscode.window.showErrorMessage(
                            `Failed to restart WebSocket server: ${error.message}`
                        );
                    }
                }
            })
        );

        // Dispose WebSocket server on deactivation
        context.subscriptions.push({ dispose: () => wsServer?.stop() });

        // Initialize Chrome WebSocket Service (This seems to be a different WebSocket service, ensure no conflict)
        // If this existing ChromeWebSocketService is intended to be replaced by the new wsServer, 
        // then its initialization and usage should be removed or refactored.
        // For now, I will assume they are distinct or you will manage the integration.
        const chromeWebSocketService = ChromeWebSocketService.getInstance();
        try {
            await chromeWebSocketService.initialize();
            logger.info('Chrome WebSocket service initialized');
        } catch (error) {
            logger.error('Failed to initialize Chrome WebSocket service:', error);
        }

        // Register commands
        context.subscriptions.push(
            vscode.commands.registerCommand('thefuse.openMainUI', async () => {
                // Show the chat view in the sidebar
                await vscode.commands.executeCommand('workbench.view.extension.thefuse-sidebar');
                await vscode.commands.executeCommand('thefuse-chat.focus');
                logger.info('Opened The New Fuse main UI');
            })
        );

        context.subscriptions.push(
            vscode.commands.registerCommand('thefuse.sendMessage', async () => {
                const prompt = await vscode.window.showInputBox({
                    prompt: 'Enter your message'
                });
                if (prompt) {
                    const response = await llmManager.generate(prompt);
                    vscode.window.showInformationMessage(response);
                }
            })
        );

        context.subscriptions.push(
            vscode.commands.registerCommand('thefuse.startConversation', async () => {
                vscode.window.showInformationMessage('Starting a new conversation...');
                await vscode.commands.executeCommand('thefuse.openMainUI');
            })
        );

        // Register command to show connection status
        context.subscriptions.push(
            vscode.commands.registerCommand('thefuse.showConnectionStatus', () => {
                if (wsServer) {
                    // This is a placeholder. You might want to show more detailed status.
                    // For example, number of connected clients from the new wsServer.
                    const clients = (wsServer as any).connectedClients?.size || 0; // Type assertion for simplicity
                    vscode.window.showInformationMessage(`The New Fuse WebSocket Server is running on port ${(wsServer as any).port}. Connected clients: ${clients}`);
                } else {
                    vscode.window.showWarningMessage('The New Fuse WebSocket Server is not initialized.');
                }
            })
        );

        // Register command to show Chrome extension clients (from the new wsServer)
        context.subscriptions.push(
            vscode.commands.registerCommand('thefuse.showChromeClients', async () => {
                if (wsServer && (wsServer as any).connectedClients) {
                    const clients = (wsServer as any).connectedClients as Set<import('ws')>;
                    if (clients.size === 0) {
                        vscode.window.showInformationMessage('No Chrome extension clients connected to the new WebSocket server.');
                        return;
                    }
                    // You might want to display more info about clients if available
                    vscode.window.showInformationMessage(`Connected Chrome extension clients to new server: ${clients.size}`);
                } else {
                    vscode.window.showWarningMessage('New WebSocket server is not active or has no client tracking.');
                }
            })
        );

        // Register command to restart Chrome WebSocket server (the new one)
        context.subscriptions.push(
            vscode.commands.registerCommand('thefuse.restartChromeWebSocketServer', async () => {
                if (wsServer) {
                    try {
                        logger.info('Restarting The New Fuse WebSocket server...');
                        wsServer.restart();
                        vscode.window.showInformationMessage('The New Fuse WebSocket server restarted successfully.');
                    } catch (error: any) {
                        logger.error('Failed to restart The New Fuse WebSocket server:', error);
                        vscode.window.showErrorMessage(`Failed to restart The New Fuse WebSocket server: ${error.message}`);
                    }
                }
            })
        );

        // --- Register Agent Memory Update Command ---
        const updateMemoryCommand = vscode.commands.registerCommand('theFuse.updateAgentMemory', async (args: { agentId: string; fileName: string; content: string }) => {
            const { agentId, fileName, content } = args;
            // Use existing logger if possible, otherwise create a dedicated channel
            const commandLogger = getLogger(); // Use the existing logger
            commandLogger.info(`Received request to update memory for agent ${agentId}, file: ${fileName}`);

            if (!agentId || !fileName || typeof content !== 'string') {
                vscode.window.showErrorMessage('Invalid arguments for updateAgentMemory command.');
                commandLogger.error(`Invalid arguments received for updateAgentMemory: ${JSON.stringify(args)}`);
                return;
            }

            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('No workspace folder open.');
                commandLogger.error(`updateAgentMemory called with no workspace folder open.`);
                return;
            }

            // Basic path sanitization (prevent traversal outside memory-bank)
            const sanitizedFileName = path.basename(fileName);
            if (sanitizedFileName !== fileName || !fileName.endsWith('.md')) {
                 vscode.window.showErrorMessage(`Invalid file name: ${fileName}. Must be a .md file within the memory-bank directory.`);
                 commandLogger.error(`Invalid file name provided for updateAgentMemory: ${fileName}`);
                 return;
            }

            const memoryFilePath = path.join(
                workspaceFolder.uri.fsPath,
                '.vscode',
                'fuse-agent-context',
                agentId,
                'memory-bank',
                sanitizedFileName
            );

            // Ensure the directory exists
            const memoryDir = path.dirname(memoryFilePath);
            try {
                await fs.mkdir(memoryDir, { recursive: true });
            } catch (error: any) {
                vscode.window.showErrorMessage(`Failed to create memory directory for agent ${agentId}: ${error.message}`);
                commandLogger.error(`Failed to create directory ${memoryDir}: ${error.message}`);
                return;
            }

            // Write the file
            try {
                await fs.writeFile(memoryFilePath, content, 'utf-8');
                commandLogger.info(`Successfully updated ${sanitizedFileName} for agent ${agentId}.`);
                // Optionally show a success message, but might be too noisy
                // vscode.window.showInformationMessage(`Updated ${fileName} for agent ${agentId}.`);
            } catch (error: any) {
                vscode.window.showErrorMessage(`Failed to write memory file ${fileName} for agent ${agentId}: ${error.message}`);
                commandLogger.error(`Failed to write file ${memoryFilePath}: ${error.message}`);
            }
        });
        context.subscriptions.push(updateMemoryCommand);
        // --- End Register Agent Memory Update Command ---

        // Register Agent Coordination Command
        registerAgentCoordinationCommand(context);
        logger.info('Agent coordination command registered.');

        // Return API for other extensions
        const api: TheFuseAPI = {
            async sendMessage(message: string): Promise<string> {
                return await llmManager.generate(message);
            },
            async getAvailableModels(): Promise<string[]> {
                const info = await llmManager.getCurrentProviderInfo();
                return info?.models || [];
            },
            async getCurrentModel(): Promise<string | undefined> {
                const provider = await llmManager.getCurrentProvider();
                const info = provider ? await provider.getInfo() : undefined;
                return info?.models[0]; // Assuming the first model in the list is the current one, or needs refinement
            }
        };

        // Automatically open the main UI when the extension is activated
        // This can be commented out if you don't want the UI to open automatically
        await vscode.commands.executeCommand('thefuse.openMainUI');

        return {
            ...api,
            monitoring: monitoringClient,
            mcpManager,
            agentIntegration,
            chromeWebSocketService
        };

    } catch (error) {
        logger.error('Failed to activate extension:', error);
        throw error;
    }
}

async function handleIncomingMessageFromChrome(
    message: BaseMessage, 
    client: import('ws'),
    llmManager: LLMProviderManager,
    logger: Logger
) {
    switch (message.type) {
        case MessageType.SEND_BROWSER_CONTEXT:
            const pageContext = (message as SendBrowserContextMessage).payload;
            logger.info(`Browser Context: ${pageContext.url} - ${pageContext.title}`);
            vscode.window.showInformationMessage(`Received context: ${pageContext.title}`);
            break;

        case MessageType.REQUEST_LLM_ACTION:
            const requestPayload = (message as RequestLLMActionMessage).payload;
            logger.info(`LLM Action: "${requestPayload.prompt}"`);
            
            let responsePayload: LLMResponseMessage['payload'];
            try {
                const llmResponse = await llmManager.generate(requestPayload.prompt);
                responsePayload = { text: llmResponse };
            } catch (error: any) {
                logger.error("LLM processing error:", error);
                responsePayload = { error: `Failed to process: ${error.message}` };
            }

            const llmResponse: LLMResponseMessage = {
                id: randomUUID(),
                source: MessageSource.VSCODE_EXTENSION,
                timestamp: Date.now(),
                type: MessageType.LLM_RESPONSE,
                correlationId: message.id,
                payload: responsePayload
            };

            if (wsServer) {
                wsServer.sendMessageToClient(client, llmResponse);
            }
            break;
            
        default:
            logger.warn(`Unhandled message type: ${message.type}`);
            const errMsg: ErrorMessage = {
                id: randomUUID(),
                source: MessageSource.VSCODE_EXTENSION,
                timestamp: Date.now(),
                type: MessageType.ERROR_MESSAGE,
                correlationId: message.id,
                payload: { message: `Unhandled message type: ${message.type}` }
            };
            if (wsServer) {
                wsServer.sendMessageToClient(client, errMsg);
            }
    }
}

export function deactivate(): void {
    const logger = getLogger();
    logger.info('Deactivating The New Fuse extension');

    wsServer?.stop();
    logger.info('WebSocket server stopped.');

    // Clean up existing Chrome WebSocket service (if it's still meant to be used separately)
    try {
        const chromeWebSocketService = ChromeWebSocketService.getInstance();
        if (chromeWebSocketService) {
            chromeWebSocketService.dispose();
            logger.info('Chrome WebSocket service disposed');
        }
    } catch (error) {
        logger.error('Error disposing Chrome WebSocket service:', error);
    }

    logger.info('The New Fuse extension deactivated');
}
