import * as vscode from 'vscode';
import { getLogger, Logger as LoggerType } from './core/logging.js';
// import { ConversationManager } from './chat/ConversationManager.js'; // Removed
// import { AgentDiscoveryManager } from './extension-discovery/agent-discovery-manager.js'; // Removed
import { LLMProviderManager } from './llm/LLMProviderManager.js';

export class ChatView implements vscode.WebviewViewProvider { // Implements WebviewViewProvider
    public static readonly viewType = 'thefuse-chat';

    private _view?: vscode.WebviewView;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    // Assuming these might still be needed or passed differently if ChatView is a provider
    // For now, focusing on context and llmManager for the task
    // private _agentDiscovery: AgentDiscoveryManager;
    // private _conversationManager: ConversationManager;
    private logger: LoggerType;

    private _context: vscode.ExtensionContext; // Added
    private _llmManager: LLMProviderManager; // Added

    constructor(
        extensionUri: vscode.Uri,
        context: vscode.ExtensionContext, // Added
        llmManager: LLMProviderManager, // Added
        // agentDiscovery: AgentDiscoveryManager, // If needed
        // conversationManager: ConversationManager // If needed
    ) {
        this._extensionUri = extensionUri;
        this._context = context; // Stored
        this._llmManager = llmManager; // Stored
        // this._agentDiscovery = agentDiscovery;
        // this._conversationManager = conversationManager;

        this.logger = getLogger();
        this.logger.info('ChatView (WebviewViewProvider) instance created');
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        // resolveContext: vscode.WebviewViewResolveContext, // Renamed to avoid conflict with extension context
        // _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'media'), vscode.Uri.joinPath(this._extensionUri, 'out')]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(
            async message => {
                this.logger.info(`ChatView received message: ${JSON.stringify(message)}`);
                switch (message.command) {
                    case 'alert':
                        vscode.window.showErrorMessage(message.text);
                        return;
                    case 'postMessage': // Assuming this is for general chat messages
                        this.handleUserMessage(message.text);
                        return;
                    case 'saveCerebrasApiKey':
                        if (message.apiKey && typeof message.apiKey === 'string') {
                            try {
                                await this._context.secrets.store('thefuse.cerebrasApiKey', message.apiKey);
                                this.logger.info('Cerebras API key saved successfully.');
                                webviewView.webview.postMessage({ command: 'saveCerebrasApiKeyStatus', status: 'success' });
                            } catch (error) {
                                this.logger.error('Failed to save Cerebras API key:', error);
                                webviewView.webview.postMessage({ command: 'saveCerebrasApiKeyStatus', status: 'error', error: (error as Error).message });
                            }
                        } else {
                            this.logger.warn('Invalid apiKey received for saveCerebrasApiKey');
                        }
                        return;
                    case 'saveApiKey': // Generic save API key command
                        if (message.providerId === 'cerebras' && message.apiKey && typeof message.apiKey === 'string') {
                            try {
                                await this._context.secrets.store('thefuse.cerebrasApiKey', message.apiKey);
                                this.logger.info('Cerebras API key saved successfully via generic saveApiKey.');
                                webviewView.webview.postMessage({ command: 'saveApiKeyStatus', providerId: 'cerebras', status: 'success' });
                            } catch (error) {
                                this.logger.error('Failed to save Cerebras API key via generic saveApiKey:', error);
                                webviewView.webview.postMessage({ command: 'saveApiKeyStatus', providerId: 'cerebras', status: 'error', error: (error as Error).message });
                            }
                        } else if (message.providerId === 'cerebras') {
                            this.logger.warn('Invalid apiKey received for saveApiKey (cerebras)');
                        }
                        // Handle other providers if necessary, or ignore if not 'cerebras'
                        return;
                    case 'getModelsForProvider':
                        if (message.providerId === 'cerebras') {
                            try {
                                const models = await this._llmManager.getModelsForProvider('cerebras');
                                this.logger.info(`Fetched Cerebras models: ${models.length}`);
                                webviewView.webview.postMessage({ command: 'cerebrasModelsResponse', models: models });
                            } catch (error) {
                                this.logger.error('Failed to get Cerebras models:', error);
                                webviewView.webview.postMessage({ command: 'cerebrasModelsResponse', models: [], error: (error as Error).message });
                            }
                        }
                        // Handle other providers if necessary
                        return;
                    default:
                        this.logger.warn(`ChatView received unknown command: ${message.command}`);
                }
            },
            null,
            this._disposables
        );

        this.logger.info('ChatView resolved webview and message listener attached.');
    }

    public dispose() {
        this.logger.info('ChatView disposing');
        // Clean up our resources
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    // _update and _getHtmlForWebview might need adjustments if they relied on _panel
    // For now, assuming _getHtmlForWebview is adaptable
    private _getHtmlForWebview(webview: vscode.Webview) {
    // Local path to main script run in the webview
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'out', 'webview', 'chatView.js'));

    // Local path to css styles
    const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
    const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
    const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));

    // Use a nonce to only allow specific scripts to be run
    const nonce = this.getNonce();

    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="${styleResetUri}" rel="stylesheet">
            <link href="${styleVSCodeUri}" rel="stylesheet">
            <link href="${styleMainUri}" rel="stylesheet">
            <title>Chat View</title>
        </head>
        <body>
            <h1>Hello from the Chat View!</h1>

            <div id="chat-container">
                <div id="messages">
                    </div>
                <div id="input-area">
                    <textarea id="user-input" placeholder="Type your message..."></textarea>
                    <button id="send-button">Send</button>
                </div>
            </div>

            <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>`;
}

private getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

private handleUserMessage(message: string) {
    this.logger.info(`User message received: "${message}"`);
    // This method might need ConversationManager if it's still used
    // For now, let's just echo it back or add a placeholder response.
    this.addMessageToChat('User', message);
    this.addMessageToChat('Agent', `Echo: ${message}`); // Placeholder response
}

private addMessageToChat(sender: string, text: string) {
    if (this._view) {
        this._view.webview.postMessage({ command: 'addMessage', sender, text });
    }
}
}