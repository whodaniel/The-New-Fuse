"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayPanelProvider = void 0;
import * as vscode from "vscode";
import { promises as fs_promises } from "fs"; // Renamed to avoid conflict
import { getLogger } from "../core/logging"; // Removed unused imports, ensured getLogger is imported
import { RelayService } from "../services/relay-service";
import { getErrorMessage } from "../utils/error-utils";
class RelayPanelProvider {
    constructor(extensionUri) {
        this._extensionUri = extensionUri;
        this.logger = getLogger(); // Initialize logger
        // Create RelayService with proper options
        // Pass the logger instance if RelayService needs it, otherwise remove
        const options = {
            logger: this.logger, // Pass the provider's logger
            port: 3000
        };
        this._relayService = new RelayService(options);
    }
    /**
     * Get the relay service instance
     */
    get relayService() {
        return this._relayService;
    }
    async resolveWebviewView(webviewView, _context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        try {
            webviewView.webview.html = await this._getHtmlForWebview();
            // Register the webview with the relay service for communication
            // Using registerConnection instead of registerPanel if available
            if (typeof this.relayService.registerConnection === 'function') {
                this.relayService.registerConnection('webview', webviewView.webview);
            }
            webviewView.webview.onDidReceiveMessage(async (message) => {
                try {
                    await this.handleWebviewMessage(message);
                }
                catch (error) {
                    this.logger.error('Error handling webview message:', getErrorMessage(error)); // Use local logger
                }
            });
        }
        catch (error) {
            this.logger.error('Error resolving webview:', getErrorMessage(error)); // Use local logger
            webviewView.webview.html = '<html><body>Failed to load relay panel</body></html>';
        }
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
                const webviewUri = this._view?.webview.asWebviewUri(scriptUri);
                return `${startTag}${webviewUri}${endTag}`;
            });
        }
        catch (error) {
            this.logger.error('Failed to load relay panel HTML:', getErrorMessage(error)); // Use local logger
            throw error;
        }
    }
    dispose() {
        this.relayService.dispose();
        this._view = undefined;
    }
}
exports.RelayPanelProvider = RelayPanelProvider;
//# sourceMappingURL=relay-panel-provider.js.map