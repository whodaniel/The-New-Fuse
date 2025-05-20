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
exports.ChatView = void 0;
const vscode = __importStar(require("vscode"));
const conversation_manager_1 = require("../services/conversation-manager");
const agent_discovery_1 = require("../services/agent-discovery");
const shared_1 = require("../types/shared");
const logging_1 = require("../core/logging");
/**
 * Enhanced Chat View for the sidebar
 * Provides a rich chat interface with AI agents
 */
class ChatView {
    constructor(extensionUri) {
        this._messages = [];
        this._disposables = [];
        this._extensionUri = extensionUri;
        this._conversationManager = conversation_manager_1.ConversationManager.getInstance();
        this._agentDiscovery = agent_discovery_1.AgentDiscoveryManager.getInstance();
        this.logger = logging_1.Logger.getInstance();
        // Subscribe to conversation events
        this._conversationManager.on('messageReceived', (message) => {
            this._messages.push(message);
            this._updateMessages();
        });
    }
    dispose() {
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
    getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
    getBaseHtml(webview, title, bodyContent) {
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'web-ui', 'styles.css'));
        const nonce = this.getNonce();
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
                <link href="${styleUri}" rel="stylesheet">
                <title>${title}</title>
            </head>
            <body>
                ${bodyContent}
            </body>
            </html>`;
    }
    /**
     * Called when a new instance of the webview is created
     */
    resolveWebviewView(webviewView, _context, // Prefixed unused parameter
    _token) {
        this._view = webviewView;
        // Set up the webview options
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        // Set initial HTML content
        webviewView.webview.html = this._getHtmlForWebview();
        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            try {
                switch (message.command) {
                    case 'sendMessage':
                        if (message.text) {
                            await this._sendMessage(message.text);
                        }
                        break;
                    case 'clearMessages':
                        this._clearMessages();
                        break;
                    case 'selectAgent':
                        // Handle agent selection
                        break;
                }
            }
            catch (error) {
                this.logger.error('Error handling message:', error);
            }
        }, null, this._disposables);
        // Load initial messages
        this._loadMessages();
    }
    /**
     * Load messages from the conversation manager
     */
    async _loadMessages() {
        try {
            // Get messages from the conversation manager
            // For now, we'll start with an empty array
            this._messages = [];
            this._updateMessages();
        }
        catch (error) {
            this.logger.error('Failed to load messages:', error);
        }
    }
    /**
     * Update the messages displayed in the webview
     */
    _updateMessages() {
        if (this._view) {
            this._view.webview.postMessage({
                command: 'updateMessages',
                messages: this._messages
            });
        }
    }
    /**
     * Send a message via the conversation manager
     */
    async _sendMessage(text) {
        try {
            // Create a user message
            const userMessage = {
                id: Date.now().toString(),
                type: shared_1.MessageType.MESSAGE,
                conversationId: 'default',
                sourceAgent: 'vscode-user',
                targetAgent: 'default-ai-assistant',
                text,
                timestamp: Date.now()
            };
            // Add to local messages
            this._messages.push(userMessage);
            this._updateMessages();
            // Send via conversation manager
            await this._conversationManager.sendMessage(text);
        }
        catch (error) {
            this.logger.error('Failed to send message:', error);
            vscode.window.showErrorMessage('Failed to send message');
        }
    }
    /**
     * Clear all messages
     */
    _clearMessages() {
        this._messages = [];
        this._conversationManager.clearMessages();
        this._updateMessages();
    }
    /**
     * Generate HTML content for the webview
     */
    _getHtmlForWebview() {
        const nonce = this.getNonce();
        const bodyContent = `
            <div class="tab-container">
                <div class="tab-header">
                    <button class="tab-button active" data-tab="chat">Chat</button>
                    <button class="tab-button" data-tab="servers">Servers</button>
                    <button class="tab-button" data-tab="marketplace">Marketplace</button>
                </div>
                <div class="tab-content">
                    <div id="chat-tab" class="tab-pane active">
                        <div class="chat-header">
                            <h2>AI Chat</h2>
                            <div class="chat-actions">
                                <button id="clearBtn" title="Clear messages">
                                    <span>Clear</span>
                                </button>
                            </div>
                        </div>
                        <div class="content-area" id="messages"></div>
                        <div class="input-area">
                            <textarea id="messageInput" placeholder="Type your message..." rows="3"></textarea>
                            <button id="sendButton">Send</button>
                        </div>
                    </div>
                    <div id="servers-tab" class="tab-pane">
                        <h2>MCP Servers</h2>
                        <p>Server management interface will go here.</p>
                        <!-- Placeholder for server list and controls -->
                    </div>
                    <div id="marketplace-tab" class="tab-pane">
                        <h2>MCP Marketplace</h2>
                        <p>Marketplace interface will go here.</p>
                        <!-- Placeholder for marketplace items -->
                    </div>
                </div>
            </div>

            <script nonce="${nonce}">
                const vscode = acquireVsCodeApi(); // Ensure vscode API is acquired

                // Store state
                const state = {
                    messages: [],
                    activeTab: 'chat' // Default active tab
                };

                // Elements
                const messagesDiv = document.getElementById('messages');
                const messageInput = document.getElementById('messageInput');
                const sendButton = document.getElementById('sendButton');
                const clearBtn = document.getElementById('clearBtn');
                const tabButtons = document.querySelectorAll('.tab-button');
                const tabPanes = document.querySelectorAll('.tab-pane');

                // --- Tab Switching Logic ---
                function switchTab(tabId) {
                    state.activeTab = tabId;

                    // Update button active state
                    tabButtons.forEach(button => {
                        if (button.dataset.tab === tabId) {
                            button.classList.add('active');
                        } else {
                            button.classList.remove('active');
                        }
                    });

                    // Update pane visibility
                    tabPanes.forEach(pane => {
                        if (pane.id === tabId + '-tab') {
                            pane.classList.add('active');
                        } else {
                            pane.classList.remove('active');
                        }
                    });

                    // Persist active tab (optional)
                    // vscode.setState({ activeTab: tabId });

                    // Notify extension about tab change (optional)
                    vscode.postMessage({ command: 'tabSwitched', tabId: tabId });
                }

                tabButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        switchTab(button.dataset.tab);
                    });
                });

                // Restore active tab on load (optional)
                // const previousState = vscode.getState();
                // if (previousState && previousState.activeTab) {
                //     switchTab(previousState.activeTab);
                // }

                // --- Chat Logic ---
                function sendMessage() {
                    const text = messageInput.value.trim();
                    if (text) {
                        vscode.postMessage({
                            command: 'sendMessage',
                            text
                        });
                        messageInput.value = '';
                    }
                }

                sendButton.addEventListener('click', sendMessage);
                clearBtn.addEventListener('click', () => {
                    vscode.postMessage({ command: 'clearMessages' });
                });

                messageInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                    }
                });

                window.addEventListener('message', (event) => {
                    const message = event.data;

                    switch (message.command) {
                        case 'updateMessages':
                            if (state.activeTab === 'chat') { // Only update if chat tab is active
                                state.messages = message.messages;
                                renderMessages();
                            }
                            break;
                        case 'switchToTab': // Allow extension to switch tabs
                            if (message.tabId) {
                                switchTab(message.tabId);
                            }
                            break;
                    }
                });

                function renderMessages() {
                    if (!messagesDiv) return; // Ensure element exists
                    messagesDiv.innerHTML = '';

                    if (state.messages.length === 0) {
                        const emptyState = document.createElement('div');
                        emptyState.className = 'empty-state';
                        emptyState.innerHTML = \`
                            <div class="empty-icon">💬</div>
                            <h3>Start a conversation</h3>
                            <p>Send a message to begin chatting with AI</p>
                        \`;
                        messagesDiv.appendChild(emptyState);
                        return;
                    }

                    state.messages.forEach(msg => {
                        const messageEl = document.createElement('div');
                        messageEl.className = 'message';
                        // Adjust class based on your message structure if needed
                        messageEl.classList.add(msg.sourceAgent === 'vscode-user' ? 'message-user' : 'message-ai');

                        const avatar = document.createElement('div');
                        avatar.className = 'message-avatar';
                        avatar.innerText = msg.sourceAgent === 'vscode-user' ? '👤' : '🤖';

                        const content = document.createElement('div');
                        content.className = 'message-content';

                        const textEl = document.createElement('div');
                        textEl.className = 'message-text';
                        textEl.innerText = msg.text || ''; // Handle potential undefined text

                        const timeEl = document.createElement('div');
                        timeEl.className = 'message-time';
                        const messageTime = new Date(msg.timestamp);
                        timeEl.innerText = messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Format time

                        content.appendChild(textEl);
                        content.appendChild(timeEl);

                        messageEl.appendChild(avatar);
                        messageEl.appendChild(content);
                        messagesDiv.appendChild(messageEl);
                    });

                    // Scroll to bottom
                    messagesDiv.scrollTop = messagesDiv.scrollHeight;
                }

                // Initial render for the default tab
                if (state.activeTab === 'chat') {
                    renderMessages();
                }

                // --- Placeholder Logic for Other Tabs ---
                // Add JS logic for Servers and Marketplace tabs here later

            </script>

            <style>
                body, html {
                    height: 100%;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-editor-foreground);
                    background-color: var(--vscode-sideBar-background);
                }
                .tab-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    overflow: hidden; /* Prevent body scroll */
                }
                .tab-header {
                    display: flex;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    flex-shrink: 0; /* Prevent header shrinking */
                }
                .tab-button {
                    padding: 10px 15px;
                    cursor: pointer;
                    border: none;
                    background-color: transparent;
                    color: var(--vscode-tab-inactiveForeground);
                    border-bottom: 2px solid transparent;
                    outline: none; /* Remove focus outline */
                }
                .tab-button.active {
                    color: var(--vscode-tab-activeForeground);
                    border-bottom-color: var(--vscode-tab-activeBorder);
                }
                .tab-button:hover {
                    background-color: var(--vscode-tab-hoverBackground);
                }
                .tab-content {
                    flex-grow: 1; /* Allow content to fill space */
                    overflow-y: auto; /* Allow content scrolling */
                    position: relative; /* Needed for absolute positioning of panes */
                }
                .tab-pane {
                    display: none; /* Hide inactive panes */
                    padding: 15px;
                    height: 100%; /* Make panes fill content area */
                    box-sizing: border-box; /* Include padding in height */
                    overflow-y: auto; /* Allow individual pane scrolling if needed */
                }
                .tab-pane.active {
                    display: block; /* Show active pane */
                }

                /* Chat Tab Specific Styles */
                #chat-tab {
                    display: flex;
                    flex-direction: column;
                    height: 100%; /* Ensure chat tab fills its container */
                    padding: 0; /* Remove padding if handled by inner elements */
                }
                 #chat-tab.active {
                    display: flex; /* Use flex when active */
                }
                .chat-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 15px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    flex-shrink: 0;
                }
                .chat-header h2 { margin: 0; font-size: 1.1em; }
                .chat-actions button {
                    background: none;
                    border: none;
                    color: var(--vscode-foreground);
                    cursor: pointer;
                    padding: 4px;
                }
                 .chat-actions button:hover {
                    background-color: var(--vscode-toolbar-hoverBackground);
                 }
                .content-area {
                    flex-grow: 1;
                    overflow-y: auto;
                    padding: 10px 15px;
                }
                .input-area {
                    display: flex;
                    padding: 10px 15px;
                    border-top: 1px solid var(--vscode-panel-border);
                    flex-shrink: 0;
                }
                #messageInput {
                    flex-grow: 1;
                    resize: none;
                    margin-right: 8px;
                    border-radius: 4px;
                    padding: 8px;
                    border: 1px solid var(--vscode-input-border);
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                }
                #sendButton {
                    align-self: flex-end;
                    /* Use VS Code button styles */
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                }
                #sendButton:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }

                /* General Message Styles */
                .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--vscode-descriptionForeground); text-align: center; padding: 20px; }
                .empty-icon { font-size: 2rem; margin-bottom: 10px; }
                .message { display: flex; margin-bottom: 12px; padding: 8px; border-radius: 6px; max-width: 85%; }
                .message-user { background-color: var(--vscode-chat-requestBorder); margin-left: auto; } /* Align user messages right */
                .message-ai { background-color: var(--vscode-interactive-inputBackground); margin-right: auto; } /* Align AI messages left */
                .message-avatar { flex: 0 0 28px; height: 28px; width: 28px; display: flex; align-items: center; justify-content: center; border-radius: 14px; margin-right: 8px; font-size: 0.9em; background-color: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
                .message-user .message-avatar { margin-left: 8px; margin-right: 0; order: 1; } /* Move user avatar to the right */
                .message-content { flex: 1; }
                .message-text { margin-bottom: 4px; white-space: pre-wrap; word-break: break-word; font-size: 0.95em; }
                .message-time { font-size: 0.7em; color: var(--vscode-descriptionForeground); text-align: right; }
                .message-user .message-time { text-align: left; }

                /* Styles for Servers and Marketplace Tabs */
                #servers-tab h2, #marketplace-tab h2 {
                    margin-top: 0;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding-bottom: 8px;
                    margin-bottom: 15px;
                }
                 #servers-tab p, #marketplace-tab p {
                    color: var(--vscode-descriptionForeground);
                 }

            </style>
        `;
        // Note: getBaseHtml is not defined in this class, assuming it exists elsewhere or needs to be added.
        // For now, returning the full HTML structure directly.
        // return this.getBaseHtml(this._view!.webview, 'The Fuse', bodyContent);
        const styleUri = this._view.webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'web-ui', 'styles.css')); // Assuming styles.css exists
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${this._view.webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
                <title>The Fuse</title>
                <link href="${styleUri}" rel="stylesheet"> <!-- Link to external CSS if needed -->
            </head>
            <body>
                ${bodyContent}
            </body>
            </html>`;
    }
    /**
     * Send a message to the webview
     */
    postMessage(message) {
        if (this._view) {
            this._view.webview.postMessage(message);
        }
    }
}
exports.ChatView = ChatView;
//# sourceMappingURL=chat-view.js.map