import * as vscode from 'vscode';
import { ApiClient } from '../services/ApiClient';
import { LLMProviderManager } from '../llm/LLMProviderManager';

export class ChatProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly apiClient: ApiClient,
        private readonly llmManager: LLMProviderManager
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.context.extensionUri]
        };

        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

        // Handle messages from webview
        webviewView.webview.onDidReceiveMessage(
            message => this.handleMessage(message),
            undefined,
            this.context.subscriptions
        );
    }

    public show() {
        if (this._view) {
            this._view.show?.(true);
        }
    }

    private async handleMessage(message: any) {
        switch (message.type) {
            case 'sendMessage':
                await this.handleSendMessage(message.text);
                break;
            case 'selectProvider':
                await this.llmManager.selectProvider();
                break;
            case 'getProviders':
                const providers = await this.llmManager.getAvailableProviders();
                this._view?.webview.postMessage({
                    type: 'providersUpdated',
                    providers: providers
                });
                break;
        }
    }

    private async handleSendMessage(text: string) {
        try {
            this._view?.webview.postMessage({
                type: 'messageLoading',
                text: text
            });

            const response = await this.llmManager.generateResponse(text);

            this._view?.webview.postMessage({
                type: 'messageResponse',
                response: response
            });

        } catch (error) {
            this._view?.webview.postMessage({
                type: 'messageError',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>The New Fuse Chat</title>
            <style>
                body { font-family: var(--vscode-font-family); margin: 0; padding: 16px; }
                .header { border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 16px; margin-bottom: 16px; }
                .provider-selector select { width: 100%; padding: 8px; margin-top: 8px; }
                .chat-container { height: 400px; display: flex; flex-direction: column; }
                .messages { flex: 1; overflow-y: auto; border: 1px solid var(--vscode-panel-border); padding: 8px; margin-bottom: 8px; }
                .message { margin-bottom: 12px; padding: 8px; border-radius: 4px; }
                .user-message { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
                .ai-message { background: var(--vscode-input-background); }
                .input-container { display: flex; gap: 8px; }
                textarea { flex: 1; padding: 8px; min-height: 60px; }
                button { padding: 8px 16px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 4px; cursor: pointer; }
                button:hover { background: var(--vscode-button-hoverBackground); }
                .status-bar { margin-top: 8px; font-size: 12px; color: var(--vscode-descriptionForeground); }
            </style>
        </head>
        <body>
            <div id="app">
                <div class="header">
                    <h2>🤖 The New Fuse AI Assistant</h2>
                    <div class="provider-selector">
                        <select id="providerSelect">
                            <option value="">Select Provider...</option>
                        </select>
                    </div>
                </div>
                
                <div class="chat-container">
                    <div id="messages" class="messages"></div>
                    <div class="input-container">
                        <textarea id="messageInput" placeholder="Ask me anything..." rows="3"></textarea>
                        <button id="sendButton">Send</button>
                    </div>
                </div>
                
                <div class="status-bar">
                    <span id="status">Ready</span>
                </div>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                const messagesDiv = document.getElementById('messages');
                const messageInput = document.getElementById('messageInput');
                const sendButton = document.getElementById('sendButton');
                const status = document.getElementById('status');

                sendButton.addEventListener('click', sendMessage);
                messageInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                    }
                });

                function sendMessage() {
                    const text = messageInput.value.trim();
                    if (!text) return;

                    addMessage(text, 'user');
                    messageInput.value = '';
                    
                    vscode.postMessage({
                        type: 'sendMessage',
                        text: text
                    });
                }

                function addMessage(text, sender) {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message ' + sender + '-message';
                    messageDiv.textContent = text;
                    messagesDiv.appendChild(messageDiv);
                    messagesDiv.scrollTop = messagesDiv.scrollHeight;
                }

                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.type) {
                        case 'messageLoading':
                            status.textContent = 'Thinking...';
                            break;
                        case 'messageResponse':
                            addMessage(message.response, 'ai');
                            status.textContent = 'Ready';
                            break;
                        case 'messageError':
                            addMessage('Error: ' + message.error, 'ai');
                            status.textContent = 'Error occurred';
                            break;
                    }
                });

                // Request providers on load
                vscode.postMessage({ type: 'getProviders' });
            </script>
        </body>
        </html>`;
    }
}