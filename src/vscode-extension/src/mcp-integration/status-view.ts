import * as vscode from 'vscode';
import { MCPMonitor } from './monitoring.js';

export class MCPStatusView {
    private statusBarItem: vscode.StatusBarItem;
    private webviewPanel: vscode.WebviewPanel | null = null;
    private updateInterval: NodeJS.Timeout | null = null;
    private monitor: MCPMonitor;

    constructor(monitor: MCPMonitor) {
        this.monitor = monitor;
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this.statusBarItem.command = 'thefuse.mcp.showMonitoring';
        this.statusBarItem.tooltip = 'Show MCP Monitoring';
    }

    /**
     * Start status updates
     */
    start(intervalMs: number = 1000) {
        this.stop();
        this.updateStatus();
        this.updateInterval = setInterval(() => this.updateStatus(), intervalMs);
        this.statusBarItem.show();
    }

    /**
     * Stop status updates
     */
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Update status bar metrics
     */
    private updateStatus() {
        const metrics = this.monitor.getMetrics();
        const alerts = this.monitor.getAlerts();
        
        // Format status text
        let status = `$(pulse) MCP: `;
        
        // Add key metrics
        status += `${metrics.connections} conn | `;
        status += `${Math.round(metrics.messageRate)}/s | `;
        status += `${Math.round(metrics.averageLatency)}ms`;

        // Add error indicator if there are alerts
        if (alerts.some(a => a.type === 'error')) {
            status += ` $(warning) `;
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        } else if (metrics.errorRate > 0.1) { // >10% error rate
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        } else {
            this.statusBarItem.backgroundColor = undefined;
        }

        this.statusBarItem.text = status;
        
        // Update webview if open
        if (this.webviewPanel) {
            this.updateWebview();
        }
    }

    /**
     * Show detailed monitoring view
     */
    async showDetailedView() {
        if (this.webviewPanel) {
            this.webviewPanel.reveal();
            return;
        }

        this.webviewPanel = vscode.window.createWebviewPanel(
            'mcpMonitoring',
            'MCP Monitoring',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        // Handle panel close
        this.webviewPanel.onDidDispose(() => {
            this.webviewPanel = null;
        });

        this.updateWebview();
    }

    /**
     * Update webview content
     */
    private updateWebview() {
        if (!this.webviewPanel) return;

        const metrics = this.monitor.getMetrics();
        const alerts = this.monitor.getAlerts();

        this.webviewPanel.webview.html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        padding: 20px;
                    }
                    .metrics-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 20px;
                        margin-bottom: 30px;
                    }
                    .metric-card {
                        background: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-widget-border);
                        padding: 15px;
                        border-radius: 4px;
                    }
                    .metric-title {
                        color: var(--vscode-descriptionForeground);
                        font-size: 0.9em;
                        margin-bottom: 5px;
                    }
                    .metric-value {
                        font-size: 1.8em;
                        font-weight: bold;
                    }
                    .alerts {
                        margin-top: 30px;
                    }
                    .alert {
                        padding: 10px;
                        margin-bottom: 10px;
                        border-radius: 4px;
                    }
                    .alert.error {
                        background: var(--vscode-inputValidation-errorBackground);
                        border: 1px solid var(--vscode-inputValidation-errorBorder);
                    }
                    .alert.warning {
                        background: var(--vscode-inputValidation-warningBackground);
                        border: 1px solid var(--vscode-inputValidation-warningBorder);
                    }
                </style>
            </head>
            <body>
                <h1>MCP Monitoring</h1>
                
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-title">Connections</div>
                        <div class="metric-value">${metrics.connections}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-title">Message Rate</div>
                        <div class="metric-value">${Math.round(metrics.messageRate)}/sec</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-title">Average Latency</div>
                        <div class="metric-value">${Math.round(metrics.averageLatency)}ms</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-title">Error Rate</div>
                        <div class="metric-value">${(metrics.errorRate * 100).toFixed(2)}%</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-title">Active Tools</div>
                        <div class="metric-value">${metrics.activeTools}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-title">Memory Usage</div>
                        <div class="metric-value">${Math.round(metrics.memoryUsage / (1024 * 1024))}MB</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-title">CPU Usage</div>
                        <div class="metric-value">${(metrics.cpuUsage * 100).toFixed(1)}%</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-title">Uptime</div>
                        <div class="metric-value">${Math.round(metrics.uptime / 1000)}s</div>
                    </div>
                </div>

                ${alerts.length > 0 ? `
                    <div class="alerts">
                        <h2>Active Alerts</h2>
                        ${alerts.map(alert => `
                            <div class="alert ${alert.type}">
                                ${alert.message}
                                <div style="font-size: 0.9em; color: var(--vscode-descriptionForeground);">
                                    ${new Date(alert.timestamp).toLocaleString()}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </body>
            </html>
        `;
    }

    /**
     * Clean up resources
     */
    dispose() {
        this.stop();
        this.statusBarItem.dispose();
        if (this.webviewPanel) {
            this.webviewPanel.dispose();
        }
    }
}