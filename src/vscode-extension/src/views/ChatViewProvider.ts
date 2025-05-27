import * as vscode from 'vscode';
import { AgentMessage, AgentMessageType, AgentCommunicationManager } from '../types';
import { LLMProviderManager } from '../llm/LLMProviderManager';
import { LLMMonitoringService } from '../services/LLMMonitoringService';
import { v4 as uuidv4 } from 'uuid'; // Add uuid import

// Add interfaces for chat sessions
export interface ChatSession {
    id: string;
    name: string;
    messages: AgentMessage[];
    createdAt: number;
    updatedAt: number;
}

export interface StarredMessage {
    id: string;
    sessionId: string;
    messageId: string;
    content: string;
    timestamp: number;
    note?: string;
}

export class ChatViewProvider {
    public static readonly viewType = 'theNewFuse.chatView';
    private _panel: vscode.WebviewView | undefined;
    private _hostWebview: vscode.Webview | undefined;
    private _disposables: vscode.Disposable[] = [];
    private _messages: AgentMessage[] = [];
    private _llmMonitoringService?: LLMMonitoringService;

    // Add properties for chat sessions
    private _sessions: ChatSession[] = [];
    private _currentSessionId: string | undefined;
    private _starredMessages: StarredMessage[] = [];

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _context: vscode.ExtensionContext,
        private readonly _llmManager: LLMProviderManager,
        private readonly _communicationManager?: AgentCommunicationManager,
        llmMonitoringService?: LLMMonitoringService
    ) {
        this._llmMonitoringService = llmMonitoringService;

        if (this._communicationManager) {
            this._communicationManager.onMessage(message => {
                this.handleIncomingAgentMessage(message);
            });
        }

        this.loadSessions();
        this.loadStarredMessages();
    }

    public setHostWebview(webview: vscode.Webview) {
        this._hostWebview = webview;
        this._hostWebview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, 'media'),
                vscode.Uri.joinPath(this._extensionUri, 'dist'),
                vscode.Uri.joinPath(this._extensionUri, 'node_modules')
            ]
        };
        this.loadMessages();
        this._hostWebview.onDidReceiveMessage(
            async (message) => {
                try {
                    console.log('Received message from webview:', message.type);
                    switch (message.type) {
                        case 'sendMessage':
                            await this.handleUserMessage(message.text);
                            break;
                        case 'executeCommand':
                            await this.executeCommand(message.command);
                            break;
                        case 'clearHistory':
                            this.clearChatHistory();
                            break;
                        case 'newChat':
                            await this.handleNewChat();
                            break;
                        case 'viewerReady':
                            this.displaySavedMessages();
                            await this.updateInitialProviderBadge();
                            this.sendSavedChatsList();
                            break;
                        case 'getSavedChats':
                            this.sendSavedChatsList();
                            break;
                        case 'saveChat':
                            this.saveCurrentChatSession(message.name);
                            break;
                        case 'switchChat':
                            this.switchChatSession(message.chatId);
                            break;
                        case 'deleteChat':
                            this.deleteChatSession(message.chatId);
                            break;
                        case 'exportChatHistory':
                            this.exportChatHistory();
                            break;
                        case 'importChatHistory':
                            this.importChatHistory();
                            break;
                        case 'viewStarredMessages':
                            this.viewStarredMessages();
                            break;
                        case 'starMessage':
                            this.starMessage(message.messageId, message.content, message.note);
                            break;
                        case 'unstarMessage':
                            this.unstarMessage(message.messageId);
                            break;
                        case 'openSettings':
                            break;
                        default:
                            console.warn('Unknown message type received:', message.type);
                    }
                } catch (error) {
                    console.error('Error handling webview message:', error);
                    try {
                        await this._hostWebview?.postMessage({
                            type: 'error',
                            message: `Error processing request: ${error instanceof Error ? error.message : 'Unknown error'}`
                        });
                    } catch (postError) {
                        console.error('Failed to send error message to webview:', postError);
                    }
                }
            },
            undefined,
            this._disposables
        );
    }

    private sendSavedChatsList(): void {
        if (this._hostWebview) {
            const chatsList = this._sessions.map(session => ({
                id: session.id,
                name: session.name,
                updatedAt: session.updatedAt
            }));
            this._hostWebview.postMessage({
                type: 'savedChatsList',
                chats: chatsList,
                currentChatId: this._currentSessionId
            });
        }
    }

    private showNotification(message: string): void {
        if (this._hostWebview) {
            this._hostWebview.postMessage({
                type: 'notification',
                message: message,
                notificationType: 'info'
            });
        }
    }

    public async viewStarredMessages(): Promise<void> {
        if (!this._hostWebview) { return; }

        const items = this._starredMessages.map(starred => ({
            label: starred.content.substring(0, 50) + (starred.content.length > 50 ? '...' : ''),
            description: `Session: ${this._sessions.find(s => s.id === starred.sessionId)?.name || 'Unknown'}`,
            detail: starred.note || 'No note',
            starredMessage: starred
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a starred message to view details or unstar'
        });

        if (selected) {
            const action = await vscode.window.showQuickPick(['View Full Message', 'Unstar Message'], {
                placeHolder: `Actions for: ${selected.label}`
            });

            if (action === 'View Full Message') {
                const fullMessage = `**Starred Message from Session "${this._sessions.find(s => s.id === selected.starredMessage.sessionId)?.name || 'Unknown'}"**\n\n${selected.starredMessage.content}\n\n---\n*Note: ${selected.starredMessage.note || 'N/A'}*\n*Starred on: ${new Date(selected.starredMessage.timestamp).toLocaleString()}*`;
                vscode.window.showInformationMessage(fullMessage, { modal: true });
            } else if (action === 'Unstar Message') {
                this.unstarMessage(selected.starredMessage.id);
            }
        }
    }

    public getHtmlBodySnippet(webview: vscode.Webview, nonce: string): string {
        // Get URIs for resources
        const getUri = (path: string, ...pathSegments: string[]) => {
            return webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, path, ...pathSegments));
        };

        // Media resources
        const scriptUri = getUri('media', 'chat.js');
        const styleUri = getUri('media', 'chat.css');
        const styleEnhancementsUri = getUri('media', 'chat-enhancements.css');
        const searchScriptUri = getUri('media', 'search.js');
        const fallbackIconsStyleUri = getUri('media', 'fallback-icons.css');
        const fallbackIconsScriptUri = getUri('media', 'fallback-icons.js');
        const buttonVisibilityScriptUri = getUri('media', 'button-visibility.js');
        const buttonVisibilityStyleUri = getUri('media', 'button-visibility.css');
        const welcomeMessageScriptUri = getUri('media', 'welcome-message.js');
        const savedChatsScriptUri = getUri('media', 'saved-chats.js');
        const savedChatsStyleUri = getUri('media', 'saved-chats.css');
        const notificationsScriptUri = getUri('media', 'notifications.js');
        const uiEnhancementsStyleUri = getUri('media', 'ui-enhancements.css');
        const settingsScriptUri = getUri('media', 'settings.js');
        
        // Load codicons directly from the extension assets
        // This fixes the 401 Unauthorized error by using local resources instead of a CDN
        const codiconsUri = getUri('media', 'codicons', 'codicon.css');
        const codiconsFontUri = getUri('media', 'codicons', 'codicon.ttf');
        const historyNavigationScriptUri = getUri('media', 'history-navigation.js');
        const keyboardShortcutsUri = getUri('media', 'keyboard-shortcuts.js');
        
        // Add highlight.js for code syntax highlighting
        const highlightJsUri = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js';
        const highlightCssUri = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/github-dark.min.css';

        const htmlContent = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline' https://cdnjs.cloudflare.com; script-src 'nonce-${nonce}' https://cdnjs.cloudflare.com; font-src ${webview.cspSource} data: https://cdnjs.cloudflare.com; img-src ${webview.cspSource} data:; connect-src ${webview.cspSource};">
            <link href="${styleUri}" rel="stylesheet">
            <link href="${styleEnhancementsUri}" rel="stylesheet">
            <link href="${codiconsUri}" rel="stylesheet">
            <link href="${fallbackIconsStyleUri}" rel="stylesheet">
            <link href="${buttonVisibilityStyleUri}" rel="stylesheet">
            <link href="${savedChatsStyleUri}" rel="stylesheet">
            <link href="${uiEnhancementsStyleUri}" rel="stylesheet">
            <link href="${highlightCssUri}" rel="stylesheet">
            <style nonce="${nonce}">
                /* Directly embed a simple version of icons in case external loading fails */
                @font-face {
                    font-family: 'codicon';
                    src: url('${codiconsFontUri}') format('truetype');
                    font-weight: normal;
                    font-style: normal;
                    font-display: block; /* Ensure text is visible while font loads */
                }

                /* Emergency fallback styles for buttons */
                .action-button {
                    min-width: 36px !important;
                    min-height: 36px !important;
                    background-color: var(--vscode-button-background, #0E639C) !important;
                    color: var(--vscode-button-foreground, white) !important;
                    border: 1px solid var(--vscode-contrastBorder, rgba(255, 255, 255, 0.4)) !important;
                }
            </style>
            <title>The New Fuse Chat</title>
        </head>
        <body class="vscode-light">
            <div class="chat-container">
                <div class="chat-header">
                    <div class="header-left">
                        <h2>The New Fuse</h2>
                        <div class="provider-badge" id="providerBadge">
                            <i class="codicon codicon-hubot"></i>
                            <span id="providerName">VS Code</span>
                        </div>
                        <button id="searchToggleButton" class="action-button" title="Search Messages">
                            <i class="codicon codicon-search"></i>
                        </button>
                    </div>
                    <div class="commands-menu">
                        <button id="commandMenuButton" class="command-menu-button" title="Commands Menu">
                            <i class="codicon codicon-menu"></i>
                        </button>
                        <div id="commandsDropdown" class="commands-dropdown">
                            <div class="command-category">AI Collaboration</div>
                            <button class="command-item" data-command="the-new-fuse.startAICollab">
                                <i class="codicon codicon-play"></i> Start Collaboration
                            </button>
                            <button class="command-item" data-command="the-new-fuse.stopAICollab">
                                <i class="codicon codicon-stop"></i> Stop Collaboration
                            </button>
                            
                            <div class="command-category">LLM Settings</div>
                            <button class="command-item" data-command="the-new-fuse.selectLLMProvider">
                                <i class="codicon codicon-settings-gear"></i> Select Provider
                            </button>
                            <button class="command-item" data-command="the-new-fuse.checkLLMProviderHealth">
                                <i class="codicon codicon-pulse"></i> Check Provider Health
                            </button>
                            <button class="command-item" data-command="the-new-fuse.resetLLMProviderHealth">
                                <i class="codicon codicon-refresh"></i> Reset Provider Health
                            </button>
                            
                            <div class="command-category">MCP Connection</div>
                            <button class="command-item" data-command="the-new-fuse.connectMCP">
                                <i class="codicon codicon-plug"></i> Connect to MCP
                            </button>
                            <button class="command-item" data-command="the-new-fuse.disconnectMCP">
                                <i class="codicon codicon-debug-disconnect"></i> Disconnect MCP
                            </button>
                            
                            <div class="command-category">Chat Management</div>
                            <button class="command-item" data-command="the-new-fuse.exportChatHistory">
                                <i class="codicon codicon-export"></i> Export Chat History
                            </button>
                            <button class="command-item" data-command="the-new-fuse.importChatHistory">
                                <i class="codicon codicon-import"></i> Import Chat History
                            </button>
                            <button class="command-item" data-command="the-new-fuse.viewStarredMessages">
                                <i class="codicon codicon-star"></i> View Starred Messages
                            </button>
                            
                            <div class="command-category">UI</div>
                            <button class="command-item" data-command="the-new-fuse.showChat">
                                <i class="codicon codicon-comment"></i> Show Chat
                            </button>
                            <button class="command-item" data-command="the-new-fuse.openSettings">
                                <i class="codicon codicon-settings"></i> Settings
                            </button>
                        </div>
                    </div>
                </div>
                <div class="quick-actions">
                    <div class="action-button-group chat-controls">
                        <button class="action-button" id="newChatButton" title="New Chat">
                            <i class="codicon codicon-new-file"></i>
                        </button>
                        <button class="action-button" id="clearChatButton" title="Clear Chat History">
                            <i class="codicon codicon-clear-all"></i>
                        </button>
                    </div>
                    
                    <div class="action-button-group ai-collab">
                        <button class="action-button" data-command="the-new-fuse.startAICollab" title="Start AI Collaboration">
                            <i class="codicon codicon-play"></i>
                        </button>
                        <button class="action-button" data-command="the-new-fuse.stopAICollab" title="Stop AI Collaboration">
                            <i class="codicon codicon-stop"></i>
                        </button>
                    </div>
                    
                    <div class="action-button-group settings">
                        <button class="action-button" data-command="the-new-fuse.selectLLMProvider" title="Select LLM Provider">
                            <i class="codicon codicon-settings-gear"></i>
                        </button>
                        <button class="action-button" data-command="the-new-fuse.connectMCP" title="Connect to MCP Server">
                            <i class="codicon codicon-plug"></i>
                        </button>
                    </div>
                    
                    <div id="active-feature-indicator" class="active-feature-indicator">
                        <span class="feature-name">Ready</span>
                        <span class="status-dot"></span>
                    </div>
                </div>
                <div class="search-container" id="searchContainer">
                    <input type="text" id="searchInput" class="search-input" placeholder="Search in messages...">
                    <button id="searchPrevButton" class="search-button" title="Previous result">
                        <i class="codicon codicon-arrow-up"></i>
                    </button>
                    <button id="searchNextButton" class="search-button" title="Next result">
                        <i class="codicon codicon-arrow-down"></i>
                    </button>
                    <button id="searchCloseButton" class="search-button" title="Close search">
                        <i class="codicon codicon-close"></i>
                    </button>
                    <span class="search-results" id="searchResults"></span>
                </div>
                <div class="messages" id="messages">
                    <div class="welcome-message">
                        <h2>Welcome to The New Fuse</h2>
                        <p>Ask me anything about your code or let me help you with tasks.</p>
                    </div>
                </div>
                <div class="input-container">
                    <div class="input-box">
                        <textarea id="userInput"
                                placeholder="Ask a question or describe a task..."
                                rows="1"
                                autofocus></textarea>
                        <button id="sendButton" class="send-button">
                            <i class="codicon codicon-send"></i>
                        </button>
                        <div class="prev-message-hint">↑ for previous message</div>
                    </div>
                </div>
            </div>
            <script nonce="${nonce}" src="${scriptUri}"></script>
            <script nonce="${nonce}" src="${searchScriptUri}"></script>
            <script nonce="${nonce}" src="${fallbackIconsScriptUri}"></script>
            <script nonce="${nonce}" src="${buttonVisibilityScriptUri}"></script>
            <script nonce="${nonce}" src="${historyNavigationScriptUri}"></script>
            <script nonce="${nonce}" src="${keyboardShortcutsUri}"></script>
            <script nonce="${nonce}" src="${welcomeMessageScriptUri}"></script>
            <script nonce="${nonce}" src="${notificationsScriptUri}"></script>
            <script nonce="${nonce}" src="${savedChatsScriptUri}"></script>
            <script nonce="${nonce}" src="${settingsScriptUri}"></script>
            <script nonce="${nonce}" src="${highlightJsUri}"></script>
        </body>
        </html>`;
        
        return htmlContent;
    }

    private async handleUserMessage(text: string) {
        if (!this._hostWebview) { return; }

        // Check if chat functionality is enabled in settings
        const config = vscode.workspace.getConfiguration('theNewFuse');
        const chatEnabled = config.get('chat.enabled', true);
        
        if (!chatEnabled) {
            this._hostWebview.postMessage({
                type: 'addMessage',
                role: 'system',
                content: 'Chat functionality is currently disabled in settings. Enable it in settings to continue.',
                timestamp: new Date().toISOString()
            });
            return;
        }

        const traceName = `Chat: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''}`;
        let traceId: string | null = null;
        if (this._llmMonitoringService?.isEnabled()) {
            traceId = this._llmMonitoringService.startTrace({ name: traceName, tags: ['chat', 'user-interaction'] });
        }

        try {
            // Create user message
            const userMessage: AgentMessage = {
                id: `msg_${Date.now()}`,
                type: AgentMessageType.USER,
                source: 'chat',
                content: text,
                timestamp: Date.now(),
                metadata: { source: 'chat' }
            };

            // Add user message to the chat
            await this.addMessage(userMessage);

            // Show thinking indicator and update feature status
            this._hostWebview.postMessage({
                type: 'thinking',
                show: true
            });
            
            // Update the feature indicator to show we're generating a response
            this.updateFeatureStatus('working', 'Generating response');

            // Get response from LLM provider
            let accumulatedResponse = ''; // Variable to hold the full accumulated response from the stream
            const streamingResponseId = `msg_${Date.now()}_stream`; // Unique ID for this streaming response
            
            // First post an empty message shell that will be updated by streaming
            // This ensures the message container exists in the UI.
            this._hostWebview.postMessage({
                type: 'updateMessage',
                id: streamingResponseId,
                content: '', // Start with empty content
                role: 'assistant'
            });
            
            try {
                // If we have a communication manager, send the user message through it
                if (this._communicationManager) {
                    await this._communicationManager.sendMessage(userMessage);
                }

                // Get the selected model from the LLM manager
                const selectedModel = await this._llmManager.getSelectedModel();
                
                if (!selectedModel) {
                    throw new Error('No language model selected. Please select a model in settings.');
                }
                
                if (this._llmMonitoringService?.isEnabled()) {                        const providerConfig = {
                        id: selectedModel.vendor,
                        name: selectedModel.name || selectedModel.vendor,
                        enabled: true
                    };
                    
                    const providerRequest = {
                        prompt: text,
                        systemPrompt: String(config.get('systemPrompt') || 'You are a helpful AI assistant.'),
                        options: { maxTokens: 1000, temperature: 0.7 },
                        temperature: 0.7,
                        maxTokens: 1000
                    };
                    
                    await this._llmMonitoringService.traceGeneration(
                        providerConfig,
                        providerRequest,
                        async () => {
                            // Create messages for the model - VS Code LM API doesn't have System role, use User for instructions
                            const systemPrompt = config.get('systemPrompt') || 'You are a helpful AI assistant.';
                            const systemMessage = new vscode.LanguageModelChatMessage(
                                vscode.LanguageModelChatMessageRole.User,
                                String(systemPrompt)
                            );
                            
                            const userVscodeMessage = new vscode.LanguageModelChatMessage(
                                vscode.LanguageModelChatMessageRole.User,
                                text
                            );
                            
                            // Send request to the model with streaming
                            const request = await selectedModel.sendRequest(
                                [systemMessage, userVscodeMessage],
                                {}
                            );
                            
                            // Process stream response
                            for await (const fragment of request.text) {
                                accumulatedResponse += fragment; // Accumulate the full response
                                
                                // Update UI with the current accumulated streaming content
                                this._hostWebview?.postMessage({
                                    type: 'updateMessage',
                                    id: streamingResponseId,
                                    content: accumulatedResponse, // Send the full accumulated content
                                    role: 'assistant'
                                });
                            }
                            
                            // Construct and return the LLMProviderResponse for monitoring
                            return {
                                content: accumulatedResponse, // Final accumulated content for the trace
                                usage: undefined,
                                provider: selectedModel.vendor,
                                modelName: selectedModel.id
                            };
                        }
                    );
                } else {
                    // Non-monitored version - use the model directly
                    const systemPrompt = config.get('systemPrompt') || 'You are a helpful AI assistant.';
                    const systemMessage = new vscode.LanguageModelChatMessage(
                        vscode.LanguageModelChatMessageRole.User,
                        String(systemPrompt)
                    );
                    
                    const userVscodeMessage = new vscode.LanguageModelChatMessage(
                        vscode.LanguageModelChatMessageRole.User,
                        text
                    );
                    
                    // Send request to the model with streaming
                    const request = await selectedModel.sendRequest(
                        [systemMessage, userVscodeMessage],
                        {}
                    );
                    
                    // Process stream response
                    for await (const fragment of request.text) {
                        accumulatedResponse += fragment; // Accumulate the full response
                        
                        // Update UI with the current accumulated streaming content
                        this._hostWebview?.postMessage({
                            type: 'updateMessage',
                            id: streamingResponseId,
                            content: accumulatedResponse, // Send the full accumulated content
                            role: 'assistant'
                        });
                    }
                }
                
                // Create assistant message
                const assistantMessage: AgentMessage = {
                    id: streamingResponseId,
                    type: AgentMessageType.ASSISTANT,
                    source: 'llm',
                    content: accumulatedResponse,
                    timestamp: Date.now(),
                    metadata: { 
                        provider: selectedModel.vendor,
                        model: selectedModel.id
                    }
                };
                
                // Add the assistant message to our message list
                this._messages.push(assistantMessage);
                
                // Save the message to current session if there is one
                if (this._currentSessionId) {
                    const sessionIndex = this._sessions.findIndex(s => s.id === this._currentSessionId);
                    if (sessionIndex !== -1) {
                        this._sessions[sessionIndex].messages.push(assistantMessage);
                        this._sessions[sessionIndex].updatedAt = Date.now();
                        this.saveSessions();
                    }
                }
                
            } catch (error) {
                console.error('Error getting LLM response:', error);
                this._hostWebview?.postMessage({
                    type: 'addMessage',
                    role: 'system',
                    content: `Error getting AI response: ${error instanceof Error ? error.message : String(error)}`,
                    timestamp: new Date().toISOString()
                });
            } finally {
                this._hostWebview?.postMessage({ type: 'thinking', show: false });
                this.updateFeatureStatus('ready', 'Ready');
                if (traceId) {
                    this._llmMonitoringService?.endTrace(traceId);
                }
            }
        } catch (error) {
            console.error('Error handling user message:', error);
            if (this._hostWebview) {
                 this._hostWebview.postMessage({ type: 'thinking', show: false });
                 this._hostWebview.postMessage({
                    type: 'addMessage',
                    role: 'system',
                    content: `Error processing your request: ${error instanceof Error ? error.message : String(error)}`,
                    timestamp: new Date().toISOString()
                });
            }
            this.updateFeatureStatus('error', 'Error');
            if (traceId) {
                this._llmMonitoringService?.endTrace(traceId);
            }
        }
    }

    // Helper to send messages to the webview
    private async postMessageToWebview(messageData: any): Promise<boolean> {
        if (this._hostWebview) {
            // Log the message being sent to help debug
            console.log('[ChatViewProvider] Posting message to webview:', JSON.stringify(messageData)); 
            return this._hostWebview.postMessage(messageData);
        }
        console.warn('[ChatViewProvider] Host webview not available to post message.');
        return false;
    }

    private async addMessage(message: AgentMessage) {
        this._messages.push(message);
        this.saveMessages(); // Save messages after adding
        if (this._hostWebview) {
            await this._hostWebview.postMessage({
                type: 'addMessage',
                role: this.mapMessageTypeToRole(message.type),
                content: message.content,
                timestamp: new Date(message.timestamp).toISOString(),
                id: message.id,
                isStarred: this._starredMessages.some(s => s.messageId === message.id)
            });
        }
    }

    private mapMessageTypeToRole(type: AgentMessageType): string {
        switch (type) {
            case AgentMessageType.USER:
                return 'user';
            case AgentMessageType.ASSISTANT:
                return 'assistant';
            case AgentMessageType.SYSTEM:
                return 'system';
            case AgentMessageType.TOOL_CODE:
                return 'tool_code';
            case AgentMessageType.TOOL_OUTPUT:
                return 'tool_output';
            default:
                return 'system';
        }
    }

    private async handleIncomingAgentMessage(message: AgentMessage) {
        if (this._hostWebview) {
            await this.addMessage(message);
        }
    }

    private async executeCommand(commandId: string): Promise<void> {
        if (this._hostWebview) {
            this._hostWebview.postMessage({ type: 'clearInput' });
            this._hostWebview.postMessage({ type: 'thinking', show: true });
        }
        this.updateFeatureStatus('working', `Executing command: ${commandId}`);
        try {
            // Execute the command
            await vscode.commands.executeCommand(commandId);
            if (this._hostWebview) {
                this._hostWebview.postMessage({ type: 'thinking', show: false });
            }
            this.updateFeatureStatus('ready', 'Ready');
        } catch (error) {
            console.error(`Failed to execute command ${commandId}:`, error);
            if (this._hostWebview) {
                this._hostWebview.postMessage({
                    type: 'addMessage',
                    role: 'system',
                    content: `Error executing command '${commandId}': ${error instanceof Error ? error.message : String(error)}`,
                    timestamp: new Date().toISOString()
                });
                this._hostWebview.postMessage({ type: 'thinking', show: false });
            }
            this.updateFeatureStatus('error', 'Command failed');
        }
    }

    private saveMessages(): void {
        if (this._currentSessionId) {
            const session = this._sessions.find(s => s.id === this._currentSessionId);
            if (session) {
                session.messages = this._messages;
                session.updatedAt = Date.now();
                this.saveSessions();
                // Notify webview that messages are saved (optional, for UI feedback)
                if (this._hostWebview) {
                    this._hostWebview.postMessage({ type: 'messagesSaved' });
                }
            }
        }
    }

    private loadMessages(): void {
        const savedMessages = this._context.workspaceState.get<AgentMessage[]>(`chatMessages-${this._currentSessionId || 'default'}`, []);
        this._messages = savedMessages;
        // No need to post messages to webview here, viewerReady will trigger displaySavedMessages
    }

    private displaySavedMessages(): void {
        if (this._hostWebview) {
            this._hostWebview.postMessage({
                type: 'displayMessages',
                messages: this._messages.map(msg => ({
                    ...msg,
                    role: this.mapMessageTypeToRole(msg.type),
                    timestamp: new Date(msg.timestamp).toISOString(),
                    isStarred: this._starredMessages.some(s => s.messageId === msg.id)
                }))
            });
        }
    }

    public clearChatHistory(): void {
        this._messages = [];
        this.saveMessages();
        if (this._hostWebview) {
            this._hostWebview.postMessage({ type: 'clearChat' });
            this._hostWebview.postMessage({
                type: 'addMessage',
                role: 'system',
                content: 'Chat history cleared. How can I help you today?',
                timestamp: new Date().toISOString()
            });
        }
        this.updateFeatureStatus('ready', 'Ready');
    }

    public show(preserveFocus: boolean = true): void {
        // This method is likely handled by TabbedContainerProvider now
        // If this._view is used for revealing, it would be:
        // if (this._view) {
        //     // How to reveal a specific tab's webview? This needs to be handled by the parent container.
        //     // For now, we'll assume the parent handles visibility.
        // }
    }

    public async dispose(): Promise<void> {
        // Dispose of all disposables
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if x) {
                x.dispose();
            }
        }
        // Clear the host webview reference
        if (this._hostWebview) {
            this._hostWebview = undefined;
        }
    }

    public updateProviderBadge(providerName: string): void {
        if (!this._hostWebview) { return; }
        this._hostWebview.postMessage({
            type: 'updateProviderBadge',
            providerName: providerName
        });
    }

    private async updateInitialProviderBadge(): Promise<void> {
        if (!this._hostWebview || !this._llmManager) { return; }
        const activeProvider = await this._llmManager.getActiveProvider();
        if (activeProvider) {
            this.updateProviderBadge(activeProvider.name);
        }
    }

    public refreshChatUI(): void {
        if (!this._hostWebview) { return; }
        this._hostWebview.postMessage({ type: 'refreshUI' });
    }

    public notifyProviderSwitch(previousProvider: string, newProvider: string): void {
        if (!this._hostWebview) { return; }
        this._hostWebview.postMessage({
            type: 'notification',
            message: `LLM Provider switched from ${previousProvider} to ${newProvider}.`,
            notificationType: 'info'
        });
    }

    public async handleNewChat() {
        // Save the current session if there are messages
        if (this._messages.length > 0 && this._currentSessionId) {
            const currentSession = this._sessions.find(s => s.id === this._currentSessionId);
            if (currentSession && currentSession.messages.length === 0) {
                // If current session has no messages, it means it was just created and not used.
                // We can safely delete it before creating a new one.
                this.deleteChatSession(this._currentSessionId);
            } else if (currentSession) {
                // If there are messages, ensure it's saved with a default name if not already named
                if (!currentSession.name || currentSession.name === `Chat Session ${currentSession.id.substring(0, 4)}`) {
                    currentSession.name = `Chat Session ${new Date().toLocaleString()}`;
                }
                this.saveCurrentChatSession(currentSession.name);
            }
        }

        // Create a new session and switch to it
        this.createDefaultSession();
        this.clearChatHistory(); // Clear UI and messages for the new session
        if (this._hostWebview) {
            this._hostWebview.postMessage({ type: 'newChatStarted' });
        }
        this.sendSavedChatsList(); // Update the saved chats list in the UI
        this.updateFeatureStatus('ready', 'Ready');
    }

    public updateFeatureStatus(state: 'ready' | 'working' | 'error', text: string) {
        if (!this._hostWebview) { return; }
        this._hostWebview.postMessage({
            type: 'updateFeatureStatus',
            state: state,
            text: text
        }).then((success) => {
            if (!success) {
                console.warn('Failed to post updateFeatureStatus message to webview.');
            }
        });
    }

    private loadSessions(): void {
        const savedSessions = this._context.workspaceState.get<ChatSession[]>('chatSessions', []);
        this._sessions = savedSessions;
        if (this._sessions.length === 0) {
            this.createDefaultSession();
        } else {
            // Ensure current session is set if sessions were loaded
            if (!this._currentSessionId || !this._sessions.some(s => s.id === this._currentSessionId)) {
                this._currentSessionId = this._sessions[0].id;
            }
            this.loadMessages(); // Load messages for the current session
        }
    }

    private createDefaultSession(): void {
        const newSession: ChatSession = {
            id: uuidv4(),
            name: `Chat Session ${new Date().toLocaleString()}`,
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        this._sessions.unshift(newSession); // Add to the beginning
        this._currentSessionId = newSession.id;
        this._messages = []; // Clear messages for the new session
        this.saveSessions();
    }

    private saveSessions(): void {
        this._context.workspaceState.update('chatSessions', this._sessions);
    }

    private saveCurrentChatSession(name: string): void {
        if (this._currentSessionId) {
            const session = this._sessions.find(s => s.id === this._currentSessionId);
            if (session) {
                session.name = name;
                session.messages = this._messages;
                session.updatedAt = Date.now();
                this.saveSessions();
                this.sendSavedChatsList(); // Update the list in the UI
                this.showNotification(`Chat session "${name}" saved.`);
            }
        }
    }

    private switchChatSession(sessionId: string): void {
        const newSession = this._sessions.find(session => session.id === sessionId);
        if (newSession) {
            this.saveMessages(); // Save current session's messages
            this._currentSessionId = newSession.id;
            this._messages = newSession.messages;
            this.displaySavedMessages(); // Display messages of the new session
            if (this._hostWebview) {
                this._hostWebview.postMessage({ type: 'chatSwitched', chatId: sessionId });
            }
            this.sendSavedChatsList(); // Update UI to reflect active chat
            this.showNotification(`Switched to chat: ${newSession.name}`);
        } else {
            vscode.window.showErrorMessage('Chat session not found.');
        }
    }

    private deleteChatSession(sessionId: string): void {
        const sessionToDelete = this._sessions.find(s => s.id === sessionId);
        if (!sessionToDelete) {
            vscode.window.showErrorMessage('Chat session not found for deletion.');
            return;
        }

        this._sessions = this._sessions.filter(session => session.id !== sessionId);
        this.saveSessions();

        // Remove associated messages from workspace state
        this._context.workspaceState.update(`chatMessages-${sessionId}`, undefined);

        // If the deleted session was the current one, create a new default session
        if (this._currentSessionId === sessionId) {
            this.createDefaultSession();
            this.clearChatHistory(); // Clear UI for the new default session
            if (this._hostWebview) {
                this._hostWebview.postMessage({ type: 'chatDeleted', chatId: sessionId, newChatId: this._currentSessionId });
            }
            this.showNotification(`Chat '${sessionToDelete.name}' deleted. New chat started.`);
        } else {
            if (this._hostWebview) {
                this._hostWebview.postMessage({ type: 'chatDeleted', chatId: sessionId });
            }
            this.showNotification(`Chat '${sessionToDelete.name}' deleted.`);
        }
        this.sendSavedChatsList(); // Update the saved chats list in the UI
    }

    private starMessage(messageId: string, content: string, note?: string): void {
        if (!this._currentSessionId) {
            vscode.window.showErrorMessage('Cannot star message: No active chat session.');
            return;
        }
        const existingStar = this._starredMessages.find(s => s.messageId === messageId);
        if (existingStar) {
            vscode.window.showInformationMessage('Message already starred.');
            return;
        }
        const starred: StarredMessage = {
            id: uuidv4(),
            sessionId: this._currentSessionId,
            messageId: messageId,
            content: content,
            timestamp: Date.now(),
            note: note
        };
        this._starredMessages.push(starred);
        this.saveStarredMessages();
        if (this._hostWebview) {
            this._hostWebview.postMessage({ type: 'messageStarred', messageId: messageId });
        }
        this.showNotification('Message starred successfully!');
    }

    private unstarMessage(starredMessageId: string): void {
        const initialLength = this._starredMessages.length;
        this._starredMessages = this._starredMessages.filter(s => s.id !== starredMessageId);
        if (this._starredMessages.length < initialLength) {
            this.saveStarredMessages();
            if (this._hostWebview) {
                this._hostWebview.postMessage({ type: 'messageUnstarred', messageId: starredMessageId });
            }
            this.showNotification('Message unstarred.');
        }
    }

    private saveStarredMessages(): void {
        this._context.workspaceState.update('starredMessages', this._starredMessages);
    }

    private loadStarredMessages(): void {
        const savedStarred = this._context.workspaceState.get<StarredMessage[]>('starredMessages', []);
        this._starredMessages = savedStarred;
    }

    public async exportChatHistory(): Promise<boolean> {
        if (!this._hostWebview) { return false; }
        const options: vscode.SaveDialogOptions = {
            filters: {
                'JSON Files': ['json']
            },
            defaultUri: vscode.Uri.file('chat_history.json')
        };
        const fileUri = await vscode.window.showSaveDialog(options);
        if (fileUri) {
            try {
                const dataToExport = {
                    sessions: this._sessions,
                    starredMessages: this._starredMessages
                };
                const jsonString = JSON.stringify(dataToExport, null, 2);
                await vscode.workspace.fs.writeFile(fileUri, Buffer.from(jsonString));
                vscode.window.showInformationMessage('Chat history exported successfully!');
                return true;
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to export chat history: ${error instanceof Error ? error.message : String(error)}`);
                return false;
            }
        }
        return false;
    }

    public async importChatHistory(): Promise<boolean> {
        if (!this._hostWebview) { return false; }
        const options: vscode.OpenDialogOptions = {
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: {
                'JSON Files': ['json']
            }
        };
        const fileUri = await vscode.window.showOpenDialog(options);
        if (fileUri && fileUri[0]) {
            try {
                const fileContent = await vscode.workspace.fs.readFile(fileUri[0]);
                const jsonString = Buffer.from(fileContent).toString('utf8');
                const data = JSON.parse(jsonString);

                if (data.sessions && Array.isArray(data.sessions)) {
                    // Clear current sessions and messages
                    this._sessions = [];
                    this._messages = [];
                    this._starredMessages = [];
                    this._currentSessionId = undefined;

                    // Import sessions
                    const importedSessions = data.sessions.map((session: ChatSession) => ({
                        ...session,
                        // Ensure messages are correctly typed if needed
                        messages: session.messages || []
                    }));
                    this._sessions.push(...importedSessions);

                    // Import starred messages
                    if (data.starredMessages && Array.isArray(data.starredMessages)) {
                        this._starredMessages.push(...data.starredMessages);
                    }

                    // Set the current session to the first imported one, or create a new default
                    if (this._sessions.length > 0) {
                        this.switchChatSession(this._sessions[0].id);
                    } else {
                        this.createDefaultSession();
                    }

                    this.saveSessions();
                    this.saveStarredMessages();
                    this.displaySavedMessages(); // Refresh UI with imported messages
                    this.sendSavedChatsList(); // Refresh saved chats list
                    vscode.window.showInformationMessage('Chat history imported successfully!');
                    return true;
                } else {
                    vscode.window.showErrorMessage('Invalid chat history file: Missing "sessions" array.');
                    return false;
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to import chat history: ${error instanceof Error ? error.message : String(error)}`);
                return false;
            }
        }
        return false;
    }

    public async performDiagnostic(): Promise<string> {
        let report = '### Chat View Provider Diagnostics\n';
        report += `Current Session ID: ${this._currentSessionId || 'None'}\n`;
        report += `Number of Sessions: ${this._sessions.length}\n`;
        report += `Number of Starred Messages: ${this._starredMessages.length}\n`;

        try {
            // Check if host webview or panel is available
            const panelAvailable = !!(this._panel || this._hostWebview);
            report += `- Panel/Webview available: ${panelAvailable ? '✅ Yes' : '❌ No'}\n`;
            if (this._hostWebview) {
                report += `  - Using _view (Tabbed Container Mode)\n`;
                report += `  - Using _panel (Standalone Mode - check if this is expected)\n`;
            }

            // Check message count
            report += `- Message count: ${this._messages.length}\n`;

            // Check LLM Provider Manager status
            const activeProvider = await this._llmManager.getActiveProvider();
            report += `- Active LLM Provider: ${activeProvider ? `✅ ${activeProvider.name}` : '❌ None'}\n`;
            if (!activeProvider) {
                report += `  - Reason: ${this._llmManager.getInitializationError() || 'No active provider set or failed to initialize.'}\n`;
            }

            // Check communication manager
            report += `- Communication Manager: ${this._communicationManager ? '✅ Available' : '❌ Not Available'}\n`;

            // Check LLM Monitoring Service
            report += `- LLM Monitoring Service: ${this._llmMonitoringService ? '✅ Available' : '❌ Not Available'}\n`;
            if (this._llmMonitoringService) {
                report += `  - Enabled: ${this._llmMonitoringService.isEnabled() ? '✅ Yes' : '❌ No'}\n`;
            }

            // Check if webview is ready to receive messages (heuristic)
            const webviewToCheck = this._hostWebview;
            if (webviewToCheck) {
                try {
                    // Attempt to post a dummy message and see if it throws an error
                    await webviewToCheck.postMessage({ type: 'diagnosticPing' });
                    report += `- Webview ready for messages: ✅ Yes (ping successful)\n`;
                } catch (e) {
                    report += `- Webview ready for messages: ❌ No (ping failed: ${e instanceof Error ? e.message : String(e)})\n`;
                }
            } else {
                report += `- Webview ready for messages: ❌ No (panel/webview not available)\n`;
            }

        } catch (error) {
            report += `Error during diagnostic: ${error instanceof Error ? error.message : String(error)}\n`;
            console.error('Error during ChatViewProvider diagnostic:', error);
        }

        return report;
    }
}
