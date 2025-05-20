import * as vscode from 'vscode';
export declare class CommunicationHubProvider implements vscode.WebviewViewProvider {
    private readonly _extensionUri;
    static readonly viewType = "thefuse.communicationHub";
    private readonly relayService;
    constructor(_extensionUri: vscode.Uri);
    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken): void;
    private _getHtmlForWebview;
    sendMessageToWeb(text: string): void;
}
//# sourceMappingURL=communication-hub-provider.d.ts.map