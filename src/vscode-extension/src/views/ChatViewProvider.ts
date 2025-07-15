import * as vscode from 'vscode';
import { ChatService } from '../services/features/ChatService';
import { NotificationService } from '../services/core/NotificationService';

export class ChatViewProvider {
    private _webview?: vscode.Webview;
    private _extensionUri: vscode.Uri;

    constructor(
        private chatService: ChatService,
        private notificationService: NotificationService,
        extensionUri: vscode.Uri
    ) {
        this._extensionUri = extensionUri;
    }

    public setWebview(webview: vscode.Webview): void {
        this._webview = webview;
    }

    public getHtmlBodySnippet(webview: vscode.Webview, nonce: string, path: any): string {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media', 'chat-panel.js'))
        );
        
        const styleUri = webview.asWebviewUri(
            vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media', 'chat-panel.css'))
        );

        return `
            <link href="${styleUri}" rel="stylesheet">
            <div class="chat-container">
                <div class="chat-header">
                    <h3><i class="codicon codicon-comment-discussion"></i> AI Chat</h3>
                    <div class="chat-controls">
                        <button id="new-session-btn" class="btn-small" title="New Session">
                            <i class="codicon codicon-add"></i>
                        </button>
                        <button id="clear-chat-btn" class="btn-small" title="Clear Chat">
                            <i class="codicon codicon-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="chat-sessions">
                    <select id="session-selector" class="session-selector">
                        <option value="">Select Session...</option>
                    </select>
                </div>
                
                <div class="chat-messages" id="chat-messages">
                    <div class="welcome-message">
                        <i class="codicon codicon-rocket"></i>
                        <p>Welcome to The New Fuse AI Assistant!</p>
                        <p>Start a conversation or select an existing session.</p>
                    </div>
                </div>
                
                <div class="chat-input-container">
                    <div class="chat-input-row">
                        <textarea 
                            id="chat-input" 
                            class="chat-input" 
                            placeholder="Ask me anything about your code..."
                            rows="3"
                        ></textarea>
                        <button id="send-message-btn" class="send-button">
                            <i class="codicon codicon-send"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            <script nonce="${nonce}" src="${scriptUri}"></script>
        `;
    }

    public dispose(): void {
        this._webview = undefined;
    }
}
