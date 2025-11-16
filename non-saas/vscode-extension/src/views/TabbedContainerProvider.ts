import * as vscode from 'vscode';
import { WebviewMessageRouter } from '../services/communication/WebviewMessageRouter';
import { ChatViewProvider } from './ChatViewProvider';
import { CommunicationHubProvider } from './CommunicationHubProvider';
import { DashboardProvider } from './DashboardProvider';
import { SettingsViewProvider } from './SettingsViewProvider';
import { NotificationService } from '../services/core/NotificationService';

export class TabbedContainerProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'theNewFuse.tabbedContainer';
    private _view?: vscode.WebviewView;
    private _currentTab: string = 'chat';
    private _isInitialized = false;

    constructor(
        private context: vscode.ExtensionContext,
        private webviewMessageRouter: WebviewMessageRouter,
        private chatViewProvider: ChatViewProvider,
        private communicationHubProvider: CommunicationHubProvider,
        private dashboardProvider: DashboardProvider,
        private settingsProvider: SettingsViewProvider,
        private notificationService: NotificationService
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;
        this._view.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.context.extensionUri]
        };

        this._view.webview.html = this._getHtmlForWebview(this._view.webview);
        this._setupMessageHandlers();
        this._initializeProviders();
    }

    private _setupMessageHandlers() {
        if (!this._view) return;

        this._view.webview.onDidReceiveMessage(async (message) => {
            try {
                // Route messages to appropriate providers
                switch (message.command) {
                    case 'switchTab':
                        this.switchToTab(message.tab);
                        break;
                    case 'getCurrentTab':
                        if (this._view) {
                            this._view.webview.postMessage({
                                command: 'currentTab',
                                tab: this._currentTab
                            });
                        }
                        break;
                    case 'initialize':
                        this._sendInitialState();
                        break;
                    default:
                        // Route to webview message router for chat/LLM operations
                        if (this._view) {
                            const response = await this.webviewMessageRouter.handleMessage(
                                this._view.webview,
                                message
                            );
                            if (response) {
                                this._view.webview.postMessage(response);
                            }
                        }
                }
            } catch (error) {
                console.error('Error handling message:', error);
                this.notificationService.showError(`Error: ${error}`);
            }
        });
    }

    private _initializeProviders() {
        if (!this._view) return;

        // Initialize all providers with the webview
        this.chatViewProvider.setWebview(this._view.webview);
        this.communicationHubProvider.setHostWebview(this._view.webview);
        this.dashboardProvider.setHostWebview(this._view.webview);
        this.settingsProvider.setHostWebview(this._view.webview);

        // Set communication hub provider for message routing
        this.webviewMessageRouter.setCommunicationHubProvider(this.communicationHubProvider);

        this._isInitialized = true;
    }

    public switchToTab(tab: string): void {
        this._currentTab = tab;
        if (this._view) {
            this._view.webview.postMessage({
                command: 'tabSwitched',
                tab: tab
            });
        }
    }

    public focus(): void {
        if (this._view) {
            this._view.show?.(true);
        }
    }

    public getCurrentTab(): string {
        return this._currentTab;
    }

    private _sendInitialState() {
        if (!this._view) return;

        this._view.webview.postMessage({
            command: 'initialState',
            tabs: [
                { id: 'chat', label: 'Chat', icon: 'comment-discussion' },
                { id: 'communication', label: 'Communication Hub', icon: 'organization' },
                { id: 'dashboard', label: 'Dashboard', icon: 'graph' },
                { id: 'settings', label: 'Settings', icon: 'settings-gear' }
            ],
            currentTab: this._currentTab
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'media', 'tabbed-container.js')
        );
        
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'media', 'tabbed-container.css')
        );

        const codiconsUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'node_modules', '@vscode/codicons', 'dist', 'codicon.css')
        );

        const nonce = this._getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};">
                <link href="${codiconsUri}" rel="stylesheet">
                <link href="${styleUri}" rel="stylesheet">
                <title>The New Fuse</title>
            </head>
            <body>
                <div class="tabbed-container">
                    <div class="tab-header">
                        <nav class="tab-nav" role="tablist" aria-label="Main navigation">
                            <button class="tab-button active" data-tab="chat" role="tab" aria-selected="true" aria-controls="chat-tab" title="Chat">
                                <i class="codicon codicon-comment-discussion" aria-hidden="true"></i>
                                <span>Chat</span>
                            </button>
                            <button class="tab-button" data-tab="communication" role="tab" aria-selected="false" aria-controls="communication-tab" title="Communication Hub">
                                <i class="codicon codicon-organization" aria-hidden="true"></i>
                                <span>Communication</span>
                            </button>
                            <button class="tab-button" data-tab="dashboard" role="tab" aria-selected="false" aria-controls="dashboard-tab" title="Dashboard">
                                <i class="codicon codicon-graph" aria-hidden="true"></i>
                                <span>Dashboard</span>
                            </button>
                            <button class="tab-button" data-tab="settings" role="tab" aria-selected="false" aria-controls="settings-tab" title="Settings">
                                <i class="codicon codicon-settings-gear" aria-hidden="true"></i>
                                <span>Settings</span>
                            </button>
                        </nav>
                        <div class="connection-status disconnected" id="connection-status">
                            <i class="codicon codicon-circle-filled" aria-hidden="true"></i>
                            <span>Disconnected</span>
                        </div>
                    </div>
                    
                    <div class="tab-content">
                        <div id="chat-tab" class="tab-panel active" role="tabpanel" aria-labelledby="chat-tab">
                            ${this.chatViewProvider.getHtmlBodySnippet(webview, nonce, require('path'))}
                        </div>
                        
                        <div id="communication-tab" class="tab-panel" role="tabpanel" aria-labelledby="communication-tab" aria-hidden="true">
                            ${this.communicationHubProvider.getHtmlBodySnippet(webview, nonce, require('path'))}
                        </div>
                        
                        <div id="dashboard-tab" class="tab-panel" role="tabpanel" aria-labelledby="dashboard-tab" aria-hidden="true">
                            ${this.dashboardProvider.getHtmlBodySnippet(webview, nonce, require('path'))}
                        </div>
                        
                        <div id="settings-tab" class="tab-panel" role="tabpanel" aria-labelledby="settings-tab" aria-hidden="true">
                            ${this.settingsProvider.getHtmlBodySnippet(webview, nonce, require('path'))}
                        </div>
                    </div>
                </div>
                
                <div class="notification-container" id="notification-container" aria-live="polite" aria-atomic="true"></div>
                
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }

    private _getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    public dispose(): void {
        this.chatViewProvider.dispose();
        this.communicationHubProvider.dispose();
        this.dashboardProvider.dispose();
        this.settingsProvider.dispose();
    }
}
