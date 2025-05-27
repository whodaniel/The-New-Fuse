import * as vscode from 'vscode';
import { RelayService, RelayServiceOptions } from '../services/relay-service.js';
import { getLogger, ExtensionLogger, LogLevel } from '../core/logging.js'; // Removed unused imports, changed Logger to ExtensionLogger
import { WebViewMessage } from '../types/webview.js';

export class CommunicationHubProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private readonly relayService: RelayService;

    constructor(
        private readonly logger: ExtensionLogger, // Changed Logger to ExtensionLogger
        extensionUri: vscode.Uri
    ) {
        // Create RelayService with proper options
        const options: RelayServiceOptions = {
            logger: this.logger,
            port: 3000
        };
        this.relayService = new RelayService(options);
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ): void | vscode.Thenable<void> {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true
        };

        webviewView.webview.html = this._getHtmlForWebview();
        
        // Use registerConnection instead of registerPanel
        if (typeof this.relayService.registerConnection === 'function') {
            this.relayService.registerConnection('webview', webviewView.webview);
        }

        webviewView.webview.onDidReceiveMessage(async (message: WebViewMessage) => {
            await this.handleWebviewMessage(message);
        });
    }

    private async handleWebviewMessage(message: WebViewMessage): Promise<void> {
        try {
            if (message.command === 'sendMessage' && message.text) {
                await this.sendMessage({
                    command: 'message',
                    text: message.text,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            this.logger.error('Error handling webview message:', error);
        }
    }

    private async sendMessage(message: WebViewMessage): Promise<void> {
        await this.relayService.sendMessageToWeb(message);
    }

    private _getHtmlForWebview(): string {
        return `<!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>AI Communication Hub</title>
            </head>
            <body>
                <div id="communication-hub">
                    <div id="messages"></div>
                    <div id="input-area">
                        <input type="text" id="message-input" placeholder="Type your message...">
                        <button id="send-button">Send</button>
                    </div>
                </div>
                <script>
                    // Communication hub initialization code here
                </script>
            </body>
            </html>`;
    }
}
