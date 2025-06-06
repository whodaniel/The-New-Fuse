import * as vscode from 'vscode';
export class DashboardProvider {
    constructor(private context: vscode.ExtensionContext) {}
    public setHostWebview(webview: vscode.Webview): void { console.log('DashboardProvider host webview set'); }
    public async getMetrics(): Promise<any> { return { messagesSent: 0, avgResponse: '0s', failedRequests: 0, uptime: '0%' }; }
    
    public getHtmlBodySnippet(webview: vscode.Webview, nonce: string): string {
        return `
            <div class="dashboard-container">
                <h2>Dashboard</h2>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <h3>Messages Sent</h3>
                        <p id="messages-sent">0</p>
                    </div>
                    <div class="metric-card">
                        <h3>Average Response</h3>
                        <p id="avg-response">0s</p>
                    </div>
                    <div class="metric-card">
                        <h3>Failed Requests</h3>
                        <p id="failed-requests">0</p>
                    </div>
                    <div class="metric-card">
                        <h3>Uptime</h3>
                        <p id="uptime">0%</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    public dispose(): void {}
}
