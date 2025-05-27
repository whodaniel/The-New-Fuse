import * as vscode from 'vscode';
export declare class AdminControlPanelProvider implements vscode.WebviewViewProvider {
    private readonly _extensionUri;
    static readonly viewType = "thefuse.adminControlPanel";
    constructor(_extensionUri: vscode.Uri);
    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken): void;
    private _getHtmlForWebview;
}
//# sourceMappingURL=admin-control-panel-provider.d.ts.map