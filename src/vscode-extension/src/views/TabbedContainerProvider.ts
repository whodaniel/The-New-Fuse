import * as vscode from 'vscode';
import { WebviewMessageRouter } from '../services/communication/WebviewMessageRouter'; // Adjusted path
import { ChatService } from '../services/features/ChatService';
import { NotificationService } from '../services/core/NotificationService';
import { ChatViewProvider } from './ChatViewProvider';
import { CommunicationHubProvider } from './CommunicationHubProvider';
import { DashboardProvider } from './DashboardProvider';
import { SettingsViewProvider } from './SettingsViewProvider';

/**
 * Provider for the tabbed container webview.
 * This class is responsible for rendering the main tabbed UI and delegating
 * messages from the webview to the WebviewMessageRouter.
 */
export class TabbedContainerProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'theNewFuse.tabbedContainer';
  private _view?: vscode.WebviewView;
  private _extensionUri: vscode.Uri;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly webviewMessageRouter: WebviewMessageRouter,
    private readonly chatViewProvider: ChatViewProvider,
    private readonly communicationHubProvider: CommunicationHubProvider,
    private readonly dashboardProvider: DashboardProvider,
    private readonly settingsProvider: SettingsViewProvider,
    private readonly notificationService: NotificationService,
  ) {
    this._extensionUri = context.extensionUri;
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext, // Renamed to avoid conflict with class member
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri, vscode.Uri.joinPath(this._extensionUri, 'media')]
    };

    // Set the webview for all providers
    if (this.chatViewProvider) {
        this.chatViewProvider.setWebview(webviewView.webview);
    }
    if (this.communicationHubProvider) {
        this.communicationHubProvider.setHostWebview(webviewView.webview);
        // Register the communication hub provider with the message router
        this.webviewMessageRouter.setCommunicationHubProvider(this.communicationHubProvider);
    }
    if (this.dashboardProvider) {
        this.dashboardProvider.setHostWebview(webviewView.webview);
    }
    if (this.settingsProvider) {
        this.settingsProvider.setHostWebview(webviewView.webview);
    }

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(
        async (message) => {
            // Delegate all messages to the WebviewMessageRouter
            if (this.webviewMessageRouter) {
                await this.webviewMessageRouter.handleMessage(webviewView.webview, message);
            }
        },
        undefined,
        this.context.subscriptions
    );
  }

  /**
   * Generate the HTML for the webview.
   */
  private _getHtmlForWebview(webview: vscode.Webview): string {
    const nonce = getNonce();
    const mainScriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'tabbed-container.js')); // Updated to tabbed-container.js as per typical naming, assuming main.js was a placeholder or old name
    const chatPanelScriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'chat-panel.js'));
    const mainStyleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));
    const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'codicons', 'codicon.css'));

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="
            default-src 'none';
            style-src ${webview.cspSource} 'unsafe-inline';
            font-src ${webview.cspSource};
            img-src ${webview.cspSource} https: data:;
            script-src 'nonce-${nonce}';
        ">
        <link href="${mainStyleUri}" rel="stylesheet">
        <link href="${codiconsUri}" rel="stylesheet">
        <title>The New Fuse</title>
    </head>
    <body>
        <div class="tab-container">
            <nav class="tab-nav">
                <button class="tab-button active" data-tab-id="chat">
                    <span class="codicon codicon-comment-discussion"></span> Chat
                </button>
                <button class="tab-button" data-tab-id="communication">
                    <span class="codicon codicon-radio-tower"></span> Communication
                </button>
                <button class="tab-button" data-tab-id="dashboard">
                    <span class="codicon codicon-dashboard"></span> Dashboard
                </button>
                <button class="tab-button" data-tab-id="settings">
                    <span class="codicon codicon-settings-gear"></span> Settings
                </button>
            </nav>

            <div id="chat-content" class="tab-content-area active" data-tab-id="chat">
                ${this.chatViewProvider ? this.chatViewProvider.getHtmlForChatPanel(webview, nonce) : '<p>Chat panel loading...</p>'}
            </div>
            <div id="communication-content" class="tab-content-area" data-tab-id="communication">
                ${this.communicationHubProvider ? this.communicationHubProvider.getHtmlBodySnippet(webview, nonce) : '<p>Communication Hub loading...</p>'}
            </div>
            <div id="dashboard-content" class="tab-content-area" data-tab-id="dashboard">
                ${this.dashboardProvider ? this.dashboardProvider.getHtmlBodySnippet(webview, nonce) : '<p>Dashboard loading...</p>'}
            </div>
            <div id="settings-content" class="tab-content-area" data-tab-id="settings">
                ${this.settingsProvider ? this.settingsProvider.getHtmlBodySnippet(webview, nonce) : '<p>Settings loading...</p>'}
            </div>
        </div>
        
        <!-- Connection Status Indicator (Example) -->
        <div id="connection-status-indicator" style="position: fixed; bottom: 5px; right: 10px; padding: 5px; background-color: #333; color: white; border-radius: 3px;">
            Status: Disconnected
        </div>

        <!-- Notification Area (Example) -->
        <div id="webview-notification-area" style="position: fixed; top: 10px; right: 10px; z-index: 1000;">
            <!-- Notifications will be appended here by main.js -->
        </div>

        <script nonce="${nonce}" src="${mainScriptUri}"></script>
        <script nonce="${nonce}" src="${chatPanelScriptUri}"></script>
    </body>
    </html>`;
  }

  /**
   * Sends a message to the webview to switch to the specified tab.
   * @param tabId The ID of the tab to switch to.
   */
  public switchToTab(tabId: 'chat' | 'communication' | 'dashboard' | 'settings'): void {
    if (this._view) {
      this._view.webview.postMessage({
        command: 'switchToTab',
        payload: { tabId }
      });
    }
  }

  /**
   * Sends a message to the webview to display a notification.
   * @param type The type of notification ('success', 'error', 'warning').
   * @param message The message to display.
   */
  public showNotification(type: 'success' | 'error' | 'warning', message: string): void {
    if (this._view) {
      this._view.webview.postMessage({
        command: 'showNotification',
        payload: { type, message }
      });
    }
  }

  /**
   * Sends a message to the webview to update a connection status indicator.
   * @param isConnected Whether the connection is active.
   */
  public updateConnectionStatus(isConnected: boolean): void {
    if (this._view) {
      this._view.webview.postMessage({
        command: 'updateConnectionStatus',
        payload: { isConnected }
      });
    }
  }
  
  /**
   * Public method to focus the view
   */
  public focus() {
    if (this._view) {
      this._view.show(true); // The `true` argument preserves focus.
    }
  }

  public dispose() {
    // Any disposables managed by this provider directly would be disposed here.
    // For example, if we had created any event listeners on vscode objects
    // not automatically handled by context.subscriptions.
    // In this refactored version, most heavy lifting and resource management
    // are delegated or handled by `context.subscriptions` for the message listener.
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
