import * as vscode from 'vscode';
/**
 * Provides a dashboard webview to display agent activity and metrics
 */
export declare class AgentActivityDashboardProvider implements vscode.WebviewViewProvider {
    private readonly _extensionUri;
    static readonly viewType = "thefuse.agentActivityDashboard";
    private _view?;
    private agentMonitor;
    private refreshInterval;
    constructor(_extensionUri: vscode.Uri);
    /**
     * Called when the view is initially created
     */
    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken): void;
    /**
     * Update the webview with current metrics
     */
    refreshDashboard(): void;
    /**
     * Generate the HTML for the webview
     */
    private _getHtmlForWebview;
    /**
     * Clean up resources when the extension is deactivated
     */
    dispose(): void;
}
//# sourceMappingURL=AgentActivityDashboardProvider.d.ts.map