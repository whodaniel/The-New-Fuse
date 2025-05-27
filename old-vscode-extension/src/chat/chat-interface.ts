import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';
import { LLMProviderManager } from '../llm/LLMProviderManager.js'; // Assuming path
import { AgentMCPIntegration } from '../mcp-integration.js'; // Fixed import path

/**
 * Chat message types
 */
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
}

/**
 * Chat session to store conversation history
 */
export interface ChatSession {
    id: string;
    name: string;
    messages: ChatMessage[];
    createdAt: number;
    updatedAt: number;
}

/**
 * Provider for the chat sidebar view
 */
export class ChatViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'thefuse.chatView';
    private _view?: vscode.WebviewView;
    private _sessions: ChatSession[] = [];
    private _currentSessionId?: string;
    private _lmBridge: LLMProviderManager; // Added
    private _agentIntegration: AgentMCPIntegration; // Added

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _extensionContext: vscode.ExtensionContext,
        lmBridge: LLMProviderManager, // Added
        agentIntegration: AgentMCPIntegration // Added
    ) {
        this._lmBridge = lmBridge; // Added
        this._agentIntegration = agentIntegration; // Added

        // Load saved sessions if any
        this._sessions = this._extensionContext.globalState.get<ChatSession[]>('thefuse.chatSessions', []);
        this._currentSessionId = this._extensionContext.globalState.get<string>('thefuse.currentChatSessionId');
        
        // Create a default session if none exists
        if (this._sessions.length === 0) {
            this._createNewSession('New Chat');
        }
    }

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'sendMessage':
                    this._handleUserMessage(message.text);
                    break;
                case 'newChat':
                    this._createNewSession('New Chat');
                    this._updateWebview();
                    break;
                case 'clearChat':
                    this._clearCurrentSession();
                    this._updateWebview();
                    break;
                case 'selectSession':
                    this._currentSessionId = message.sessionId;
                    this._saveState();
                    this._updateWebview();
                    break;
            }
        });

        // Initial update
        this._updateWebview();
    }

    /**
     * Get the current chat session
     */
    private _getCurrentSession(): ChatSession | undefined {
        return this._sessions.find(s => s.id === this._currentSessionId);
    }

    /**
     * Create a new chat session
     */
    private _createNewSession(name: string): void {
        const newSession: ChatSession = {
            id: uuidv4(),
            name,
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        this._sessions.push(newSession);
        this._currentSessionId = newSession.id;
        this._saveState();
    }

    /**
     * Clear the current chat session
     */
    private _clearCurrentSession(): void {
        const currentSession = this._getCurrentSession();
        if (currentSession) {
            currentSession.messages = [];
            currentSession.updatedAt = Date.now();
            this._saveState();
        }
    }

    /**
     * Handle a user message
     */
    private async _handleUserMessage(text: string): Promise<void> {
        const currentSession = this._getCurrentSession();
        if (!currentSession) return;

        // Add user message
        const userMessage: ChatMessage = {
            id: uuidv4(),
            role: 'user',
            content: text,
            timestamp: Date.now()
        };
        
        currentSession.messages.push(userMessage);
        currentSession.updatedAt = Date.now();
        this._saveState();
        this._updateWebview(); // Update UI immediately with user message

        // Show loading indicator in webview
        this._view?.webview.postMessage({ command: 'showLoading' });

        try {
            // Use the AgentMCPIntegration to handle the query
            // This integration should internally get tools and interact with the LM
            const responseContent = await this._agentIntegration.askAgent(text, currentSession.messages);

            const assistantMessage: ChatMessage = {
                id: uuidv4(),
                role: 'assistant',
                content: responseContent || 'Sorry, I could not process that.', // Use response or fallback
                timestamp: Date.now()
            };
            
            currentSession.messages.push(assistantMessage);

        } catch (error: any) {
            console.error('Error getting assistant response via AgentIntegration:', error);
            vscode.window.showErrorMessage(`Error processing message: ${error.message}`);
            // Add an error message to the chat
            const errorMessage: ChatMessage = {
                id: uuidv4(),
                role: 'assistant',
                content: `Sorry, an error occurred: ${error.message}`,
                timestamp: Date.now()
            };
            currentSession.messages.push(errorMessage);
        } finally {
            // Hide loading indicator
            this._view?.webview.postMessage({ command: 'hideLoading' });
            // Update state and UI with the response or error
            currentSession.updatedAt = Date.now();
            this._saveState();
            this._updateWebview();
        }
    }

    /**
     * Save the chat state
     */
    private _saveState(): void {
        this._extensionContext.globalState.update('thefuse.chatSessions', this._sessions);
        this._extensionContext.globalState.update('thefuse.currentChatSessionId', this._currentSessionId);
    }

    /**
     * Update the webview content
     */
    private _updateWebview(): void {
        if (this._view) {
            this._view.webview.html = this._getHtmlForWebview(this._view.webview);
        }
    }

    /**
     * Get the HTML for the webview
     */
    private _getHtmlForWebview(webview: vscode.Webview): string {
        const currentSession = this._getCurrentSession();
        const messages = currentSession ? currentSession.messages : [];
        const sessions = this._sessions.map(s => ({
            id: s.id,
            name: s.name,
            isActive: s.id === this._currentSessionId
        }));

        // Get nonce for CSP
        const nonce = getNonce();

        // Get URIs for webview resources
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'web-ui', 'chat-ui.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'web-ui', 'chat-ui.css'));
        const toolkitUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'node_modules', '@vscode', 'webview-ui-toolkit', 'dist', 'toolkit.js'));

        // Create message HTML using a more structured approach
        const messagesHtml = messages.map(msg => {
            const roleClass = msg.role === 'user' ? 'user' : 'assistant';
            const roleLabel = msg.role === 'user' ? 'You' : 'Trae'; // Use 'Trae' for assistant
            const timestamp = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            // Basic markdown handling (needs improvement for full Trae parity)
            const formattedContent = this._formatMessageContent(msg.content);

            return `
                <div class="message-container message-${roleClass}">
                    <div class="message-header">
                        <span class="role">${roleLabel}</span>
                        <span class="timestamp">${timestamp}</span>
                    </div>
                    <div class="message-content">${formattedContent}</div>
                </div>
            `;
        }).join('');

        // Create sessions dropdown HTML
        const sessionsHtml = sessions.map(session => `
            <vscode-option value="${session.id}" ${session.isActive ? 'selected' : ''}>${session.name}</vscode-option>
        `).join('');

        // Main HTML structure using VS Code Webview UI Toolkit
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' ${webview.cspSource}; img-src ${webview.cspSource} https:;">
                <title>The New Fuse Chat</title>
                <script type="module" nonce="${nonce}" src="${toolkitUri}"></script>
                <link rel="stylesheet" href="${styleUri}">
            </head>
            <body>
                <div class="chat-container">
                    <header class="chat-header">
                        <vscode-dropdown id="session-select" class="session-dropdown">
                            ${sessionsHtml}
                        </vscode-dropdown>
                        <vscode-button id="new-chat-button" appearance="secondary" title="New Chat">+</vscode-button>
                        <vscode-button id="clear-chat-button" appearance="secondary" title="Clear Chat">🗑️</vscode-button>
                    </header>

                    <div id="message-list" class="message-list">
                        ${messages.length === 0 ? '<div class="welcome-message"><h2>Welcome to The New Fuse Chat</h2><p>Start by typing your message below.</p></div>' : messagesHtml}
                        <div id="loading-indicator" class="loading-indicator" style="display: none;">
                            <vscode-progress-ring></vscode-progress-ring>
                        </div>
                    </div>

                    <footer class="input-area">
                        <vscode-text-area id="message-input" class="message-input" placeholder="Type your message here..." resize="vertical"></vscode-text-area>
                        <vscode-button id="send-button" class="send-button" appearance="primary">Send</vscode-button>
                    </footer>
                </div>

                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }

    /**
     * Format message content (basic markdown for now)
     * TODO: Enhance this to match Trae's rendering (code blocks, lists, etc.)
     */
    private _formatMessageContent(content: string): string {
        // Escape HTML to prevent injection
        let escapedContent = content
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

        // Basic code block handling (```language\ncode```)
        escapedContent = escapedContent.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, lang, code) => {
            const languageClass = lang ? `language-${lang}` : '';
            // Needs proper syntax highlighting integration
            return `<pre><code class="${languageClass}">${code.trim()}</code></pre>`;
        });

        // Basic inline code handling (`code`)
        escapedContent = escapedContent.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Basic bold handling (**bold**)
        escapedContent = escapedContent.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');

        // Basic italic handling (*italic*)
        escapedContent = escapedContent.replace(/\*([^\*]+)\*/g, '<em>$1</em>');

        // Convert newlines to <br>
        escapedContent = escapedContent.replace(/\n/g, '<br>');

        return escapedContent;
    }
}

// Helper function to generate nonce
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

/**
 * Chat panel WebView implementation for a floating window
 */
export class ChatPanel {
    public static currentPanel: ChatPanel | undefined;
    private static readonly viewType = 'thefuseChatPanel';
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _messages: ChatMessage[] = [];

    public static createOrShow(extensionUri: vscode.Uri) {
        // If panel already exists, show it
        if (ChatPanel.currentPanel) {
            ChatPanel.currentPanel._panel.reveal();
            return;
        }

        // Get configuration for chat panel position
        const config = vscode.workspace.getConfiguration('theFuse');
        const panelPosition = config.get<'active' | 'beside' | 'smart'>('chatPanelPosition', 'smart');
        const viewColumn = panelPosition === 'active' ? vscode.ViewColumn.Active : 
                          (panelPosition === 'beside' ? vscode.ViewColumn.Beside : 
                           (vscode.window.activeTextEditor ? vscode.ViewColumn.Beside : vscode.ViewColumn.Active));

        // Create a new panel in a more Copilot-like position
        const panel = vscode.window.createWebviewPanel(
            ChatPanel.viewType,
            'The New Fuse Chat',
            viewColumn,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [extensionUri]
            }
        );

        // Make panel narrower for a more chat-like experience
        panel.onDidChangeViewState(e => {
            if (e.webviewPanel.visible) {
                // Adjust panel size - this is a workaround as there's no direct way to set width
                setTimeout(() => {
                    vscode.commands.executeCommand('workbench.action.toggleSidebarPosition');
                    vscode.commands.executeCommand('workbench.action.toggleSidebarPosition');
                }, 100);
            }
        });

        ChatPanel.currentPanel = new ChatPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Set initial HTML content
        this._updateWebviewContent();

        // Handle panel disposal
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle webview messages
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'sendMessage':
                        this._handleUserMessage(message.text);
                        break;
                    case 'clearChat':
                        this._messages = [];
                        this._updateWebviewContent();
                        break;
                    case 'newChat':
                        this._messages = [];
                        this._updateWebviewContent();
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    private _handleUserMessage(text: string) {
        // Add user message
        this._messages.push({
            id: uuidv4(),
            role: 'user',
            content: text,
            timestamp: Date.now()
        });
        
        this._updateWebviewContent();

        // Simulate assistant response (to be replaced with actual AI response)
        setTimeout(() => {
            this._messages.push({
                id: uuidv4(),
                role: 'assistant',
                content: `I received your message: "${text}"\n\nThis is a placeholder response from The New Fuse. In a complete implementation, this would be an actual response from an AI model.`,
                timestamp: Date.now()
            });
            this._updateWebviewContent();
        }, 1000);
    }

    private _updateWebviewContent() {
        // Get font size from configuration
        const config = vscode.workspace.getConfiguration('theFuse');
        const fontSize = config.get('chatFontSize', 13);
        
        // Generate message HTML
        let messagesHtml = '';
        for (const msg of this._messages) {
            const roleClass = msg.role === 'user' ? 'user-message' : 'assistant-message';
            const roleIcon = msg.role === 'user' ? '$(person)' : '$(sparkle)';
            
            messagesHtml += `
                <div class="message ${roleClass}">
                    <div class="message-header">
                        <span class="message-icon">${roleIcon}</span>
                        <span class="message-role">${msg.role === 'user' ? 'You' : 'The New Fuse'}</span>
                    </div>
                    <div class="message-content">${this._formatMessageContent(msg.content)}</div>
                </div>
            `;
        }

        this._panel.webview.html = `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>The New Fuse Chat</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        font-size: var(--vscode-font-size);
                        color: var(--vscode-foreground);
                        padding: 0;
                        margin: 0;
                        display: flex;
                        flex-direction: column;
                        height: 100vh;
                        overflow: hidden;
                    }
                    .header {
                        padding: 8px 12px;
                        border-bottom: 1px solid var(--vscode-panel-border);
                        display: flex;
                        align-items: center;
                        background-color: var(--vscode-editor-background);
                    }
                    .header h2 {
                        margin: 0;
                        flex: 1;
                        font-size: 14px;
                        display: flex;
                        align-items: center;
                    }
                    .header h2::before {
                        content: '';
                        display: inline-block;
                        width: 16px;
                        height: 16px;
                        background-color: var(--vscode-button-background);
                        margin-right: 8px;
                        border-radius: 50%;
                    }
                    .header-buttons {
                        display: flex;
                        gap: 8px;
                    }
                    .header button {
                        background: transparent;
                        color: var(--vscode-foreground);
                        border: none;
                        padding: 4px 8px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        font-size: 12px;
                        border-radius: 3px;
                    }
                    .header button:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                    .messages {
                        flex: 1;
                        overflow-y: auto;
                        padding: 16px;
                        background-color: var(--vscode-editor-background);
                    }
                    .message {
                        margin-bottom: 24px;
                        max-width: 100%;
                    }
                    .user-message .message-content {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        padding: 8px 12px;
                        border-radius: 6px;
                    }
                    .assistant-message .message-content {
                        background-color: var(--vscode-input-background);
                        border: 1px solid var(--vscode-input-border);
                        padding: 8px 12px;
                        border-radius: 6px;
                    }
                    .message-header {
                        display: flex;
                        align-items: center;
                        margin-bottom: 6px;
                        font-size: 12px;
                        font-weight: 500;
                    }
                    .message-icon {
                        margin-right: 6px;
                    }
                    .message-role {
                        font-weight: 600;
                    }
                    .message-content {
                        white-space: pre-wrap;
                        word-break: break-word;
                        line-height: 1.5;
                    }
                    .message-content code {
                        font-family: var(--vscode-editor-font-family);
                        background: var(--vscode-textCodeBlock-background);
                        padding: 2px 4px;
                        border-radius: 3px;
                        font-size: 90%;
                    }
                    .message-content pre {
                        background: var(--vscode-textCodeBlock-background);
                        padding: 12px;
                        border-radius: 6px;
                        overflow-x: auto;
                        margin: 8px 0;
                    }
                    .message-content pre code {
                        background: transparent;
                        padding: 0;
                        border-radius: 0;
                    }
                    .input-area {
                        padding: 12px 16px;
                        border-top: 1px solid var(--vscode-panel-border);
                        background-color: var(--vscode-editor-background);
                    }
                    .input-box {
                        width: 100%;
                        display: flex;
                        border-radius: 8px;
                        overflow: hidden;
                        border: 1px solid var(--vscode-input-border);
                        box-shadow: 0 0 2px rgba(0, 0, 0, 0.1);
                    }
                    .input-box textarea {
                        flex: 1;
                        min-height: 40px;
                        max-height: 200px;
                        background: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border: none;
                        padding: 10px 12px;
                        resize: none;
                        font-family: var(--vscode-font-family);
                        font-size: ${fontSize}px;
                        line-height: 1.5;
                    }
                    .input-box textarea:focus {
                        outline: none;
                    }
                    .input-box button {
                        width: 60px;
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        cursor: pointer;
                        font-weight: 500;
                        transition: background-color 0.2s;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .input-box button:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                    .input-box button:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }
                    .welcome-message {
                        text-align: center;
                        padding: 40px 20px;
                    }
                    .welcome-message h2 {
                        margin-bottom: 20px;
                        font-weight: 500;
                        font-size: 18px;
                    }
                    .welcome-message p {
                        margin-bottom: 15px;
                        color: var(--vscode-descriptionForeground);
                    }
                    .welcome-message .logo {
                        font-size: 36px;
                        margin-bottom: 16px;
                    }
                    .codicon {
                        font-family: codicon;
                        line-height: 1;
                    }
                    .actions-container {
                        position: absolute;
                        right: 8px;
                        top: 8px;
                        display: none;
                    }
                    .message:hover .actions-container {
                        display: flex;
                    }
                    .action-button {
                        background: transparent;
                        border: none;
                        color: var(--vscode-descriptionForeground);
                        cursor: pointer;
                        padding: 2px;
                        margin-left: 4px;
                        opacity: 0.7;
                    }
                    .action-button:hover {
                        opacity: 1;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>The New Fuse AI Chat</h2>
                    <div class="header-buttons">
                        <button id="newChatBtn" title="New Chat">
                            <span class="codicon">$(add)</span> New Chat
                        </button>
                        <button id="clearChatBtn" title="Clear Chat">
                            <span class="codicon">$(clear-all)</span> Clear
                        </button>
                    </div>
                </div>
                
                <div class="messages" id="messages">
                    ${this._messages.length > 0 ? messagesHtml : `
                        <div class="welcome-message">
                            <div class="logo">✨</div>
                            <h2>The New Fuse AI Assistant</h2>
                            <p>Ask me anything about coding, debugging, or software development.</p>
                            <p>I can help with code explanations, generate code, provide programming guidance, and more.</p>
                        </div>
                    `}
                </div>
                
                <div class="input-area">
                    <div class="input-box">
                        <textarea id="messageInput" placeholder="Ask The New Fuse something..." rows="1"></textarea>
                        <button id="sendBtn" title="Send Message">
                            <span class="codicon">$(send)</span>
                        </button>
                    </div>
                </div>
                
                <script>
                    (function() {
                        const vscode = acquireVsCodeApi();
                        const messageInput = document.getElementById('messageInput');
                        const sendBtn = document.getElementById('sendBtn');
                        const newChatBtn = document.getElementById('newChatBtn');
                        const clearChatBtn = document.getElementById('clearChatBtn');
                        const messagesContainer = document.getElementById('messages');
                        
                        // Auto-resize textarea
                        function autoResizeTextarea() {
                            messageInput.style.height = 'auto';
                            const newHeight = Math.min(messageInput.scrollHeight, 200);
                            messageInput.style.height = newHeight + 'px';
                        }
                        
                        // Scroll to bottom of messages
                        function scrollToBottom() {
                            messagesContainer.scrollTop = messagesContainer.scrollHeight;
                        }
                        
                        // Scroll to bottom initially
                        scrollToBottom();
                        
                        // Send message
                        function sendMessage() {
                            const text = messageInput.value.trim();
                            if (text) {
                                vscode.postMessage({
                                    command: 'sendMessage',
                                    text: text
                                });
                                messageInput.value = '';
                                messageInput.style.height = 'auto';
                                updateSendButton();
                            }
                        }
                        
                        // Update send button state
                        function updateSendButton() {
                            sendBtn.disabled = messageInput.value.trim() === '';
                        }
                        
                        // Set up event listeners
                        messageInput.addEventListener('input', () => {
                            updateSendButton();
                            autoResizeTextarea();
                        });
                        
                        messageInput.addEventListener('keydown', (e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                            }
                        });
                        
                        sendBtn.addEventListener('click', sendMessage);
                        
                        newChatBtn.addEventListener('click', () => {
                            vscode.postMessage({ command: 'newChat' });
                        });
                        
                        clearChatBtn.addEventListener('click', () => {
                            vscode.postMessage({ command: 'clearChat' });
                        });
                        
                        // Observer for scrolling to bottom when new messages arrive
                        const observer = new MutationObserver(() => {
                            scrollToBottom();
                        });
                        
                        observer.observe(messagesContainer, { 
                            childList: true, 
                            subtree: true 
                        });
                        
                        // Focus input field
                        setTimeout(() => {
                            messageInput.focus();
                        }, 300);
                        
                        // Initial button state
                        updateSendButton();
                    }());
                </script>
            </body>
            </html>`;
    }

    private _formatMessageContent(content: string): string {
        // Very basic formatting, could be enhanced with a proper Markdown parser
        let formattedContent = content;
        
        // Format code blocks
        formattedContent = formattedContent.replace(/```([\s\S]*?)```/g, (_, code) => {
            return `<pre><code>${code}</code></pre>`;
        });
        
        // Format inline code
        formattedContent = formattedContent.replace(/`([^`]+)`/g, (_, code) => {
            return `<code>${code}</code>`;
        });
        
        // Convert newlines to <br>
        formattedContent = formattedContent.replace(/\n/g, '<br>');
        
        return formattedContent;
    }

    public dispose() {
        ChatPanel.currentPanel = undefined;
        
        // Clean up resources
        this._panel.dispose();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}