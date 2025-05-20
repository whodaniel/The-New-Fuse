"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationHubProvider = void 0;
const relay_service_1 = require("../relay-service");
class CommunicationHubProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
        this.relayService = new relay_service_1.RelayService();
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
    sendMessageToWeb(text) {
        this.relayService.sendMessageToWeb(text);
    }
}
exports.CommunicationHubProvider = CommunicationHubProvider;
CommunicationHubProvider.viewType = 'thefuse.communicationHub';
//# sourceMappingURL=communication-hub-provider.js.map