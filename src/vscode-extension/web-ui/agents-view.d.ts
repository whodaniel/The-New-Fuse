import * as vscode from 'vscode';
/**
 * Enhanced Agents View for the sidebar
 * Lists available AI agents with status and controls
 */
export declare class AgentsView {
    private _view?;
    private readonly _extensionUri;
    private readonly _agentDiscovery;
    private _agents;
    private _disposables;
    constructor(extensionUri: vscode.Uri);
    dispose(): void;
    protected getNonce(): string;
    protected getBaseHtml(webview: vscode.Webview, title: string, bodyContent: string): string;
    /**
     * Called when the webview is created
     */
    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken): void;
    /**
     * Get the latest agents from AgentDiscoveryManager
     */
    private _refreshAgents;
    /**
     * Connect to an agent
     */
    private _connectAgent;
    /**
     * Disconnect from an agent
     */
    private _disconnectAgent;
    /**
     * Start a conversation with an agent
     */
    private _startConversation;
    /**
     * Configure an agent
     */
    private _configureAgent;
    /**
     * Generate HTML content for the webview
     */
    private _getHtmlForWebview;
    /**
     * Send a message to the webview
     */
    postMessage(message: any): void;
}
//# sourceMappingURL=agents-view.d.ts.map