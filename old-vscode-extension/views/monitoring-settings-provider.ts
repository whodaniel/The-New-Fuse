import * as vscode from 'vscode';

export class MonitoringSettingsProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'thefuse.monitoringSettings';

    constructor(
        private readonly _extensionUri: vscode.Uri,
    ) {}

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
                <title>Monitoring Settings</title>
            </head>
            <body>
                <h2>Monitoring Settings</h2>
                <div id="settings">
                    <!-- Settings content will be dynamically populated -->
                </div>
            </body>
            </html>
        `;
    }
}