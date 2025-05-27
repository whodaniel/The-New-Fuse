import * as vscode from 'vscode';
/**
 * Enhanced Tools View for the sidebar
 * Provides access to AI tools and features
 */
export declare class ToolsView {
    private _view?;
    private readonly _extensionUri;
    private readonly _coreFeatures;
    private _tools;
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
     * Refresh the tools list
     */
    private _refreshTools;
    /**
     * Execute a tool by ID
     */
    private _executeTool;
    /**
     * Generate HTML content for the webview
     */
    private _getHtmlForWebview;
    /**
     * Send a message to the webview
     */
    postMessage(message: any): void;
}
//# sourceMappingURL=tools-view.d.ts.map