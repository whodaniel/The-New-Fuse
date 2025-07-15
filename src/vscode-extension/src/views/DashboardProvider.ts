import * as vscode from 'vscode';

export class DashboardProvider {
    private _webview?: vscode.Webview;
    private _extensionUri: vscode.Uri;

    constructor(extensionUri: vscode.Uri) {
        this._extensionUri = extensionUri;
    }

    public setHostWebview(webview: vscode.Webview): void {
        this._webview = webview;
    }

    public async getMetrics(): Promise<any> {
        return {
            messagesSent: 0,
            avgResponse: '0s',
            failedRequests: 0,
            uptime: '0%',
            activeSessions: 0,
            connectedAgents: 0,
            totalConversations: 0,
            successRate: '100%'
        };
    }

    public getHtmlBodySnippet(webview: vscode.Webview, nonce: string, path: any): string {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media', 'dashboard.js'))
        );
        
        const styleUri = webview.asWebviewUri(
            vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media', 'dashboard.css'))
        );

        return `
            <link href="${styleUri}" rel="stylesheet">
            <div class="dashboard-container">
                <div class="dashboard-header">
                    <h2><i class="codicon codicon-graph"></i> Analytics Dashboard</h2>
                    <div class="dashboard-controls">
                        <button id="refresh-metrics" class="btn-small">
                            <i class="codicon codicon-refresh"></i> Refresh
                        </button>
                    </div>
                </div>
                
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-icon">
                            <i class="codicon codicon-comment-discussion"></i>
                        </div>
                        <div class="metric-content">
                            <div class="metric-value" id="total-messages">0</div>
                            <div class="metric-label">Total Messages</div>
                        </div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-icon">
                            <i class="codicon codicon-organization"></i>
                        </div>
                        <div class="metric-content">
                            <div class="metric-value" id="active-sessions">0</div>
                            <div class="metric-label">Active Sessions</div>
                        </div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-icon">
                            <i class="codicon codicon-robot"></i>
                        </div>
                        <div class="metric-content">
                            <div class="metric-value" id="connected-agents">0</div>
                            <div class="metric-label">Connected Agents</div>
                        </div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-icon">
                            <i class="codicon codicon-clock"></i>
                        </div>
                        <div class="metric-content">
                            <div class="metric-value" id="avg-response-time">0s</div>
                            <div class="metric-label">Avg Response Time</div>
                        </div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-icon">
                            <i class="codicon codicon-check"></i>
                        </div>
                        <div class="metric-content">
                            <div class="metric-value" id="success-rate">100%</div>
                            <div class="metric-label">Success Rate</div>
                        </div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-icon">
                            <i class="codicon codicon-x"></i>
                        </div>
                        <div class="metric-content">
                            <div class="metric-value" id="failed-requests">0</div>
                            <div class="metric-label">Failed Requests</div>
                        </div>
                    </div>
                </div>
                
                <div class="dashboard-sections">
                    <div class="dashboard-section">
                        <h3>Recent Activity</h3>
                        <div id="recent-activity" class="activity-list">
                            <div class="activity-item">
                                <i class="codicon codicon-info"></i>
                                <span>Dashboard initialized</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="dashboard-section">
                        <h3>System Health</h3>
                        <div class="health-indicators">
                            <div class="health-item">
                                <span class="health-label">LLM Provider</span>
                                <span class="health-status online">Online</span>
                            </div>
                            <div class="health-item">
                                <span class="health-label">API Connection</span>
                                <span class="health-status online">Online</span>
                            </div>
                            <div class="health-item">
                                <span class="health-label">WebSocket</span>
                                <span class="health-status online">Online</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <script nonce="${nonce}" src="${scriptUri}"></script>
        `;
    }

    public dispose(): void {
        this._webview = undefined;
    }
}
