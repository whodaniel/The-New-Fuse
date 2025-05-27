import * as vscode from 'vscode';

export class AdminControlPanelProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'thefuse.adminControlPanel';

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

        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'restart':
                    // Handle restart
                    break;
                case 'updateSettings':
                    // Handle settings update
                    break;
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Admin Control Panel</title>
            </head>
            <body>
                <h2>Admin Control Panel</h2>
                <div id="controls">
                    <!-- Control panel content -->
                </div>
            </body>
            </html>
        `;
    }
}