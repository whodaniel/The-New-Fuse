import * as vscode from 'vscode';
import { LLMMonitoringService } from '../services/LLMMonitoringService';

/**
 * Dashboard Provider for The New Fuse
 * Provides visualization of monitoring data and metrics
 */
export class DashboardProvider {
    public static readonly viewType = 'theNewFuse.dashboard';
    private _hostWebview?: vscode.Webview;
    private _refreshInterval?: NodeJS.Timeout;

    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly monitoringService: LLMMonitoringService
    ) {}

    public setHostWebview(webview: vscode.Webview) {
        this._hostWebview = webview;
        this.sendInitialData();
        
        // Clear any existing interval before setting a new one
        if (this._refreshInterval) {
            clearInterval(this._refreshInterval);
        }
        this._refreshInterval = setInterval(() => {
            // Check if _hostWebview is still valid. 
            // Visibility check is harder here and usually handled by the container.
            if (this._hostWebview) { 
                this.updateMonitoringData();
            }
        }, 5000); // Update every 5 seconds

        // Note: Setting webview.options, webview.html, and webview.onDidReceiveMessage
        // is now handled by TabbedContainerProvider.ts
    }

    public async handleDashboardMessage(message: any): Promise<void> {
        await this.handleWebviewMessage(message);
    }

    // The show() method is removed as TabbedContainerProvider handles visibility.

    /**
     * Handle messages from the webview
     */
    private async handleWebviewMessage(message: any): Promise<void> {
        try {
            switch (message.command) {
                case 'refresh':
                    this.updateMonitoringData();
                    break;
                case 'clearData':
                    if (this.monitoringService) {
                        this.monitoringService.clearAllMonitoringData();
                        this.updateMonitoringData();
                        this.showNotification('Monitoring data cleared');
                    }
                    break;
                case 'toggleMonitoring':
                    if (this.monitoringService) {
                        const currentState = this.monitoringService.isEnabled();
                        this.monitoringService.setEnabled(!currentState);
                        this.showNotification(`LLM Monitoring ${!currentState ? 'Enabled' : 'Disabled'}`);
                        this.updateStatusIndicator(!currentState);
                    }
                    break;
                case 'viewAllTraces':
                    vscode.commands.executeCommand('theNewFuse.monitoring.viewAllTraces').then(undefined, (err: any) => { // Added error handling
                        console.error('Failed to execute viewAllTraces command:', err);
                    });
                    break;
                case 'viewAllGenerations':
                    vscode.commands.executeCommand('theNewFuse.monitoring.viewAllGenerations').then(undefined, (err: any) => { // Added error handling
                        console.error('Failed to execute viewAllGenerations command:', err);
                    });
                    break;
                default:
                    console.log(`Unknown dashboard command received: ${message.command}`);
            }
        } catch (error: any) { // Explicitly type the error parameter
            console.error('Error handling dashboard webview message:', error);
            this.showError(`Error processing request: ${error.message || 'Unknown error'}`);
        }
    }

    /**
     * Send initial monitoring data to the webview
     */
    private sendInitialData(): void {
        try {
            if (!this._hostWebview) {return;}

            // Send monitoring enabled state
            const isMonitoringEnabled = this.monitoringService ? 
                                       this.monitoringService.isEnabled() : false;
            this.updateStatusIndicator(isMonitoringEnabled);

            // Send current metrics
            this.updateMonitoringData();
        } catch (error) {
            console.error('Error sending initial dashboard data:', error);
        }
    }

    /**
     * Update the monitoring data displayed in the dashboard
     */
    private updateMonitoringData(): void {
        try {
            if (!this._hostWebview) {return;} // Visibility check is harder here

            // Get metrics from monitoring service
            const sessionMetrics = this.monitoringService ? 
                                  this.monitoringService.getSessionMetrics() : null;
            
            const generationsData = this.monitoringService ? 
                                   this.monitoringService.getAllGenerations().slice(-100) : [];  // Get last 100 generations
            
            const tracesData = this.monitoringService ? 
                              this.monitoringService.getAllTraces().slice(-100) : [];  // Get last 100 traces

            // Create chart data for generation times
            const generationTimes = generationsData.map(g => ({
                time: new Date(g.startTime).getTime(),
                duration: g.duration,
                model: g.providerInfo.modelName || 'unknown',
                provider: g.providerInfo.name || 'unknown',
                status: g.error ? 'error' : 'success'
            }));

            // Create chart data for model usage
            const modelUsage = sessionMetrics?.modelUsage || {};
            const modelUsageData = Object.keys(modelUsage).map(model => ({
                name: model,
                count: modelUsage[model]
            }));

            // Create chart data for provider usage
            const providerUsage = sessionMetrics?.providerUsage || {};
            const providerUsageData = Object.keys(providerUsage).map(provider => ({
                name: provider,
                count: providerUsage[provider]
            }));

            // Send the data to the webview
            this._hostWebview.postMessage({
                command: 'updateMetrics',
                data: {
                    metrics: sessionMetrics || {
                        totalGenerations: 0,
                        successfulGenerations: 0,
                        failedGenerations: 0,
                        avgResponseTime: 0,
                        errorRate: 0,
                        providerUsage: {},
                        modelUsage: {}
                    },
                    generationTimes,
                    modelUsageData,
                    providerUsageData,
                    generationsCount: generationsData.length,
                    tracesCount: tracesData.length
                }
            });
        } catch (error) {
            console.error('Error updating monitoring data:', error);
        }
    }

    /**
     * Update the monitoring status indicator in the webview
     */
    private updateStatusIndicator(isEnabled: boolean): void {
        if (this._hostWebview) {
            this._hostWebview.postMessage({
                command: 'updateMonitoringStatus',
                isEnabled
            });
        }
    }

    /**
     * Show a notification in the webview
     */
    private showNotification(message: string): void {
        if (this._hostWebview) {
            this._hostWebview.postMessage({
                command: 'showNotification',
                message
            });
        }
    }

    /**
     * Show an error message in the webview
     */
    private showError(errorMessage: string): void {
        if (this._hostWebview) {
            this._hostWebview.postMessage({
                command: 'showError',
                error: errorMessage
            });
        }
    }

    /**
     * Generate HTML for the webview
     */
    public getHtmlBodySnippet(webview: vscode.Webview, nonce: string): string {
        // Create URI for scripts and styles
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'media', 'dashboard.js')
        );

        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'media', 'styles.css')
        );

        const codiconsUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'node_modules', '@vscode/codicons', 'dist', 'codicon.css')
        );

        // Use Chart.js from CDN for data visualization
        const chartjsUri = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';

        return `
            <link href="${styleUri}" rel="stylesheet">
            <link href="${codiconsUri}" rel="stylesheet">
            <style nonce="${nonce}">
                /* Ensure CSP from TabbedContainerProvider allows cdn.jsdelivr.net for script-src and connect-src if Chart.js is loaded from CDN */
                /* These styles are specific to the dashboard content */
                .dashboard {
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                    padding: 10px;
                    box-sizing: border-box;
                }
                
                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                }
                
                .status-indicator {
                    display: inline-flex;
                    align-items: center;
                    font-size: 0.9em;
                    padding: 4px 8px;
                    border-radius: 4px;
                }
                
                .status-indicator.enabled {
                    background-color: var(--vscode-debugIcon-startForeground);
                    color: white;
                }
                
                .status-indicator.disabled {
                    background-color: var(--vscode-debugIcon-stopForeground);
                    color: white;
                }
                
                .status-indicator .codicon {
                    margin-right: 5px;
                }
                
                .metrics-cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 10px;
                    margin-bottom: 15px;
                }
                
                .metric-card {
                    background-color: var(--vscode-editor-inactiveSelectionBackground);
                    border-radius: 4px;
                    padding: 12px;
                    text-align: center;
                }
                
                .metric-value {
                    font-size: 24px;
                    font-weight: bold;
                    margin: 8px 0;
                }
                
                .metric-title {
                    font-size: 12px;
                    opacity: 0.8;
                }
                
                .charts-container {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 15px;
                    margin-bottom: 15px;
                }
                
                .chart-container {
                    background-color: var(--vscode-editor-inactiveSelectionBackground);
                    border-radius: 4px;
                    padding: 15px;
                }
                
                .chart-title {
                    font-size: 14px;
                    margin-bottom: 10px;
                    text-align: center;
                }
                
                .actions {
                    display: flex;
                    gap: 10px;
                    justify-content: space-between;
                    margin-top: 15px;
                }
                
                .action-group {
                    display: flex;
                    gap: 10px;
                }
                
                .notifications {
                    position: fixed;
                    bottom: 15px;
                    right: 15px;
                    max-width: 300px;
                }
                
                .notification {
                    background-color: var(--vscode-editorInfo-background);
                    color: var(--vscode-editorInfo-foreground);
                    padding: 10px 15px;
                    margin-top: 5px;
                    border-radius: 4px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    animation: fadeIn 0.3s, fadeOut 0.3s 2.7s;
                    opacity: 0;
                    animation-fill-mode: forwards;
                }
                
                .notification.error {
                    background-color: var(--vscode-editorError-background);
                    color: var(--vscode-editorError-foreground);
                }
                
                .close-notification {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 0;
                    margin-left: 10px;
                    color: inherit;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes fadeOut {
                    from { opacity: 1; transform: translateY(0); }
                    to { opacity: 0; transform: translateY(-20px); }
                }
                
                .canvas-container {
                    position: relative;
                    height: 200px;
                }
                
                .no-data {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    text-align: center;
                    color: var(--vscode-disabledForeground);
                }
            </style>

            <div class="dashboard-header">
                <h2><i class="codicon codicon-dashboard"></i> Monitoring Dashboard</h2>
                <div class="status-indicator">
                    <i class="codicon"></i>
                    <span class="status-text">Checking...</span>
                </div>
            </div>
            
            <div class="metrics-cards">
                <div class="metric-card">
                    <div class="metric-title">Total Generations</div>
                    <div class="metric-value" id="total-generations">0</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Success Rate</div>
                    <div class="metric-value" id="success-rate">0%</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Avg Response Time</div>
                    <div class="metric-value" id="avg-response-time">0ms</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Error Rate</div>
                    <div class="metric-value" id="error-rate">0%</div>
                </div>
            </div>
            
            <div class="charts-container">
                <div class="chart-container">
                    <div class="chart-title">Response Times</div>
                    <div class="canvas-container">
                        <canvas id="response-times-chart"></canvas>
                        <div class="no-data" id="response-times-no-data">No data available</div>
                    </div>
                </div>
                <div class="chart-container">
                    <div class="chart-title">Model Usage</div>
                    <div class="canvas-container">
                        <canvas id="model-usage-chart"></canvas>
                        <div class="no-data" id="model-usage-no-data">No data available</div>
                    </div>
                </div>
            </div>
            
            <div class="charts-container">
                <div class="chart-container">
                    <div class="chart-title">Provider Usage</div>
                    <div class="canvas-container">
                        <canvas id="provider-usage-chart"></canvas>
                        <div class="no-data" id="provider-usage-no-data">No data available</div>
                    </div>
                </div>
            </div>
            
            <div class="actions">
                <div class="action-group">
                    <button id="refresh-button" title="Refresh Dashboard">
                        <i class="codicon codicon-refresh"></i> Refresh
                    </button>
                    <button id="toggle-monitoring-button" title="Toggle Monitoring">
                        <i class="codicon codicon-circle-filled"></i> <span>Toggle Monitoring</span>
                    </button>
                </div>
                <div class="action-group">
                    <button id="view-traces-button" title="View All Traces">
                        <i class="codicon codicon-list-ordered"></i> View Traces
                    </button>
                    <button id="view-generations-button" title="View All Generations">
                        <i class="codicon codicon-symbol-function"></i> View Generations
                    </button>
                    <button id="clear-data-button" title="Clear All Data" class="warning">
                        <i class="codicon codicon-clear-all"></i> Clear Data
                    </button>
                </div>
            </div>
            
            <div class="notifications" id="notifications"></div>
            
            <!-- Load Chart.js from CDN -->
            <script nonce="${nonce}" src="${chartjsUri}"></script>
            <script nonce="${nonce}" src="${scriptUri}"></script>
        `;
    }

    public dispose() {
        if (this._refreshInterval) {
            clearInterval(this._refreshInterval);
            this._refreshInterval = undefined;
        }
        this._hostWebview = undefined;
        console.log('DashboardProvider disposed');
    }
}
