import * as vscode from 'vscode';
import { ChatViewProvider } from './ChatViewProvider';
import { CommunicationHubProvider } from './CommunicationHubProvider';
import { DashboardProvider } from './DashboardProvider';
import { SettingsViewProvider } from './SettingsViewProvider';
import { WebviewMessageRouter } from '../services/WebviewMessageRouter';

/**
 * Provider for the tabbed container webview that houses all other views
 */
export class TabbedContainerProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'theNewFuse.tabbedContainer';
  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _extensionContext: vscode.ExtensionContext,
    private readonly _chatProvider: ChatViewProvider,
    private readonly _communicationHubProvider: CommunicationHubProvider,
    private readonly _dashboardProvider: DashboardProvider,
    private readonly _settingsProvider: SettingsViewProvider,
    private readonly _messageRouter: WebviewMessageRouter
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;
    // Pass the host webview to child providers
    if (this._view) {
        this._chatProvider.setHostWebview(this._view.webview);
        this._communicationHubProvider.setHostWebview(this._view.webview);
        this._dashboardProvider.setHostWebview(this._view.webview);
        this._settingsProvider.setHostWebview(this._view.webview);
    }

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(async message => {
      try {
        if (message.command === 'requestTabContent' && this._view) {
          const tabId = message.tabId;
          const nonce = getNonce(); // Important: generate nonce for dynamically loaded content
          const htmlContent = this._getTabContent(tabId, this._view.webview, nonce);
          this._view.webview.postMessage({
            command: 'updateTabContent',
            tabId: tabId,
            html: htmlContent
          });
        } else if (message.command === 'tabChanged') { // ADDED THIS BLOCK
          console.log(`TabbedContainerProvider: Tab changed to "${message.tabId}". Content loading should be initiated by client-side 'requestTabContent'.`);
          // This message is informational from the client; actual content loading
          // is triggered by 'requestTabContent' from tabbed-container.js.
          // No further action needed here for tabChanged itself.
        } else if (message.source === 'chatView') {
            // Chat view messages are handled directly by the chat provider via its webview message handler
            console.log('Chat message received via tabbed container');
        } else if (message.source === 'communicationHubView' && this._communicationHubProvider.handleHubMessage) {
            await this._communicationHubProvider.handleHubMessage(message);
        } else if (message.source === 'dashboardView' && this._dashboardProvider.handleDashboardMessage) {
            await this._dashboardProvider.handleDashboardMessage(message);
        } else if (message.source === 'settingsView' && this._settingsProvider.handleSettingsMessage) {
            await this._settingsProvider.handleSettingsMessage(message);
        } else {
          // Ensure message router can pass the webview for replies if needed
          // The message router might need to be aware of the host webview to post replies
          if (this._view && typeof (this._messageRouter as any).setHostWebview === 'function') {
            (this._messageRouter as any).setHostWebview(this._view.webview);
          }
          await this._messageRouter.handleMessage(message);
        }
      } catch (error) {
        console.error('Error handling tabbed container message:', error);
      }
    });

    // Update webview when configuration changes
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('theNewFuse')) {
        // Instead of full HTML re-render, post a message to the client-side JS
        // to request an update for the currently active tab, or for specific components.
        // Or, if a full re-render of the current tab is simple enough:
        this._updateCurrentTabContent();
      }
    });
  }

  /**
   * Update the webview content
   */
  private _updateWebview(): void {
    // This method re-renders the entire tabbed container, which might be too disruptive.
    // Consider updating only the active tab's content or posting a message.
    if (this._view) {
      this._view.webview.html = this._getHtmlForWebview(this._view.webview);
    }
  }

  private _updateCurrentTabContent(): void {
    if (this._view && this._view.visible) {
        // This is a simplified way; ideally, the client-side JS would tell us the active tab.
        // For now, we could re-post the 'updateTabContent' for the default 'chat' tab or a stored active tab.
        // This needs a robust way to know the current active tab from the webview's perspective.
    }
  }

  /**
   * Handle tab change
   */
  // private async _handleTabChange(tab: string): Promise<void> {
  //   console.log(`Switching to tab: ${tab}`);
  //   // This logic is now effectively handled by 'requestTabContent' and posting 'updateTabContent'
  // }

  /**
   * Get the content for a specific tab
   */
  private _getTabContent(tab: string, webview: vscode.Webview, nonce: string): string {
    switch (tab) {
      case 'chat':
        // Assuming ChatViewProvider has getHtmlBodySnippet(webview, nonce)
        return this._chatProvider.getHtmlBodySnippet(webview, nonce);
      case 'communication':
        return this._communicationHubProvider.getHtmlBodySnippet(webview, nonce);
      case 'dashboard':
        return this._dashboardProvider.getHtmlBodySnippet(webview, nonce);
      case 'settings':
        return this._settingsProvider.getHtmlBodySnippet(webview, nonce);
      default:
        return '<div class="tab-content-error">Unknown tab</div>';
    }
  }

  /**
   * Get communication hub tab content
   */
  private _getCommunicationTabContent(): string {
    return `
      <div class="communication-container">
        <div class="communication-header">
          <h3>Communication Hub</h3>
          <div class="status-indicator">
            <span id="connectionStatus">Disconnected</span>
          </div>
        </div>
        <div class="agent-list">
          <h4>Connected Agents</h4>
          <div id="agentsList"></div>
        </div>
        <div class="protocol-status">
          <h4>Protocol Status</h4>
          <div id="protocolStatus"></div>
        </div>
      </div>
    `;
  }

  /**
   * Get dashboard tab content
   */
  private _getDashboardTabContent(): string {
    return `
      <div class="dashboard-container">
        <div class="dashboard-header">
          <h3>Monitoring Dashboard</h3>
          <div class="dashboard-controls">
            <button id="refreshStatsBtn" class="btn btn-secondary">Refresh</button>
            <button id="clearDataBtn" class="btn btn-danger">Clear Data</button>
          </div>
        </div>
        <div class="stats-grid">
          <div class="stat-card">
            <h4>LLM Requests</h4>
            <div id="llmRequestCount" class="stat-value">0</div>
          </div>
          <div class="stat-card">
            <h4>Agent Messages</h4>
            <div id="agentMessageCount" class="stat-value">0</div>
          </div>
          <div class="stat-card">
            <h4>Active Sessions</h4>
            <div id="activeSessionCount" class="stat-value">0</div>
          </div>
          <div class="stat-card">
            <h4>Errors</h4>
            <div id="errorCount" class="stat-value">0</div>
          </div>
        </div>
        <div class="monitoring-logs">
          <h4>Recent Activity</h4>
          <div id="monitoringLogs"></div>
        </div>
      </div>
    `;
  }

  /**
   * Generate the HTML for the webview
   */
  private _getHtmlForWebview(webview: vscode.Webview): string {
    // Get the local path to main script and CSS files
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'tabbed-container.js'));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'tabbed-container.css'));
    const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'codicons', 'codicon.css'));
    
    // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce();

    // Get initial content for the default 'chat' tab
    const initialChatContent = this._getTabContent('chat', webview, nonce);

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline' https://cdnjs.cloudflare.com; script-src 'nonce-${nonce}'; font-src ${webview.cspSource} https://cdnjs.cloudflare.com;">
        <link href="${styleUri}" rel="stylesheet">
        <link href="${codiconsUri}" rel="stylesheet">
        <title>The New Fuse</title>
    </head>
    <body>
        <div class="container">
            <div class="tab-header">
                <div class="tab-nav">
                    <button class="tab-button active" data-tab="chat" title="AI Chat (Ctrl+Shift+1)">
                        <span class="codicon codicon-comment-discussion"></span>
                        AI Chat
                    </button>
                    <button class="tab-button" data-tab="communication" title="Communication Hub (Ctrl+Shift+2)">
                        <span class="codicon codicon-radio-tower"></span>
                        Communication Hub
                    </button>
                    <button class="tab-button" data-tab="dashboard" title="Dashboard (Ctrl+Shift+3)">
                        <span class="codicon codicon-graph"></span>
                        Dashboard
                    </button>
                    <button class="tab-button" data-tab="settings" title="Settings (Ctrl+Shift+4)">
                        <span class="codicon codicon-settings-gear"></span>
                        Settings
                    </button>
                </div>
            </div>
            <div class="tab-content-container">
                <div id="tab-chat" class="tab-content active">
                    ${initialChatContent}
                </div>
                <div id="tab-communication" class="tab-content">
                    <!-- Communication Hub content will be loaded dynamically -->
                </div>
                <div id="tab-dashboard" class="tab-content">
                    <!-- Dashboard content will be loaded dynamically -->
                </div>
                <div id="tab-settings" class="tab-content">
                    <!-- Settings content will be loaded dynamically -->
                </div>
            </div>
        </div>
        
        <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
    </html>`;
  }

  /**
   * Public method to switch to a specific tab
   */
  public switchToTab(tab: string) {
    if (this._view) {
      this._view.webview.postMessage({
        command: 'switchTab',
        tab: tab
      });
    }
  }

  /**
   * Public method to focus the view
   */
  public focus() {
    if (this._view) {
      this._view.show(true);
    }
  }

  public dispose() {
    this._chatProvider.dispose?.();
    this._communicationHubProvider.dispose?.();
    this._dashboardProvider.dispose?.();
    this._settingsProvider.dispose?.();
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
