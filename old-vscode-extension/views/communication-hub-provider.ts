import * as vscode from 'vscode';
import { RelayService } from '../relay-service.js';

export class CommunicationHubProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'thefuse.communicationHub';
    private readonly relayService: RelayService;

    constructor(
        private readonly _extensionUri: vscode.Uri,
    ) {
        this.relayService = new RelayService();
    }

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Communication Hub</title>
            </head>
            <body>
                <h2>Communication Hub</h2>
                <div id="messages">
                    <!-- Messages will be displayed here -->
                </div>
            </body>
            </html>
        `;
    }

    public sendMessageToWeb(text: string): void {
        this.relayService.sendMessageToWeb(text);
    }
}