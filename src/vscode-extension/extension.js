"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const logging_1 = require("./src/utils/logging");
const relay_service_1 = require("./services/relay-service");
const agent_discovery_1 = require("./services/agent-discovery");
const shared_1 = require("./types/shared"); // Keep only this import for ConnectionStatus
const conversation_manager_1 = require("./services/conversation-manager");
const file_protocol_1 = require("./services/file-protocol");
const chrome_extension_handler_1 = require("./services/chrome-extension-handler");
const chrome_websocket_service_1 = require("./services/chrome-websocket-service");
const core_features_1 = require("./services/core-features");
const llm_provider_manager_1 = require("./llm-provider-manager");
const completions_provider_1 = require("./services/completions-provider");
const completions_panel_1 = require("./web-ui/completions-panel");
const unified_agent_system_1 = require("./services/unified-agent-system");
const unified_llm_orchestrator_1 = require("./services/unified-llm-orchestrator");
const mcp_integration_1 = require("./src/mcp-integration"); // Updated import path
const roo_output_monitor_1 = require("./roo-output-monitor"); // Import Roo integration
const ai_coder_view_1 = require("./web-ui/ai-coder-view"); // Import AI Coder View
// Import our enhanced WebView components
// import { ChatView } from './web-ui/chat-view.js'; // Commented out old view
const chat_interface_1 = require("./src/chat/chat-interface"); // Added new provider import
const agents_view_1 = require("./web-ui/agents-view");
const tools_view_1 = require("./web-ui/tools-view");
const settings_view_1 = require("./web-ui/settings-view");
const model_selector_1 = require("./web-ui/model-selector");
// Initialize output channel
let outputChannel;
async function activate(context) {
    // Initialize logging
    (0, logging_1.initializeLogging)();
    outputChannel = vscode.window.createOutputChannel("The New Fuse");
    try {
        // Initialize core services
        const relayService = relay_service_1.RelayService.getInstance();
        const agentDiscovery = agent_discovery_1.AgentDiscoveryManager.getInstance();
        const conversationManager = conversation_manager_1.ConversationManager.getInstance();
        const fileProtocol = file_protocol_1.FileProtocolService.getInstance();
        const chromeHandler = chrome_extension_handler_1.ChromeExtensionHandler.getInstance();
        const chromeWebSocketService = chrome_websocket_service_1.ChromeWebSocketService.getInstance();
        const coreFeatures = core_features_1.CoreFeaturesManager.getInstance();
        // Create LLM provider manager with proper context
        const llmProviderManager = new llm_provider_manager_1.LLMProviderManager(context, outputChannel);
        const completionsProvider = new completions_provider_1.CompletionsProvider(llmProviderManager);
        // Initialize WebSocket connections array for AI coder integration
        const aiCoderConnections = [];
        // Initialize Roo output monitor with shared connections
        const rooMonitor = new roo_output_monitor_1.RooOutputMonitor(aiCoderConnections);
        let rooMonitoringActive = false;
        // Initialize services in order
        await relayService.initialize();
        await fileProtocol.initialize();
        await chromeHandler.initialize();
        await chromeWebSocketService.initialize();
        await coreFeatures.initialize();
        await llmProviderManager.initialize();
        // Check if this is the first activation
        const isFirstActivation = !context.globalState.get('thefuse.hasActivatedBefore');
        // Register the settings command
        context.subscriptions.push(vscode.commands.registerCommand('thefuse.openSettings', () => {
            settings_view_1.SettingsView.createOrShow(context.extensionUri);
        }));
        // Register command to refresh LLM providers after settings changes
        context.subscriptions.push(vscode.commands.registerCommand('thefuse.refreshLLMProviders', async () => {
            await llmProviderManager.initialize();
            vscode.window.showInformationMessage('LLM providers refreshed');
        }));
        // Register commands for model selection UI
        context.subscriptions.push(vscode.commands.registerCommand('thefuse.openModelSelector', () => {
            model_selector_1.ModelSelector.createOrShow(context.extensionUri);
        }), vscode.commands.registerCommand('thefuse.getLLMProviderManager', () => {
            return llmProviderManager;
        }), vscode.commands.registerCommand('thefuse.getProviders', () => {
            return llmProviderManager.getAllProviders();
        }), vscode.commands.registerCommand('thefuse.getCurrentProvider', () => {
            return llmProviderManager.getCurrentProviderInfo();
        }), vscode.commands.registerCommand('thefuse.getCurrentModel', () => {
            return llmProviderManager.getCurrentModel();
        }), vscode.commands.registerCommand('thefuse.selectProvider', (providerId) => {
            return llmProviderManager.selectProvider(providerId);
        }), vscode.commands.registerCommand('thefuse.selectModel', (providerId, modelId) => {
            return llmProviderManager.setCurrentModel(modelId);
        }));
        // Show communication panel command now opens the improved version
        context.subscriptions.push(vscode.commands.registerCommand('thefuse.showCommunicationPanel', () => {
            const { CommunicationPanel } = require('./web-ui/communication-panel');
            CommunicationPanel.createOrShow(context.extensionUri);
        }));
        // Auto-show the chat interface for any activation (both first-time and subsequent)
        // Always show the communication panel when the extension is activated
        // Additional first-time setup
        if (isFirstActivation) {
            // Show the welcome and setup wizard
            showSetupWizard(context);
            // Optional: Show settings panel for API keys if none are configured
            const config = vscode.workspace.getConfiguration('thefuse');
            const hasApiKeys = config.get('openaiApiKey') || config.get('anthropicApiKey');
            if (!hasApiKeys) {
                setTimeout(() => {
                    vscode.commands.executeCommand('thefuse.openSettings');
                }, 1500); // Delay slightly to ensure proper focus
            }
            // Mark as activated
            context.globalState.update('thefuse.hasActivatedBefore', true);
        }
        // Register a default AI agent required by ConversationManager
        const defaultAgent = {
            id: 'default-ai-assistant',
            name: 'Default AI Assistant',
            provider: 'internal',
            version: '1.0.0',
            capabilities: [],
            lastSeen: Date.now()
        };
        await agentDiscovery.registerAgent(defaultAgent);
        // Explicitly set status as connected after registration
        agentDiscovery.updateAgentStatus(defaultAgent.id, shared_1.ConnectionStatus.CONNECTED);
        (0, logging_1.log)(`Registered and connected default agent: ${defaultAgent.id}`);
        // Initialize unified systems
        const unifiedAgentSystem = (0, unified_agent_system_1.createUnifiedAgentSystem)(context, logging_1.log);
        const unifiedLLMOrchestrator = (0, unified_llm_orchestrator_1.createUnifiedLLMOrchestrator)(context, logging_1.log);
        // Initialize unified agent system
        await unifiedAgentSystem.initialize();
        await unifiedLLMOrchestrator.initialize();
        // Instantiate MCP Integration
        const agentIntegration = new mcp_integration_1.AgentMCPIntegration(context, llmProviderManager, outputChannel);
        await agentIntegration.initialize(); // Initialize the integration
        // Create our enhanced WebView providers
        // const chatView = new ChatView(context.extensionUri); // Commented out old view instantiation
        const chatViewProvider = new chat_interface_1.ChatViewProvider(context.extensionUri, context, llmProviderManager, agentIntegration); // Instantiate new provider
        const agentsView = new agents_view_1.AgentsView(context.extensionUri);
        const toolsView = new tools_view_1.ToolsView(context.extensionUri);
        const aiCoderView = new ai_coder_view_1.AICoderView(context.extensionUri); // Add AICoderView instance
        // Register our enhanced WebView providers
        context.subscriptions.push(vscode.window.registerWebviewViewProvider(chat_interface_1.ChatViewProvider.viewType, chatViewProvider), // Use new provider and its static viewType
        vscode.window.registerWebviewViewProvider('thefuse-agents', agentsView), vscode.window.registerWebviewViewProvider('thefuse-tools', toolsView), vscode.window.registerWebviewViewProvider('thefuse.aiCoderView', aiCoderView));
        // Register Roo monitoring commands
        context.subscriptions.push(vscode.commands.registerCommand('roo.startMonitoring', () => {
            if (!rooMonitoringActive) {
                rooMonitor.startMonitoring();
                rooMonitoringActive = true;
                vscode.window.showInformationMessage('Roo output monitoring started.');
            }
            else {
                vscode.window.showInformationMessage('Roo output monitoring is already active.');
            }
        }));
        context.subscriptions.push(vscode.commands.registerCommand('roo.stopMonitoring', () => {
            if (rooMonitoringActive) {
                rooMonitor.dispose();
                rooMonitoringActive = false;
                vscode.window.showInformationMessage('Roo output monitoring stopped.');
            }
            else {
                vscode.window.showInformationMessage('Roo output monitoring is not active.');
            }
        }));
        // Add "The New Fuse" commands that integrate with the AI coder
        context.subscriptions.push(vscode.commands.registerCommand('thefuse.aiCoder.process', async (code) => {
            try {
                const doc = await vscode.workspace.openTextDocument({ content: code, language: 'javascript' });
                const editor = await vscode.window.showTextDocument(doc);
                // Replace with actual AI coder command if available
                // Currently a placeholder for future integration
                vscode.window.showInformationMessage('Processing with AI coder');
                return editor.document.getText();
            }
            catch (error) {
                (0, logging_1.logError)('Error processing with AI coder', error);
                throw error;
            }
        }));
        // Register AI coder connection status command
        context.subscriptions.push(vscode.commands.registerCommand('thefuse.showAICoderStatus', () => {
            const rooStatus = rooMonitoringActive ? 'Active' : 'Inactive';
            const clientCount = aiCoderConnections.length;
            vscode.window.showInformationMessage(`AI Coder Integration: Roo monitoring: ${rooStatus}, Connected clients: ${clientCount}`);
        }));
        // Register command to get AI Coder status
        context.subscriptions.push(vscode.commands.registerCommand('thefuse.aiCoder.getStatus', () => {
            // Gather status information for AI Coder View
            const config = vscode.workspace.getConfiguration('thefuse');
            const mainPort = config.get('aiCoder.port', 3710);
            const rooPort = config.get('aiCoder.rooPort', 3711);
            return {
                rooMonitoring: rooMonitoringActive,
                wsActive: true, // Assumed to be active - implement proper check if needed
                clients: aiCoderConnections.map((ws, index) => {
                    // Extract client information from WebSocket
                    // This is a simplified example - add more details based on your WebSocket implementation
                    return {
                        id: `client-${index}`,
                        ip: 'localhost',
                        connectionTime: Date.now(),
                        authenticated: true
                    };
                }),
                rooPorts: {
                    main: rooPort
                },
                wsPorts: {
                    main: mainPort
                }
            };
        }));
        // Register disposables
        context.subscriptions.push({ dispose: () => relayService.dispose() }, { dispose: () => agentDiscovery.dispose() }, { dispose: () => conversationManager.dispose() }, { dispose: () => fileProtocol.dispose() }, { dispose: () => chromeHandler.dispose() }, { dispose: () => chromeWebSocketService.dispose() }, { dispose: () => coreFeatures.dispose() }, { dispose: () => llmProviderManager.dispose() }, { dispose: () => completionsProvider.dispose() }, { dispose: () => rooMonitor.dispose() }, // Add Roo monitor disposal
        { dispose: () => unifiedAgentSystem.dispose() }, { dispose: () => unifiedLLMOrchestrator.dispose() }, 
        // { dispose: () => chatView.dispose() }, // Commented out old view disposal
        { dispose: () => agentsView.dispose() }, { dispose: () => toolsView.dispose() }, { dispose: () => aiCoderView.dispose() });
        // Register connection status command
        context.subscriptions.push(vscode.commands.registerCommand('thefuse.showConnectionStatus', () => {
            const chromeStatus = chromeHandler.getStatus();
            const wsStatus = chromeWebSocketService.isActive() ? 'Connected' : 'Disconnected';
            const wsClients = chromeWebSocketService.getClientCount();
            const message = `Chrome Extension: ${chromeStatus} | WebSocket Server: ${wsStatus} (${wsClients} clients)`;
            vscode.window.showInformationMessage(message);
        }));
        // Register command to restart the Chrome WebSocket service
        context.subscriptions.push(vscode.commands.registerCommand('thefuse.restartChromeWebSocket', async () => {
            try {
                chromeWebSocketService.dispose();
                await chromeWebSocketService.initialize();
                vscode.window.showInformationMessage('Chrome WebSocket service restarted');
            }
            catch (error) {
                (0, logging_1.logError)('Failed to restart Chrome WebSocket service:', error);
                (0, logging_1.showError)('Failed to restart Chrome WebSocket service', error);
            }
        }));
        // Register command to show Chrome WebSocket client information
        context.subscriptions.push(vscode.commands.registerCommand('thefuse.showChromeClients', () => {
            const clients = chromeWebSocketService.getClientInfo();
            if (clients.length === 0) {
                vscode.window.showInformationMessage('No Chrome extension clients connected');
                return;
            }
            // Create a markdown string with client information
            const markdown = new vscode.MarkdownString();
            markdown.appendMarkdown('# Connected Chrome Extension Clients\n\n');
            markdown.appendMarkdown('| Client ID | IP Address | Authenticated | Connection Time |\n');
            markdown.appendMarkdown('|----------|------------|---------------|----------------|\n');
            for (const client of clients) {
                const connectionTime = new Date(client.connectionTime).toLocaleTimeString();
                markdown.appendMarkdown(`| ${client.id} | ${client.ip} | ${client.authenticated ? '✓' : '✗'} | ${connectionTime} |\n`);
            }
            // Get compression, rate limit, and auth info
            const compressionInfo = chromeWebSocketService.getCompressionInfo();
            const rateLimitInfo = chromeWebSocketService.getRateLimitInfo();
            const authInfo = chromeWebSocketService.getAuthInfo();
            // Show the markdown in a webview panel
            const panel = vscode.window.createWebviewPanel('chromeClients', 'Chrome Extension Clients', vscode.ViewColumn.One, {});
            panel.webview.html = `
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Chrome Extension Clients</title>
                        <style>
                            body {
                                font-family: var(--vscode-font-family);
                                padding: 20px;
                            }
                            table {
                                border-collapse: collapse;
                                width: 100%;
                                margin-bottom: 20px;
                            }
                            th, td {
                                border: 1px solid var(--vscode-editor-foreground);
                                padding: 8px;
                                text-align: left;
                            }
                            th {
                                background-color: var(--vscode-editor-selectionBackground);
                            }
                            .section {
                                margin-top: 30px;
                                margin-bottom: 20px;
                            }
                        </style>
                    </head>
                    <body>
                        <h1>Connected Chrome Extension Clients</h1>
                        <p>Total clients: ${clients.length}</p>
                        <table>
                            <tr>
                                <th>Client ID</th>
                                <th>IP Address</th>
                                <th>Authenticated</th>
                                <th>Connection Time</th>
                            </tr>
                            ${clients.map(client => `
                                <tr>
                                    <td>${client.id}</td>
                                    <td>${client.ip}</td>
                                    <td>${client.authenticated ? '✓' : '✗'}</td>
                                    <td>${new Date(client.connectionTime).toLocaleTimeString()}</td>
                                </tr>
                            `).join('')}
                        </table>

                        <div class="section">
                            <h2>WebSocket Compression</h2>
                            <p>Status: ${compressionInfo.enabled ? 'Enabled' : 'Disabled'}</p>
                            ${compressionInfo.enabled ? `
                                <table>
                                    <tr>
                                        <th>Setting</th>
                                        <th>Value</th>
                                    </tr>
                                    <tr>
                                        <td>Threshold (bytes)</td>
                                        <td>${compressionInfo.settings.threshold}</td>
                                    </tr>
                                    <tr>
                                        <td>Compression Level</td>
                                        <td>${compressionInfo.settings.level}</td>
                                    </tr>
                                    <tr>
                                        <td>Memory Level</td>
                                        <td>${compressionInfo.settings.memLevel}</td>
                                    </tr>
                                    <tr>
                                        <td>Client No Context Takeover</td>
                                        <td>${compressionInfo.settings.clientNoContextTakeover ? 'Yes' : 'No'}</td>
                                    </tr>
                                    <tr>
                                        <td>Server No Context Takeover</td>
                                        <td>${compressionInfo.settings.serverNoContextTakeover ? 'Yes' : 'No'}</td>
                                    </tr>
                                </table>
                            ` : ''}
                        </div>

                        <div class="section">
                            <h2>WebSocket Rate Limiting</h2>
                            <p>Status: ${rateLimitInfo.enabled ? 'Enabled' : 'Disabled'}</p>
                            ${rateLimitInfo.enabled ? `
                                <table>
                                    <tr>
                                        <th>Setting</th>
                                        <th>Value</th>
                                    </tr>
                                    <tr>
                                        <td>Max Messages</td>
                                        <td>${rateLimitInfo.settings.maxMessages}</td>
                                    </tr>
                                    <tr>
                                        <td>Time Window</td>
                                        <td>${rateLimitInfo.settings.windowMs / 1000} seconds</td>
                                    </tr>
                                    <tr>
                                        <td>Emit Warnings</td>
                                        <td>${rateLimitInfo.settings.emitWarnings ? 'Yes' : 'No'}</td>
                                    </tr>
                                    <tr>
                                        <td>Warning Threshold</td>
                                        <td>${rateLimitInfo.settings.warningThreshold * 100}%</td>
                                    </tr>
                                </table>

                                <h3>Client Rate Limit Status</h3>
                                <table>
                                    <tr>
                                        <th>Client ID</th>
                                        <th>Limited</th>
                                        <th>Remaining</th>
                                        <th>Reset In</th>
                                    </tr>
                                    ${rateLimitInfo.clients.map(client => `
                                        <tr>
                                            <td>${client.id}</td>
                                            <td>${client.limited ? '⚠️ Yes' : 'No'}</td>
                                            <td>${client.remaining}</td>
                                            <td>${Math.ceil(client.resetMs / 1000)} seconds</td>
                                        </tr>
                                    `).join('')}
                                </table>
                            ` : ''}
                        </div>

                        <div class="section">
                            <h2>WebSocket Authentication</h2>
                            <p>Status: ${authInfo.enabled ? 'Enabled' : 'Disabled'}</p>
                            ${authInfo.enabled ? `
                                <table>
                                    <tr>
                                        <th>Setting</th>
                                        <th>Value</th>
                                    </tr>
                                    <tr>
                                        <td>Require Authentication</td>
                                        <td>${authInfo.settings.requireAuth ? 'Yes' : 'No'}</td>
                                    </tr>
                                    <tr>
                                        <td>Token Expiration</td>
                                        <td>${authInfo.settings.tokenExpirationMs / 1000 / 60} minutes</td>
                                    </tr>
                                    <tr>
                                        <td>Refresh Token Expiration</td>
                                        <td>${authInfo.settings.refreshTokenExpirationMs / 1000 / 60 / 60} hours</td>
                                    </tr>
                                </table>

                                <h3>Client Authentication Status</h3>
                                <table>
                                    <tr>
                                        <th>Client ID</th>
                                        <th>Authenticated</th>
                                        <th>Token Expires</th>
                                    </tr>
                                    ${authInfo.clients.map(client => `
                                        <tr>
                                            <td>${client.id}</td>
                                            <td>${client.authenticated ? '✓' : '✗'}</td>
                                            <td>${client.tokenExpiresAt ? new Date(client.tokenExpiresAt).toLocaleTimeString() : 'N/A'}</td>
                                        </tr>
                                    `).join('')}
                                </table>
                            ` : ''}
                        </div>
                    </body>
                    </html>
                `;
        }));
        // Register command to toggle WebSocket compression
        context.subscriptions.push(vscode.commands.registerCommand('thefuse.toggleWebSocketCompression', async () => {
            try {
                const config = vscode.workspace.getConfiguration('thefuse');
                const currentSetting = config.get('enableWebSocketCompression', false);
                // Update the setting
                await config.update('enableWebSocketCompression', !currentSetting, true);
                // Restart the WebSocket service to apply the change
                chromeWebSocketService.dispose();
                await chromeWebSocketService.initialize();
                vscode.window.showInformationMessage(`WebSocket compression ${!currentSetting ? 'enabled' : 'disabled'}. WebSocket server restarted.`);
            }
            catch (error) {
                logger.error('Failed to toggle WebSocket compression:', error);
                vscode.window.showErrorMessage('Failed to toggle WebSocket compression');
            }
        }));
        // Register command to toggle WebSocket rate limiting
        context.subscriptions.push(vscode.commands.registerCommand('thefuse.toggleWebSocketRateLimit', async () => {
            try {
                const config = vscode.workspace.getConfiguration('thefuse');
                const currentSetting = config.get('enableWebSocketRateLimit', true);
                // Update the setting
                await config.update('enableWebSocketRateLimit', !currentSetting, true);
                // Restart the WebSocket service to apply the change
                chromeWebSocketService.dispose();
                await chromeWebSocketService.initialize();
                vscode.window.showInformationMessage(`WebSocket rate limiting ${!currentSetting ? 'enabled' : 'disabled'}. WebSocket server restarted.`);
            }
            catch (error) {
                logger.error('Failed to toggle WebSocket rate limiting:', error);
                vscode.window.showErrorMessage('Failed to toggle WebSocket rate limiting');
            }
        }));
        // Register command to toggle WebSocket authentication
        context.subscriptions.push(vscode.commands.registerCommand('thefuse.toggleWebSocketAuth', async () => {
            try {
                const config = vscode.workspace.getConfiguration('thefuse');
                const currentSetting = config.get('enableWebSocketAuth', true);
                // Update the setting
                await config.update('enableWebSocketAuth', !currentSetting, true);
                // Restart the WebSocket service to apply the change
                chromeWebSocketService.dispose();
                await chromeWebSocketService.initialize();
                vscode.window.showInformationMessage(`WebSocket authentication ${!currentSetting ? 'enabled' : 'disabled'}. WebSocket server restarted.`);
            }
            catch (error) {
                logger.error('Failed to toggle WebSocket authentication:', error);
                vscode.window.showErrorMessage('Failed to toggle WebSocket authentication');
            }
        }));
        // Register startConversation command that was missing
        context.subscriptions.push(vscode.commands.registerCommand('thefuse.startConversation', (agentId) => {
            try {
                // Reveal the chat sidebar view
                vscode.commands.executeCommand('workbench.view.extension.thefuse-sidebar');
                if (agentId) {
                    // If agent ID was provided, potentially switch conversation or context
                    // For now, just show an info message
                    vscode.window.showInformationMessage(`Starting conversation context with ${agentId}`);
                }
                else {
                    vscode.window.showInformationMessage("AI conversation view opened");
                }
            }
            catch (error) {
                (0, logging_1.logError)('Failed to start conversation:', error);
                (0, logging_1.showError)("Failed to start AI conversation", error);
            }
        }));
        // Register sendMessage command
        context.subscriptions.push(vscode.commands.registerCommand('thefuse.sendMessage', async (text) => {
            try {
                if (!text) {
                    text = await vscode.window.showInputBox({
                        prompt: 'Enter your message',
                        placeHolder: 'Type your message here'
                    });
                }
                if (text) {
                    await conversationManager.sendMessage(text);
                    vscode.window.showInformationMessage('Message sent successfully');
                }
            }
            catch (error) {
                (0, logging_1.logError)('Failed to send message:', error);
                (0, logging_1.showError)("Failed to send message", error);
            }
        }));
        // Register clearMessages command
        context.subscriptions.push(vscode.commands.registerCommand('thefuse.clearMessages', async () => {
            try {
                await conversationManager.clearMessages();
                vscode.window.showInformationMessage('Messages cleared');
            }
            catch (error) {
                (0, logging_1.logError)('Failed to clear messages:', error);
                (0, logging_1.showError)("Failed to clear messages", error);
            }
        }));
        // Register toggleCompletions command (new)
        context.subscriptions.push(vscode.commands.registerCommand('thefuse.toggleCompletions', () => {
            const config = vscode.workspace.getConfiguration('thefuse');
            const enableCompletions = config.get('enableCompletions');
            config.update('enableCompletions', !enableCompletions, true)
                .then(() => {
                vscode.window.showInformationMessage(`Inline completions ${!enableCompletions ? 'enabled' : 'disabled'}`);
            });
        }));
        // Register selectModel command (new)
        context.subscriptions.push(vscode.commands.registerCommand('thefuse.selectModel', async () => {
            const models = await llmProviderManager.getAvailableModels();
            const currentModel = await llmProviderManager.getCurrentModel();
            const selected = await vscode.window.showQuickPick(models.map(model => ({
                label: model,
                description: model === currentModel ? '(current)' : ''
            })), { placeHolder: 'Select an AI model' });
            if (selected) {
                await llmProviderManager.setCurrentModel(selected.label);
                vscode.window.showInformationMessage(`Model set to ${selected.label}`);
            }
        }));
        // Register Chrome integration command
        context.subscriptions.push(vscode.commands.registerCommand('thefuse.connectChromeExtension', async () => {
            try {
                await chromeHandler.connect();
                vscode.window.showInformationMessage('Connected to Chrome extension');
            }
            catch (error) {
                (0, logging_1.logError)('Failed to connect to Chrome extension:', error);
                (0, logging_1.showError)('Failed to connect to Chrome extension', error);
            }
        }));
        // Register generate completions command
        context.subscriptions.push(vscode.commands.registerCommand('thefuse.generateCompletions', async () => {
            try {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showInformationMessage('No active editor');
                    return;
                }
                const position = editor.selection.active;
                const document = editor.document;
                // Generate completions with a loading indicator
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "Generating AI completions...",
                    cancellable: false
                }, async (progress) => {
                    // Get current file content
                    const fileContent = document.getText();
                    const cursorPosition = document.offsetAt(position);
                    // Generate completions
                    const solutions = await completionsProvider.getCompletions(fileContent, cursorPosition, document.languageId);
                    if (!solutions || solutions.length === 0) {
                        vscode.window.showInformationMessage('No completions generated');
                        return;
                    }
                    // Show completions in panel
                    completions_panel_1.CompletionsPanel.createOrShow(context.extensionUri, solutions, document, position);
                });
            }
            catch (error) {
                (0, logging_1.logError)('Error generating completions:', error);
                (0, logging_1.showError)('Failed to generate completions', error);
            }
        }));
        // Register explain code command
        context.subscriptions.push(vscode.commands.registerCommand('thefuse.explainCode', async () => {
            try {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showInformationMessage('No active editor');
                    return;
                }
                const selection = editor.selection;
                if (selection.isEmpty) {
                    vscode.window.showInformationMessage('Please select code to explain');
                    return;
                }
                const codeToExplain = editor.document.getText(selection);
                const language = editor.document.languageId;
                // Generate explanation with a loading indicator
                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "Explaining code...",
                    cancellable: false
                }, async (progress) => {
                    const explanation = await completionsProvider.getCodeExplanation(codeToExplain, language);
                    if (!explanation) {
                        vscode.window.showInformationMessage('Could not explain code');
                        return;
                    }
                    // Create a webview to display explanation
                    const panel = vscode.window.createWebviewPanel('codeExplanation', 'Code Explanation', vscode.ViewColumn.Beside, { enableScripts: true });
                    panel.webview.html = getCodeExplanationHtml(panel.webview, context.extensionUri, explanation, language);
                });
            }
            catch (error) {
                (0, logging_1.logError)('Error explaining code:', error);
                (0, logging_1.showError)('Failed to explain code', error);
            }
        }));
        // Register refactor code command
        context.subscriptions.push(vscode.commands.registerCommand('thefuse.refactorCode', async () => {
            try {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showInformationMessage('No active editor');
                    return;
                }
                const selection = editor.selection;
                if (selection.isEmpty) {
                    vscode.window.showInformationMessage('Please select code to refactor');
                    return;
                }
                const codeToRefactor = editor.document.getText(selection);
                const document = editor.document;
                // Prompt for refactoring instructions
                const instructions = await vscode.window.showInputBox({
                    prompt: 'Enter refactoring instructions (optional)',
                    placeHolder: 'e.g., Extract this into a function, Use async/await, etc.'
                });
                if (instructions === undefined) {
                    return; // User cancelled
                }
                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "Refactoring code...",
                    cancellable: false
                }, async (progress) => {
                    const refactored = await completionsProvider.getCodeRefactoring(codeToRefactor, document.languageId, instructions);
                    if (!refactored || !refactored.code) {
                        vscode.window.showInformationMessage('Could not refactor code');
                        return;
                    }
                    // Create a webview to preview and apply changes
                    const panel = vscode.window.createWebviewPanel('codeRefactoring', 'Code Refactoring', vscode.ViewColumn.Beside, { enableScripts: true });
                    panel.webview.html = getCodeRefactoringHtml(panel.webview, context.extensionUri, codeToRefactor, refactored.code, refactored.explanation || 'Code refactored based on instructions.', document.languageId);
                    // Handle messages from the webview
                    panel.webview.onDidReceiveMessage(async (message) => {
                        if (message.command === 'applyRefactoring') {
                            await editor.edit(editBuilder => {
                                editBuilder.replace(selection, message.code);
                            });
                            panel.dispose();
                            vscode.window.showInformationMessage('Refactoring applied');
                        }
                    });
                });
            }
            catch (error) {
                (0, logging_1.logError)('Error refactoring code:', error);
                (0, logging_1.showError)('Failed to refactor code', error);
            }
        }));
        // Create status bar items
        const chromeStatusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        chromeStatusItem.text = "$(chrome) Chrome";
        chromeStatusItem.tooltip = "Chrome Extension Connection Status";
        chromeStatusItem.command = 'thefuse.showConnectionStatus';
        chromeStatusItem.show();
        context.subscriptions.push(chromeStatusItem);
        // Create completions status bar item
        const completionsStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
        completionsStatusBarItem.text = "$(lightbulb) AI";
        completionsStatusBarItem.tooltip = "AI Completions Status";
        completionsStatusBarItem.command = 'thefuse.toggleCompletions';
        completionsStatusBarItem.show();
        context.subscriptions.push(completionsStatusBarItem);
        // Update status bar based on completions setting
        const updateCompletionsStatusBar = () => {
            const config = vscode.workspace.getConfiguration('thefuse');
            const enabled = config.get('enableCompletions');
            completionsStatusBarItem.text = enabled
                ? "$(lightbulb) AI: ON"
                : "$(lightbulb) AI: OFF";
        };
        updateCompletionsStatusBar();
        // Listen for configuration changes
        context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('thefuse.enableCompletions')) {
                updateCompletionsStatusBar();
            }
        }));
        // Create improved status bar items
        // LLM Provider status bar item
        const llmStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        llmStatusBarItem.text = "$(hubot) Select LLM";
        llmStatusBarItem.tooltip = "Select LLM Provider & Model";
        llmStatusBarItem.command = 'thefuse.openModelSelector'; // Updated to use new Model Selector UI
        llmStatusBarItem.show();
        context.subscriptions.push(llmStatusBarItem);
        // Update LLM status bar with current provider/model
        const updateLLMStatusBar = async () => {
            const providerInfo = await llmProviderManager.getCurrentProviderInfo();
            if (providerInfo) {
                const modelName = await llmProviderManager.getCurrentModel();
                const shortModelName = modelName.length > 12
                    ? modelName.substring(0, 10) + '...'
                    : modelName;
                llmStatusBarItem.text = `$(hubot) ${providerInfo.name}: ${shortModelName}`;
            }
            else {
                llmStatusBarItem.text = '$(hubot) No LLM Selected';
            }
        };
        // Run initial update
        updateLLMStatusBar();
        // The New Fuse main button
        const mainStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
        mainStatusBarItem.text = "$(rocket) The New Fuse";
        mainStatusBarItem.tooltip = "Open The New Fuse Chat Interface";
        mainStatusBarItem.command = 'thefuse.showCommunicationPanel';
        mainStatusBarItem.show();
        context.subscriptions.push(mainStatusBarItem);
        // Add settings button to status bar
        const settingsStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
        settingsStatusBarItem.text = "$(gear) API Keys";
        settingsStatusBarItem.tooltip = "Configure The New Fuse API Keys";
        settingsStatusBarItem.command = 'thefuse.openSettings';
        settingsStatusBarItem.show();
        context.subscriptions.push(settingsStatusBarItem);
        // Additional status bar for AI coder integration
        const aiCoderStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 98);
        aiCoderStatusBarItem.text = "$(code) AI Coder";
        aiCoderStatusBarItem.tooltip = "AI Coder Integration Status";
        aiCoderStatusBarItem.command = 'thefuse.showAICoderStatus';
        aiCoderStatusBarItem.show();
        context.subscriptions.push(aiCoderStatusBarItem);
        // Log successful activation
        (0, logging_1.showInfo)('The New Fuse extension activated successfully');
        // Start idle message listener
        chromeHandler.startIdleListener();
    }
    catch (error) {
        (0, logging_1.showError)('Failed to activate The New Fuse extension', error);
    }
}
/**
 * Shows the setup wizard for first-time users
 */
function showSetupWizard(context) {
    const panel = vscode.window.createWebviewPanel('fuseSetupWizard', 'Welcome to The New Fuse', vscode.ViewColumn.Active, {
        enableScripts: true,
        retainContextWhenHidden: true
    });
    panel.webview.html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                padding: 20px;
                line-height: 1.5;
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
            }
            .wizard-container {
                max-width: 700px;
                margin: 0 auto;
            }
            h1 {
                font-size: 24px;
                margin-bottom: 20px;
                color: var(--vscode-textLink-foreground);
            }
            .step {
                margin-bottom: 30px;
                padding: 20px;
                border: 1px solid var(--vscode-panel-border);
                border-radius: 8px;
                background-color: var(--vscode-editor-background);
            }
            .step h2 {
                margin-top: 0;
                display: flex;
                align-items: center;
                font-size: 18px;
                margin-bottom: 15px;
            }
            .step-icon {
                margin-right: 10px;
                font-size: 24px;
            }
            .action-buttons {
                display: flex;
                gap: 10px;
                margin-top: 15px;
            }
            button {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
            }
            button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
            button.secondary {
                background-color: transparent;
                border: 1px solid var(--vscode-button-background);
                color: var(--vscode-button-background);
            }
            button.secondary:hover {
                background-color: var(--vscode-button-hoverBackground);
                opacity: 0.7;
            }
            .feature-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 15px;
                margin-top: 20px;
            }
            .feature-item {
                padding: 15px;
                border: 1px solid var(--vscode-panel-border);
                border-radius: 6px;
            }
            .feature-icon {
                font-size: 24px;
                margin-bottom: 10px;
            }
            .feature-title {
                font-weight: 600;
                margin-bottom: 5px;
            }
        </style>
    </head>
    <body>
        <div class="wizard-container">
            <h1>Welcome to The New Fuse</h1>

            <div class="step">
                <h2><span class="step-icon">🔑</span> Set up API Keys</h2>
                <p>To get the most out of The New Fuse, you'll need to configure your LLM provider API keys.</p>
                <div class="action-buttons">
                    <button onclick="configureApiKeys()">Configure API Keys</button>
                    <button class="secondary" onclick="skipStep()">Skip for Now</button>
                </div>
            </div>

            <div class="step">
                <h2><span class="step-icon">💬</span> Start Using The New Fuse</h2>
                <p>Your AI assistant is ready to help! Open the communication panel to start a conversation.</p>
                <div class="action-buttons">
                    <button onclick="openChatPanel()">Open Chat Panel</button>
                </div>
            </div>

            <div class="step">
                <h2><span class="step-icon">✨</span> Key Features</h2>
                <div class="feature-grid">
                    <div class="feature-item">
                        <div class="feature-icon">🤖</div>
                        <div class="feature-title">AI Chat</div>
                        <p>Chat with multiple AI models right from your editor</p>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">💡</div>
                        <div class="feature-title">Code Completions</div>
                        <p>Get smart code suggestions as you type</p>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">🔄</div>
                        <div class="feature-title">Model Switching</div>
                        <p>Easily switch between different LLM models</p>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">📡</div>
                        <div class="feature-title">Inter-AI Communication</div>
                        <p>Allow different AI agents to collaborate</p>
                    </div>
                </div>
                <div class="action-buttons" style="margin-top: 20px;">
                    <button onclick="closeWizard()">Got It!</button>
                </div>
            </div>
        </div>

        <script>
            const vscode = acquireVsCodeApi();

            function configureApiKeys() {
                vscode.postMessage({ command: 'configureApiKeys' });
            }

            function skipStep() {
                vscode.postMessage({ command: 'skipApiKeySetup' });
            }

            function openChatPanel() {
                vscode.postMessage({ command: 'openChatPanel' });
            }

            function closeWizard() {
                vscode.postMessage({ command: 'closeWizard' });
            }
        </script>
    </body>
    </html>`;
    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(message => {
        switch (message.command) {
            case 'configureApiKeys':
                vscode.commands.executeCommand('thefuse.openSettings');
                break;
            case 'skipApiKeySetup':
                // Just continue
                break;
            case 'openChatPanel':
                vscode.commands.executeCommand('thefuse.showCommunicationPanel');
                break;
            case 'closeWizard':
                panel.dispose();
                break;
        }
    }, undefined, context.subscriptions);
}
/**
 * Generate HTML for the code explanation webview
 */
function getCodeExplanationHtml(webview, extensionUri, explanation, language) {
    const cspSource = webview.cspSource;
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource}; script-src ${cspSource};">
        <title>Code Explanation</title>
        <style>
            body {
                font-family: var(--vscode-font-family);
                font-size: var(--vscode-font-size);
                color: var(--vscode-editor-foreground);
                padding: 20px;
                line-height: 1.6;
            }
            h1 {
                font-size: 1.5em;
                margin-bottom: 20px;
                border-bottom: 1px solid var(--vscode-panel-border);
                padding-bottom: 10px;
            }
            .section {
                margin-bottom: 20px;
            }
            h2 {
                font-size: 1.2em;
                margin-top: 20px;
                margin-bottom: 10px;
            }
            pre {
                background-color: var(--vscode-editor-background);
                padding: 15px;
                border-radius: 5px;
                overflow: auto;
                margin: 10px 0;
                font-family: var(--vscode-editor-font-family);
                font-size: var(--vscode-editor-font-size);
            }
            .explanation {
                line-height: 1.6;
            }
        </style>
    </head>
    <body>
        <h1>Code Explanation</h1>

        <div class="section explanation">
            ${explanation.explanation || explanation}
        </div>
    </body>
    </html>`;
}
/**
 * Generate HTML for the code refactoring webview
 */
function getCodeRefactoringHtml(webview, extensionUri, originalCode, refactoredCode, explanation, language) {
    const cspSource = webview.cspSource;
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource}; script-src ${cspSource};">
        <title>Code Refactoring</title>
        <style>
            body {
                font-family: var(--vscode-font-family);
                font-size: var(--vscode-font-size);
                color: var(--vscode-editor-foreground);
                padding: 20px;
                line-height: 1.6;
            }
            h1, h2 {
                font-weight: normal;
            }
            .explanation {
                background-color: var(--vscode-editor-background);
                padding: 15px;
                border-radius: 5px;
                border-left: 4px solid var(--vscode-activityBarBadge-background);
            }
            .columns {
                display: flex;
                gap: 20px;
                margin-top: 20px;
            }
            .column {
                flex: 1;
            }
            pre {
                background-color: var(--vscode-editor-background);
                padding: 15px;
                border-radius: 5px;
                overflow: auto;
                margin: 10px 0;
                font-family: var(--vscode-editor-font-family);
                font-size: var(--vscode-editor-font-size);
            }
            button {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 8px 16px;
                border-radius: 2px;
                cursor: pointer;
                margin-top: 20px;
            }
            button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
        </style>
    </head>
    <body>
        <h1>Code Refactoring</h1>

        <div class="explanation">
            ${explanation}
        </div>

        <div class="columns">
            <div class="column">
                <h2>Original Code</h2>
                <pre>${escapeHtml(originalCode)}</pre>
            </div>
            <div class="column">
                <h2>Refactored Code</h2>
                <pre>${escapeHtml(refactoredCode)}</pre>
            </div>
        </div>

        <button id="applyBtn">Apply Refactoring</button>

        <script>
            const vscode = acquireVsCodeApi();

            document.getElementById('applyBtn').addEventListener('click', () => {
                vscode.postMessage({
                    command: 'applyRefactoring',
                    code: ${JSON.stringify(refactoredCode)}
                });
            });
        </script>
    </body>
    </html>`;
}
/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</ / g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
function deactivate() {
    // Cleanup will be handled by the disposables
}
//# sourceMappingURL=extension.js.map