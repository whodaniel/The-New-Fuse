import * as vscode from 'vscode';
export class DashboardProvider {
    constructor(private context: vscode.ExtensionContext) {}
    public setHostWebview(webview: vscode.Webview): void { console.log('DashboardProvider host webview set'); }
    public async getMetrics(): Promise<any> { return { messagesSent: 0, avgResponse: '0s', failedRequests: 0, uptime: '0%' }; }
    public dispose(): void {}
}
