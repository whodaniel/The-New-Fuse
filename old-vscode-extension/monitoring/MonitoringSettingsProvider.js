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
exports.MonitoringSettingsProvider = void 0;
const vscode = __importStar(require("vscode"));
/**
 * MonitoringSettingsProvider
 *
 * Provides a webview for managing monitoring settings in VS Code,
 * including toggling monitoring features and configuring Langfuse integration.
 */
class MonitoringSettingsProvider {
    constructor(_context, _monitoringClient, _agentMonitor, _llmMonitor) {
        this._context = _context;
        this._monitoringClient = _monitoringClient;
        this._agentMonitor = _agentMonitor;
        this._llmMonitor = _llmMonitor;
    }
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._context.extensionUri, 'media')
            ]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'toggleMonitoring':
                    this._monitoringClient.setEnabled(message.enabled);
                    break;
                case 'toggleBackendConnection':
                    this._monitoringClient.setBackendEnabled(message.enabled);
                    break;
                case 'setBackendUrl':
                    this._monitoringClient.setBackendEnabled(true, message.url);
                    break;
                case 'toggleAgentMonitoring':
                    this._agentMonitor.setEnabled(message.enabled);
                    break;
                case 'toggleLLMMonitoring':
                    this._llmMonitor.setEnabled(message.enabled);
                    break;
                case 'toggleLangfuse':
                    this.updateLangfuseSettings(message.enabled);
                    break;
                case 'setLangfuseCredentials':
                    this.updateLangfuseCredentials(message.publicKey, message.secretKey, message.host);
                    break;
                case 'clearData':
                    this._monitoringClient.clearAllData();
                    vscode.window.showInformationMessage('Monitoring data cleared');
                    break;
                case 'getSettings':
                    this.sendCurrentSettings();
                    break;
            }
        });
        // Send current settings when view becomes visible
        this.sendCurrentSettings();
    }
    sendCurrentSettings() {
        if (!this._view) {
            return;
        }
        const config = vscode.workspace.getConfiguration('theFuse');
        const enabled = this._monitoringClient.isEnabled();
        const backendEnabled = config.get('connectToBackendMonitoring', false);
        const backendUrl = config.get('monitoringBackendUrl', '');
        const langfuseEnabled = config.get('langfuseEnabled', false);
        const langfusePublicKey = config.get('langfusePublicKey', '');
        const langfuseSecretKey = config.get('langfuseSecretKey', '');
        const langfuseHost = config.get('langfuseHost', 'https://langfuse.com');
        this._view.webview.postMessage({
            command: 'updateSettings',
            settings: {
                nativeEnabled: enabled,
                backendEnabled,
                backendUrl,
                agentEnabled: this._agentMonitor.isEnabled(),
                llmEnabled: this._llmMonitor.isEnabled(),
                langfuseEnabled,
                langfusePublicKey,
                langfuseSecretKey,
                langfuseHost
            }
        });
        // Also send metrics
        const nativeMetrics = this._monitoringClient.getSessionMetrics();
        const agentMetrics = this._agentMonitor.getMetrics();
        const llmMetrics = this._llmMonitor.getSessionMetrics();
        this._view.webview.postMessage({
            command: 'updateMetrics',
            metrics: { nativeMetrics, agentMetrics, llmMetrics }
        });
    }
    async updateLangfuseSettings(enabled) {
        await vscode.workspace.getConfiguration('theFuse').update('langfuseEnabled', enabled, vscode.ConfigurationTarget.Global);
        if (enabled) {
            const publicKey = await vscode.window.showInputBox({
                prompt: 'Enter your Langfuse Public Key',
                placeHolder: 'pk_...'
            });
            if (!publicKey) {
                vscode.window.showWarningMessage('Langfuse Public Key is required');
                await vscode.workspace.getConfiguration('theFuse').update('langfuseEnabled', false, vscode.ConfigurationTarget.Global);
                this.sendCurrentSettings();
                return;
            }
            const secretKey = await vscode.window.showInputBox({
                prompt: 'Enter your Langfuse Secret Key',
                placeHolder: 'sk_...',
                password: true
            });
            if (!secretKey) {
                vscode.window.showWarningMessage('Langfuse Secret Key is required');
                await vscode.workspace.getConfiguration('theFuse').update('langfuseEnabled', false, vscode.ConfigurationTarget.Global);
                this.sendCurrentSettings();
                return;
            }
            const host = await vscode.window.showInputBox({
                prompt: 'Enter your Langfuse Host (optional)',
                placeHolder: 'https://langfuse.com',
                value: 'https://langfuse.com'
            });
            this.updateLangfuseCredentials(publicKey, secretKey, host || 'https://langfuse.com');
        }
        this.sendCurrentSettings();
    }
    async updateLangfuseCredentials(publicKey, secretKey, host) {
        await vscode.workspace.getConfiguration('theFuse').update('langfusePublicKey', publicKey, vscode.ConfigurationTarget.Global);
        await vscode.workspace.getConfiguration('theFuse').update('langfuseSecretKey', secretKey, vscode.ConfigurationTarget.Global);
        await vscode.workspace.getConfiguration('theFuse').update('langfuseHost', host, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage('Langfuse credentials updated');
        this.sendCurrentSettings();
    }
    _getHtmlForWebview(webview) {
        return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>The New Fuse Monitoring Settings</title>
        <style>
            body {
                font-family: var(--vscode-font-family);
                color: var(--vscode-foreground);
                padding: 10px;
            }
            .form-group {
                margin-bottom: 16px;
                display: flex;
                flex-direction: column;
            }
            .form-group label {
                margin-bottom: 8px;
            }
            .input-group {
                display: flex;
                flex-direction: column;
                margin-bottom: 12px;
            }
            input[type="text"], input[type="password"] {
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
                padding: 6px 8px;
                border-radius: 2px;
            }
            button {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 6px 12px;
                border-radius: 2px;
                cursor: pointer;
                margin-right: 8px;
            }
            button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
            .section {
                border-bottom: 1px solid var(--vscode-panel-border);
                padding-bottom: 16px;
                margin-bottom: 16px;
            }
            .checkbox-container {
                display: flex;
                align-items: center;
            }
            .checkbox-container input {
                margin-right: 8px;
            }
            .metrics {
                background-color: var(--vscode-panel-background);
                padding: 12px;
                border-radius: 4px;
                font-family: var(--vscode-editor-font-family);
                font-size: var(--vscode-editor-font-size);
            }
            h3 {
                margin-top: 0;
            }
            .description {
                font-size: 0.9em;
                opacity: 0.8;
                margin-bottom: 12px;
            }
            .info-icon {
                display: inline-block;
                width: 16px;
                height: 16px;
                background-color: var(--vscode-badge-background);
                color: var(--vscode-badge-foreground);
                text-align: center;
                line-height: 16px;
                border-radius: 50%;
                font-size: 12px;
                margin-left: 5px;
                cursor: help;
            }
            .metrics-chart {
                height: 200px;
                width: 100%;
                margin-top: 10px;
                margin-bottom: 20px;
                background-color: var(--vscode-editor-background);
                position: relative;
            }
            .chart-bar {
                position: absolute;
                bottom: 0;
                background-color: var(--vscode-button-background);
                width: 30px;
                border-top-left-radius: 3px;
                border-top-right-radius: 3px;
            }
            .chart-label {
                position: absolute;
                bottom: -20px;
                font-size: 10px;
                text-align: center;
                width: 30px;
            }
            .export-btn {
                margin-top: 10px;
                background-color: var(--vscode-badge-background);
            }
        </style>
    </head>
    <body>
        <h2>The New Fuse Monitoring</h2>
        
        <div class="section">
            <div class="checkbox-container">
                <input type="checkbox" id="enable-native-monitoring" />
                <label for="enable-native-monitoring">Enable Native Fuse Monitoring</label>
                <span class="info-icon" title="Enables local tracking of AI operations without sending data externally">?</span>
            </div>
            <p class="description">
                Track LLM usage, performance, and errors to improve your experience.
                All monitoring data is stored locally by default.
            </p>
        </div>

        <div class="section">
            <h3>Native Monitoring</h3>
            <p class="description">
                The New Fuse's built-in monitoring system tracks LLM operations, 
                generations, and evaluations independently of third-party services.
            </p>
            
            <div class="checkbox-container">
                <input type="checkbox" id="enable-backend" />
                <label for="enable-backend">Connect to The New Fuse Backend</label>
            </div>
            
            <div class="input-group">
                <label for="backend-url">Backend URL</label>
                <input type="text" id="backend-url" placeholder="https://your-fuse-backend.com/monitoring" />
            </div>
            
            <button id="save-backend">Save Backend Settings</button>
        </div>

        <div class="section">
            <div class="checkbox-container">
                <input type="checkbox" id="enable-agent-monitoring" />
                <label for="enable-agent-monitoring">Enable Agent Monitoring</label>
            </div>
            <p class="description">
                Track agent interactions, tool usage, errors, and active agents across all AI agent adapters.
            </p>
        </div>
        <div class="section">
            <div class="checkbox-container">
                <input type="checkbox" id="enable-llm-monitoring" />
                <label for="enable-llm-monitoring">Enable LLM Monitoring</label>
            </div>
            <p class="description">
                Track LLM generation metrics, response times, and error rates separately.
            </p>
        </div>

        <div class="section">
            <h3>Langfuse Integration (Optional)</h3>
            <p class="description">
                Langfuse is a third-party monitoring service for LLMs. 
                This integration is optional and provides additional tracing 
                and evaluation capabilities.
            </p>
            
            <div class="checkbox-container">
                <input type="checkbox" id="enable-langfuse" />
                <label for="enable-langfuse">Enable Langfuse Integration</label>
            </div>
            
            <div id="langfuse-settings" style="display: none;">
                <div class="input-group">
                    <label for="langfuse-public-key">Public Key</label>
                    <input type="text" id="langfuse-public-key" placeholder="pk_..." />
                </div>
                
                <div class="input-group">
                    <label for="langfuse-secret-key">Secret Key</label>
                    <input type="password" id="langfuse-secret-key" placeholder="sk_..." />
                </div>
                
                <div class="input-group">
                    <label for="langfuse-host">Host (Optional)</label>
                    <input type="text" id="langfuse-host" placeholder="https://langfuse.com" />
                </div>
                
                <button id="save-langfuse">Save Langfuse Settings</button>
            </div>
        </div>

        <div class="section">
            <h3>Usage Data</h3>
            <div class="metrics">
                <pre id="metrics-display">Loading metrics...</pre>
            </div>
            
            <h4>Performance Visualization</h4>
            <div class="metrics-chart" id="response-time-chart">
                <!-- Chart will be generated here -->
            </div>
            
            <button id="export-data" class="export-btn">Export Monitoring Data</button>
            <button id="clear-data">Clear Monitoring Data</button>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            
            // Get all the UI elements
            const enableNativeCheckbox = document.getElementById('enable-native-monitoring');
            const enableBackendCheckbox = document.getElementById('enable-backend');
            const backendUrlInput = document.getElementById('backend-url');
            const saveBackendButton = document.getElementById('save-backend');
            const enableAgentCheckbox = document.getElementById('enable-agent-monitoring');
            const enableLLMCheckbox = document.getElementById('enable-llm-monitoring');
            const enableLangfuseCheckbox = document.getElementById('enable-langfuse');
            const langfuseSettingsDiv = document.getElementById('langfuse-settings');
            const langfusePublicKeyInput = document.getElementById('langfuse-public-key');
            const langfuseSecretKeyInput = document.getElementById('langfuse-secret-key');
            const langfuseHostInput = document.getElementById('langfuse-host');
            const saveLangfuseButton = document.getElementById('save-langfuse');
            const clearDataButton = document.getElementById('clear-data');
            const metricsDisplay = document.getElementById('metrics-display');
            const exportDataButton = document.getElementById('export-data');
            const responseTimeChart = document.getElementById('response-time-chart');
            
            // Initialize the UI with current settings and metrics
            vscode.postMessage({ command: 'getSettings' });
            vscode.postMessage({ command: 'getMetrics' });
            
            // Event listeners
            enableNativeCheckbox.addEventListener('change', () => {
                vscode.postMessage({ 
                    command: 'toggleMonitoring', 
                    enabled: enableNativeCheckbox.checked 
                });
            });
            
            enableBackendCheckbox.addEventListener('change', () => {
                vscode.postMessage({ 
                    command: 'toggleBackendConnection', 
                    enabled: enableBackendCheckbox.checked 
                });
            });
            
            saveBackendButton.addEventListener('click', () => {
                vscode.postMessage({ 
                    command: 'setBackendUrl', 
                    url: backendUrlInput.value 
                });
            });
            
            enableLangfuseCheckbox.addEventListener('change', () => {
                vscode.postMessage({ 
                    command: 'toggleLangfuse', 
                    enabled: enableLangfuseCheckbox.checked 
                });
                langfuseSettingsDiv.style.display = enableLangfuseCheckbox.checked ? 'block' : 'none';
            });
            
            saveLangfuseButton.addEventListener('click', () => {
                vscode.postMessage({ 
                    command: 'setLangfuseCredentials', 
                    publicKey: langfusePublicKeyInput.value,
                    secretKey: langfuseSecretKeyInput.value,
                    host: langfuseHostInput.value || 'https://langfuse.com'
                });
            });
            
            clearDataButton.addEventListener('click', () => {
                vscode.postMessage({ command: 'clearData' });
            });
            
            enableAgentCheckbox.addEventListener('change', () => {
                vscode.postMessage({ command: 'toggleAgentMonitoring', enabled: enableAgentCheckbox.checked });
            });
            enableLLMCheckbox.addEventListener('change', () => {
                vscode.postMessage({ command: 'toggleLLMMonitoring', enabled: enableLLMCheckbox.checked });
            });

            // Handle messages from the extension
            window.addEventListener('message', event => {
                const message = event.data;
                
                switch (message.command) {
                    case 'updateSettings':
                        enableNativeCheckbox.checked = message.settings.nativeEnabled;
                        enableBackendCheckbox.checked = message.settings.backendEnabled;
                        backendUrlInput.value = message.settings.backendUrl || '';
                        enableAgentCheckbox.checked = message.settings.agentEnabled;
                        enableLLMCheckbox.checked = message.settings.llmEnabled;
                        langfusePublicKeyInput.value = message.settings.langfusePublicKey || '';
                        langfuseSecretKeyInput.value = message.settings.langfuseSecretKey || '';
                        langfuseHostInput.value = message.settings.langfuseHost || 'https://langfuse.com';
                        
                        langfuseSettingsDiv.style.display = message.settings.langfuseEnabled ? 'block' : 'none';
                        break;
                        
                    case 'updateMetrics':
                        if (message.metrics) {
                            const { nativeMetrics, agentMetrics, llmMetrics } = message.metrics;
                            metricsDisplay.textContent = 
                                \`Native - Generations: \${nativeMetrics.totalGenerations || 0}, Avg RT: \${Math.round(nativeMetrics.avgResponseTime||0)}ms, Errors: \${Math.round((nativeMetrics.errorRate||0)*100)}%\n\`
                                + \`Agent - Tools: \${formatObject(agentMetrics.toolUsage)}, Errors: \${agentMetrics.errorCount}\n\`
                                + \`LLM - Generations: \${llmMetrics.totalGenerations||0}, Avg RT: \${Math.round(llmMetrics.avgResponseTime||0)}ms, Errors: \${Math.round((llmMetrics.errorRate||0)*100)}%\`;
                                
                            // Generate the visualization chart
                            renderResponseTimeChart(responseTimeChart, [
                                { label: "Native", value: nativeMetrics.avgResponseTime || 0 },
                                { label: "LLM", value: llmMetrics.avgResponseTime || 0 }
                            ]);
                        } else {
                            metricsDisplay.textContent = 'No metrics available yet.';
                        }
                    break;

                    case 'exportData':
                        exportDataButton.addEventListener('click', () => {
                            if (!message.metrics) {
                                vscode.window.showInformationMessage('No metrics data available to export');
                                return;
                            }
                            
                            const exportData = {
                                timestamp: new Date().toISOString(),
                                metrics: message.metrics
                            };
                            
                            // Create a download link for the JSON data
                            const dataStr = JSON.stringify(exportData, null, 2);
                            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                            
                            vscode.postMessage({ 
                                command: 'exportData', 
                                dataUri: dataUri,
                                filename: \`fuse-monitoring-\${new Date().toISOString().slice(0,10)}.json\`
                            });
                        });
                        break;
                }
            });
            
            // Helper to format objects for display
            function formatObject(obj) {
                if (!obj) return 'None';
                return Object.entries(obj)
                    .map(([key, value]) => \`\${key}: \${value}\`)
                    .join(', ');
            }
            
            // Helper to render the response time chart
            function renderResponseTimeChart(chartElement, data) {
                // Clear existing chart
                chartElement.innerHTML = '';
                
                // Find the maximum value for scaling
                const maxValue = Math.max(...data.map(item => item.value));
                const scaleFactor = maxValue > 0 ? 180 / maxValue : 1; // Maximum height is 180px
                
                // Create bars
                data.forEach((item, index) => {
                    const barHeight = Math.max(item.value * scaleFactor, 1); // Minimum height of 1px
                    const barElement = document.createElement('div');
                    barElement.className = 'chart-bar';
                    barElement.style.height = \`\${barHeight}px\`;
                    barElement.style.left = \`\${(index * 40) + 20}px\`; // Position bars with spacing
                    barElement.title = \`\${item.label}: \${Math.round(item.value)}ms\`;
                    
                    const labelElement = document.createElement('div');
                    labelElement.className = 'chart-label';
                    labelElement.textContent = item.label;
                    labelElement.style.left = \`\${(index * 40) + 20}px\`;
                    
                    chartElement.appendChild(barElement);
                    chartElement.appendChild(labelElement);
                });
                
                // Add y-axis labels (milliseconds)
                if (maxValue > 0) {
                    const yAxisLabel = document.createElement('div');
                    yAxisLabel.style.position = 'absolute';
                    yAxisLabel.style.left = '0';
                    yAxisLabel.style.top = '0';
                    yAxisLabel.style.fontSize = '10px';
                    yAxisLabel.textContent = \`\${Math.round(maxValue)}ms\`;
                    chartElement.appendChild(yAxisLabel);
                }
            }
        </script>
    </body>
    </html>`;
    }
}
exports.MonitoringSettingsProvider = MonitoringSettingsProvider;
MonitoringSettingsProvider.viewType = 'thefuse.monitoringSettings';
//# sourceMappingURL=MonitoringSettingsProvider.js.map