import * as vscode from 'vscode';
import { ApiClient } from '../services/ApiClient';
import { ConfigurationManager } from '../config/ConfigurationManager';
import { CustomModesManager } from '../services/CustomModesManager';

export class ChatInterfaceProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'theNewFuse.chatInterface';
    private apiClient: ApiClient;
    private configManager: ConfigurationManager;
    private customModesManager: CustomModesManager;
    private currentMode?: string;

    constructor(
        apiClient: ApiClient,
        configManager: ConfigurationManager,
        customModesManager: CustomModesManager
    ) {
        this.apiClient = apiClient;
        this.configManager = configManager;
        this.customModesManager = customModesManager;
    }

    resolveWebviewView(webviewView: vscode.WebviewView): void {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(vscode.Uri.joinPath(vscode.Uri.parse(vscode.extensions.getExtension('the-new-fuse')?.extensionPath || ''), 'media').fsPath)
            ]
        };

        webviewView.webview.html = this.getWebviewContent(webviewView.webview);

        // Handle messages from webview
        webviewView.webview.onDidReceiveMessage(async (message: any) => {
            await this.handleMessage(message, webviewView);
        });

        // Send initial data to webview
        this.updateWebview(webviewView);
    }

    private getWebviewContent(webview: vscode.Webview): string {
        const nonce = this.getNonce();
        const customModes = this.customModesManager.getCustomModes();

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>The New Fuse Chat</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        font-size: var(--vscode-font-size);
                        background-color: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                        margin: 0;
                        padding: 0;
                        height: 100vh;
                        display: flex;
                        flex-direction: column;
                    }
                    .header {
                        padding: 10px;
                        border-bottom: 1px solid var(--vscode-panel-border);
                        background-color: var(--vscode-editorWidget-background);
                    }
                    .mode-selector {
                        margin-bottom: 10px;
                    }
                    .mode-selector select {
                        background-color: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border: 1px solid var(--vscode-input-border);
                        padding: 4px 8px;
                        border-radius: 3px;
                    }
                    .chat-container {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                    }
                    .messages {
                        flex: 1;
                        overflow-y: auto;
                        padding: 10px;
                    }
                    .message {
                        margin-bottom: 12px;
                        padding: 8px 12px;
                        border-radius: 6px;
                        max-width: 80%;
                    }
                    .message.user {
                        background-color: var(--vscode-badge-background);
                        color: var(--vscode-badge-foreground);
                        margin-left: auto;
                        text-align: right;
                    }
                    .message.assistant {
                        background-color: var(--vscode-textBlockQuote-background);
                        border-left: 3px solid var(--vscode-textBlockQuote-border);
                    }
                    .input-container {
                        padding: 10px;
                        border-top: 1px solid var(--vscode-panel-border);
                        background-color: var(--vscode-editorWidget-background);
                    }
                    .input-group {
                        display: flex;
                        gap: 8px;
                    }
                    .input-group textarea {
                        flex: 1;
                        background-color: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border: 1px solid var(--vscode-input-border);
                        border-radius: 3px;
                        padding: 8px;
                        resize: vertical;
                        min-height: 20px;
                        max-height: 100px;
                        font-family: var(--vscode-font-family);
                        font-size: var(--vscode-font-size);
                    }
                    .input-group button {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 8px 16px;
                        border-radius: 3px;
                        cursor: pointer;
                    }
                    .input-group button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                    .input-group button:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="mode-selector">
                        <label for="mode-select">AI Mode:</label>
                        <select id="mode-select">
                            <option value="">Select a mode...</option>
                            ${customModes.map(mode => `
                                <option value="${mode.slug}" ${mode.slug === this.currentMode ? 'selected' : ''}>
                                    ${mode.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                <div class="chat-container">
                    <div class="messages" id="messages"></div>
                    <div class="input-container">
                        <div class="input-group">
                            <textarea id="message-input" placeholder="Type your message... (Ctrl+Enter to send)"></textarea>
                            <button id="send-button">Send</button>
                        </div>
                    </div>
                </div>
                <script nonce="${nonce}">
                    const vscode = acquireVsCodeApi();
                    const messagesContainer = document.getElementById('messages');
                    const messageInput = document.getElementById('message-input');
                    const sendButton = document.getElementById('send-button');
                    const modeSelect = document.getElementById('mode-select');

                    // Handle mode selection
                    modeSelect.addEventListener('change', () => {
                        vscode.postMessage({
                            command: 'selectMode',
                            mode: modeSelect.value
                        });
                    });

                    // Handle send button
                    sendButton.addEventListener('click', sendMessage);

                    // Handle Ctrl+Enter
                    messageInput.addEventListener('keydown', (e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                            e.preventDefault();
                            sendMessage();
                        }
                    });

                    function sendMessage() {
                        const message = messageInput.value.trim();
                        if (message) {
                            vscode.postMessage({
                                command: 'sendMessage',
                                message: message
                            });
                            messageInput.value = '';
                        }
                    }

                    // Handle messages from extension
                    window.addEventListener('message', (event) => {
                        const message = event.data;
                        switch (message.command) {
                            case 'addMessage':
                                addMessage(message.role, message.content);
                                break;
                            case 'updateMode':
                                modeSelect.value = message.mode;
                                break;
                        }
                    });

                    function addMessage(role, content) {
                        const messageDiv = document.createElement('div');
                        messageDiv.className = \`message \${role}\`;
                        messageDiv.innerHTML = \`<pre>\${content}</pre>\`;
                        messagesContainer.appendChild(messageDiv);
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    }

                    // Initialize
                    messageInput.focus();
                </script>
            </body>
            </html>
        `;
    }

    private async handleMessage(message: any, webviewView: vscode.WebviewView): Promise<void> {
        switch (message.command) {
            case 'sendMessage':
                await this.sendChatMessage(message.message, webviewView);
                break;
            case 'selectMode':
                this.currentMode = message.mode;
                this.updateWebview(webviewView);
                break;
        }
    }

    private async sendChatMessage(userMessage: string, webviewView: vscode.WebviewView): Promise<void> {
        // Add user message to chat
        webviewView.webview.postMessage({
            command: 'addMessage',
            role: 'user',
            content: userMessage
        });

        try {
            // Get current mode
            const mode = this.currentMode ? this.customModesManager.getCustomMode(this.currentMode) : null;

            // Send message to backend
            const response = await this.apiClient.post('/chat', {
                message: userMessage,
                mode: mode?.slug,
                context: {
                    file: vscode.window.activeTextEditor?.document.fileName,
                    language: vscode.window.activeTextEditor?.document.languageId,
                    workspace: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
                }
            });

            // Add assistant response to chat
            webviewView.webview.postMessage({
                command: 'addMessage',
                role: 'assistant',
                content: response.response
            });

        } catch (error) {
            console.error('Error sending chat message:', error);
            webviewView.webview.postMessage({
                command: 'addMessage',
                role: 'assistant',
                content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`
            });
        }
    }

    private updateWebview(webviewView: vscode.WebviewView): void {
        webviewView.webview.postMessage({
            command: 'updateMode',
            mode: this.currentMode
        });
    }

    private getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    /**
     * Set the current mode
     */
    setCurrentMode(mode: string): void {
        this.currentMode = mode;
    }

    /**
     * Get the current mode
     */
    getCurrentMode(): string | undefined {
        return this.currentMode;
    }
}