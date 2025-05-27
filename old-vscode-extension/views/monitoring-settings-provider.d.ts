import * as vscode from 'vscode';
export declare class MonitoringSettingsProvider implements vscode.WebviewViewProvider {
    private readonly _extensionUri;
    static readonly viewType = "thefuse.monitoringSettings";
    constructor(_extensionUri: vscode.Uri);
    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken): void;
    private _getHtmlForWebview;
}
//# sourceMappingURL=monitoring-settings-provider.d.ts.map