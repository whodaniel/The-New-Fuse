import * as vscode from 'vscode';
/**
 * Enhanced Chat View for the sidebar
 * Provides a rich chat interface with AI agents
 */
export declare class ChatView {
    private _view?;
    private readonly _extensionUri;
    private readonly _conversationManager;
    private readonly _agentDiscovery;
    private _messages;
    private _disposables;
    private logger;
    constructor(extensionUri: vscode.Uri);
    dispose(): void;
    protected getNonce(): string;
    protected getBaseHtml(webview: vscode.Webview, title: string, bodyContent: string): string;
    /**
     * Called when a new instance of the webview is created
     */
    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken): void;
    /**
     * Load messages from the conversation manager
     */
    private _loadMessages;
    /**
     * Update the messages displayed in the webview
     */
    private _updateMessages;
    /**
     * Send a message via the conversation manager
     */
    private _sendMessage;
    /**
     * Clear all messages
     */
    private _clearMessages;
    /**
     * Generate HTML content for the webview
     */
    private _getHtmlForWebview;
    /**
     * Send a message to the webview
     */
    postMessage(message: any): void;
}
//# sourceMappingURL=chat-view.d.ts.map