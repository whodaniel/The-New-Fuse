import * as vscode from 'vscode';
/**
 * WebView provider for the AI Coder integration panel
 * Shows status of AI Coder connections and Roo monitoring
 */
export declare class AICoderView implements vscode.WebviewViewProvider {
    static readonly viewType = "thefuse.aiCoderView";
    private _view?;
    private _extensionUri;
    constructor(extensionUri: vscode.Uri);
    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken): void;
    private _updateStatus;
    private _getHtmlForWebview;
    dispose(): void;
}
//# sourceMappingURL=ai-coder-view.d.ts.map