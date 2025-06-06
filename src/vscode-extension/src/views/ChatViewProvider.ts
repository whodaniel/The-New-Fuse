import * as vscode from 'vscode';
import { ChatService, ChatMessage, ChatSession } from '../services/features/ChatService';
import { NotificationService } from '../services/core/NotificationService';

export class ChatViewProvider {
    private webview?: vscode.Webview;
    // Store extensionUri to resolve resource paths in getHtmlForChatPanel
    private extensionUri: vscode.Uri;

    constructor(
        private chatService: ChatService,
        private notificationService: NotificationService,
        extensionUri: vscode.Uri // Added extensionUri to constructor
    ) {
        this.extensionUri = extensionUri;
    }

    public setWebview(webview: vscode.Webview): void {
        this.webview = webview;
    }

    /**
     * Generates the HTML content for the chat panel.
     * This HTML will be injected into the TabbedContainerProvider's webview.
     * @param webview The webview instance from TabbedContainerProvider.
     * @param nonce A nonce for Content Security Policy.
     * @returns HTML string for the chat panel.
     */
    public getHtmlForChatPanel(webview: vscode.Webview, nonce: string): string {
        // Helper to get resource URIs, using the stored extensionUri
        const getUri = (pathList: string[]) => webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, ...pathList));

        // Example: If you have specific CSS for the chat panel
        // const chatPanelCss = getUri(['media', 'chat-panel.css']);
        // <link href="${chatPanelCss}" rel="stylesheet" nonce="${nonce}">

        // Basic HTML structure for the chat panel
        // Client-side JS (e.g., in TabbedContainerProvider's main.js) will handle message rendering and interactions.
        return `
            <div id="chat-panel-container">
                <div id="chat-messages">
                    <!-- Chat messages will be rendered here by client-side JavaScript -->
                </div>
                <div id="chat-input-area">
                    <textarea id="chat-input" placeholder="Type your message..."></textarea>
                    <button id="send-button">Send</button>
                </div>
                <div id="thinking-indicator" style="display:none;">Thinking...</div>
            </div>
        `;
        // Note: If a dedicated chat-panel.js is needed, it would be included similarly:
        // <script nonce="${nonce}" src="${getUri(['media', 'chat-panel.js'])}"></script>
        // For now, assuming main.js in TabbedContainerProvider handles this.
    }

    public updateChatMessages(messages: ChatMessage[], currentSessionId: string): void {
        if (!this.webview) {
            console.warn('ChatViewProvider: Webview not set. Cannot update chat messages.');
            return;
        }
        this.webview.postMessage({
            command: 'chat:renderMessages',
            payload: { messages, currentSessionId }
        });
    }

    public appendChatMessage(message: ChatMessage): void {
        if (!this.webview) {
            console.warn('ChatViewProvider: Webview not set. Cannot append chat message.');
            return;
        }
        this.webview.postMessage({
            command: 'chat:appendMessage',
            payload: message
        });
    }

    public setThinkingIndicator(isThinking: boolean): void {
        if (!this.webview) {
            console.warn('ChatViewProvider: Webview not set. Cannot set thinking indicator.');
            return;
        }
        this.webview.postMessage({
            command: 'chat:setThinking',
            payload: isThinking
        });
    }

    public clearUserInput(): void {
        if (!this.webview) {
            console.warn('ChatViewProvider: Webview not set. Cannot clear user input.');
            return;
        }
        this.webview.postMessage({
            command: 'chat:clearInput'
        });
    }

    public setActiveSession(session: ChatSession | null): void {
        if (!this.webview) {
            console.warn('ChatViewProvider: Webview not set. Cannot set active session.');
            return;
        }
        this.webview.postMessage({
            command: 'chat:setActiveSession',
            payload: session
        });
    }
}
