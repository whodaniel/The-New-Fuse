"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentActivityDashboardProvider = void 0;
const vscode = __importStar(require("vscode"));
const AgentMonitor_1 = require("./AgentMonitor");
/**
 * Provides a dashboard webview to display agent activity and metrics
 */
class AgentActivityDashboardProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
        this.refreshInterval = null;
        this.agentMonitor = AgentMonitor_1.AgentMonitor.getInstance();
    }
    /**
     * Called when the view is initially created
     */
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        // Set webview options
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        // Set initial HTML content
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.command) {
                case 'refresh':
                    this.refreshDashboard();
                    break;
                case 'toggleMonitoring':
                    this.agentMonitor.setEnabled(data.enabled);
                    this.refreshDashboard();
                    break;
                case 'setBackendSettings':
                    this.agentMonitor.setBackendSettings(data.enabled, data.url);
                    this.refreshDashboard();
                    break;
            }
        });
        // Set up refresh interval
        this.refreshInterval = setInterval(() => {
            if (this._view?.visible) {
                this.refreshDashboard();
            }
        }, 5000); // Refresh every 5 seconds when visible
        // Initial refresh
        this.refreshDashboard();
    }
    /**
     * Update the webview with current metrics
     */
    refreshDashboard() {
        if (!this._view)
            return;
        const metrics = this.agentMonitor.getMetrics();
        // Get detailed tool metrics
        const toolsData = Array.from(metrics.toolUsage.entries()).map(([key, count]) => {
            const [agentId, toolId] = key.split(':');
            const successRate = this.agentMonitor.getToolSuccessRate(toolId);
            const avgResponseTime = this.agentMonitor.getToolAverageResponseTime(toolId);
            return {
                agentId,
                toolId,
                count,
                successRate: successRate.rate,
                successCount: successRate.success,
                failureCount: successRate.failure,
                avgResponseTime
            };
        });
        // Sort tools by usage count
        toolsData.sort((a, b) => b.count - a.count);
        // Get recent tool usage
        const recentTools = this.agentMonitor.getRecentToolUsage(20);
        // Build the dashboard data
        const dashboardData = {
            enabled: this.agentMonitor.isEnabled(),
            backendEnabled: this.agentMonitor.backendEnabled || false,
            backendUrl: this.agentMonitor.backendUrl || '',
            agentCount: metrics.activeAgents.length,
            agents: metrics.activeAgents,
            totalToolUsage: Array.from(metrics.toolUsage.values()).reduce((sum, count) => sum + count, 0),
            errorCount: metrics.errorCount,
            avgResponseTime: metrics.responseTime.length > 0
                ? metrics.responseTime.reduce((sum, time) => sum + time, 0) / metrics.responseTime.length
                : 0,
            tools: toolsData,
            recentTools: recentTools,
            activeToolExecutions: Array.from(metrics.activeToolExecutions.entries()).map(([id, data]) => ({
                id,
                toolId: data.toolId,
                elapsedMs: Date.now() - data.startTime
            }))
        };
        // Send to webview
        this._view.webview.postMessage({
            command: 'updateDashboard',
            data: dashboardData
        });
    }
    /**
     * Generate the HTML for the webview
     */
    _getHtmlForWebview(webview) {
        // Get resources
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'agentActivityDashboard.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'agentActivityDashboard.css'));
        const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'node_modules', '@vscode/codicons', 'dist', 'codicon.css'));
        // Use a nonce to only allow a specific script to be run
        const nonce = getNonce();
        return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};">
      <link href="${styleUri}" rel="stylesheet">
      <link href="${codiconsUri}" rel="stylesheet">
      <title>Agent Activity Dashboard</title>
    </head>
    <body>
      <header>
        <h1>Agent Activity Dashboard</h1>
        <div class="monitoring-toggle">
          <label class="switch">
            <input type="checkbox" id="monitoring-toggle" checked>
            <span class="slider round"></span>
          </label>
          <span>Monitoring Enabled</span>
        </div>
      </header>
      
      <section class="metrics-summary">
        <div class="card">
          <div class="card-title">Active Agents</div>
          <div class="card-value" id="active-agents">0</div>
        </div>
        <div class="card">
          <div class="card-title">Tool Usages</div>
          <div class="card-value" id="tool-usages">0</div>
        </div>
        <div class="card">
          <div class="card-title">Errors</div>
          <div class="card-value" id="error-count">0</div>
        </div>
        <div class="card">
          <div class="card-title">Avg Response</div>
          <div class="card-value" id="avg-response">0 ms</div>
        </div>
      </section>
      
      <section class="active-agents">
        <h2>Active Agents</h2>
        <div id="agents-list" class="agents-container">
          <div class="no-data">No active agents</div>
        </div>
      </section>
      
      <section class="active-tools">
        <h2>Active Tool Executions</h2>
        <div id="active-tools-list" class="tools-container">
          <div class="no-data">No active tool executions</div>
        </div>
      </section>
      
      <section class="recent-tools">
        <h2>Recent Tool Usage</h2>
        <div id="recent-tools-list" class="recent-tools-container">
          <div class="no-data">No recent tool usage</div>
        </div>
      </section>
      
      <section class="tool-metrics">
        <h2>Tool Usage Metrics</h2>
        <div id="tool-metrics-list" class="tools-metrics-container">
          <div class="no-data">No tool metrics available</div>
        </div>
      </section>
      
      <section class="backend-settings">
        <h2>Telemetry Backend</h2>
        <div class="form-row">
          <div class="form-control">
            <label class="switch">
              <input type="checkbox" id="backend-toggle">
              <span class="slider round"></span>
            </label>
            <span>Enable Backend</span>
          </div>
        </div>
        <div class="form-row">
          <div class="form-control">
            <label for="backend-url">Backend URL:</label>
            <input type="text" id="backend-url" placeholder="http://localhost:3000/api/telemetry">
          </div>
        </div>
        <div class="form-row">
          <button id="save-backend-settings">Save Settings</button>
        </div>
      </section>
      
      <footer>
        <button id="refresh-button">
          <i class="codicon codicon-refresh"></i>
          Refresh
        </button>
      </footer>
      
      <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
    </html>`;
    }
    /**
     * Clean up resources when the extension is deactivated
     */
    dispose() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
}
exports.AgentActivityDashboardProvider = AgentActivityDashboardProvider;
AgentActivityDashboardProvider.viewType = 'thefuse.agentActivityDashboard';
/**
 * Generate a nonce string
 */
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//# sourceMappingURL=AgentActivityDashboardProvider.js.map