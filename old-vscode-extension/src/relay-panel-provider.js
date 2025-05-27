"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayPanelProvider = void 0;
import * as vscode from "vscode";
import { promises as fs_promises } from "fs"; // Renamed to avoid conflict
import { VSCodeLogger } from "./core/logging";
import { RelayService } from "./services/relay-service";

class RelayPanelProvider {
    constructor(extensionUri) {
        this._extensionUri = extensionUri;
        this.relayService = new RelayService({
            logger: VSCodeLogger.getInstance()
        });
    }
    async resolveWebviewView(webviewView, _context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        webviewView.webview.html = await this._getHtmlForWebview();
        // Register the connection with the relay service using a unique ID and the webview object
        this.relayService.registerConnection('relay-panel', webviewView.webview);
        webviewView.webview.onDidReceiveMessage(async (message) => {
            try {
                await this.handleWebviewMessage(message);
            }
            catch (error) {
                VSCodeLogger.getInstance().error('Error handling webview message:', error);
            }
        });
    }
    async handleWebviewMessage(message) {
        if (message.command === 'sendMessage' && message.text) {
            const formattedMessage = {
                command: 'message',
                text: message.text,
                timestamp: new Date().toISOString()
            };
            await this.relayService.sendMessageToWeb(formattedMessage);
        }
    }
    async _getHtmlForWebview() {
        try {
            const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'relay-panel.html');
            const htmlContent = await fs_promises.readFile(htmlPath.fsPath, 'utf8');
            // Replace script src with webview URIs
            return htmlContent.replace(/(<script.*?src=["'])([^"']+)(["'])/g, (_, startTag, scriptPath, endTag) => {
                const scriptUri = vscode.Uri.joinPath(this._extensionUri, 'media', scriptPath);
                return `${startTag}${this._view?.webview.asWebviewUri(scriptUri)}${endTag}`;
            });
        }
        catch (error) {
            VSCodeLogger.getInstance().error('Failed to load relay panel HTML:', error);
            return '<html><body>Failed to load relay panel</body></html>';
        }
    }
    dispose() {
        this._view = undefined;
    }
}
exports.RelayPanelProvider = RelayPanelProvider;
//# sourceMappingURL=relay-panel-provider.js.map