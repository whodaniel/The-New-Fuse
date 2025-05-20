"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringSettingsProvider = void 0;
class MonitoringSettingsProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView, context, _token) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    }
    _getHtmlForWebview(webview) {
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
exports.MonitoringSettingsProvider = MonitoringSettingsProvider;
MonitoringSettingsProvider.viewType = 'thefuse.monitoringSettings';
//# sourceMappingURL=monitoring-settings-provider.js.map