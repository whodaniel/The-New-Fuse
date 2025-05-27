"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminControlPanelProvider = void 0;
class AdminControlPanelProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView, context, _token) {
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
    _getHtmlForWebview(webview) {
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
exports.AdminControlPanelProvider = AdminControlPanelProvider;
AdminControlPanelProvider.viewType = 'thefuse.adminControlPanel';
//# sourceMappingURL=admin-control-panel-provider.js.map