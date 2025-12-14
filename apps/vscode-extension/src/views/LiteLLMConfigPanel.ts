import * as vscode from 'vscode';
import * as path from 'path';

export class LiteLLMConfigPanel {
    public static currentPanel: LiteLLMConfigPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._panel.webview.html = this._getWebviewContent();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._setupWebviewMessageListener();
    }

    public static render(extensionUri: vscode.Uri) {
        if (LiteLLMConfigPanel.currentPanel) {
            LiteLLMConfigPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
        } else {
            const panel = vscode.window.createWebviewPanel(
                'litellmConfig',
                '🚀 Enhanced LiteLLM Configuration',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    localResourceRoots: [extensionUri]
                }
            );

            LiteLLMConfigPanel.currentPanel = new LiteLLMConfigPanel(panel, extensionUri);
        }
    }

    private _setupWebviewMessageListener() {
        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'testConnection':
                        await this._handleTestConnection(message.config);
                        break;
                    case 'saveConfig':
                        await this._handleSaveConfig(message.config);
                        break;
                    case 'resetBudget':
                        await this._handleResetBudget();
                        break;
                    case 'getHealth':
                        await this._handleGetHealth();
                        break;
                    case 'getMetrics':
                        await this._handleGetMetrics();
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    private async _handleTestConnection(config: any) {
        try {
            const response = await fetch(`${config.baseURL}/health`);
            const result = await response.json();

            this._panel.webview.postMessage({
                command: 'connectionTestResult',
                success: true,
                data: result
            });

            vscode.window.showInformationMessage('✅ LiteLLM connection successful!');
        } catch (error) {
            this._panel.webview.postMessage({
                command: 'connectionTestResult',
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });

            vscode.window.showErrorMessage(`❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async _handleSaveConfig(config: any) {
        const configuration = vscode.workspace.getConfiguration('tnf.litellm');

        try {
            await configuration.update('baseURL', config.baseURL, vscode.ConfigurationTarget.Global);
            await configuration.update('model', config.model, vscode.ConfigurationTarget.Global);
            await configuration.update('maxRetries', config.maxRetries, vscode.ConfigurationTarget.Global);
            await configuration.update('enableCache', config.enableCache, vscode.ConfigurationTarget.Global);
            await configuration.update('cacheType', config.cacheType, vscode.ConfigurationTarget.Global);
            await configuration.update('enableBudget', config.enableBudget, vscode.ConfigurationTarget.Global);
            await configuration.update('budgetLimit', config.budgetLimit, vscode.ConfigurationTarget.Global);
            await configuration.update('enableFallback', config.enableFallback, vscode.ConfigurationTarget.Global);
            await configuration.update('circuitBreakerThreshold', config.circuitBreakerThreshold, vscode.ConfigurationTarget.Global);

            vscode.window.showInformationMessage('✅ LiteLLM configuration saved successfully!');

            this._panel.webview.postMessage({
                command: 'configSaved',
                success: true
            });
        } catch (error) {
            vscode.window.showErrorMessage(`❌ Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);

            this._panel.webview.postMessage({
                command: 'configSaved',
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    private async _handleResetBudget() {
        vscode.window.showInformationMessage('Budget reset successfully (this would reset the actual budget in production)');

        this._panel.webview.postMessage({
            command: 'budgetReset',
            success: true
        });
    }

    private async _handleGetHealth() {
        const config = vscode.workspace.getConfiguration('tnf.litellm');
        const baseURL = config.get<string>('baseURL') || 'http://localhost:4000';

        try {
            const response = await fetch(`${baseURL}/health`);
            const data = await response.json();

            this._panel.webview.postMessage({
                command: 'healthStatus',
                healthy: true,
                data
            });
        } catch (error) {
            this._panel.webview.postMessage({
                command: 'healthStatus',
                healthy: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    private async _handleGetMetrics() {
        // In production, this would fetch real metrics from the provider
        this._panel.webview.postMessage({
            command: 'metricsUpdate',
            metrics: {
                budgetSpent: 0.00,
                budgetRemaining: 100.00,
                apiCalls: 0,
                cacheHitRate: 0
            }
        });
    }

    private _getWebviewContent(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enhanced LiteLLM Configuration</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        .header {
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .section {
            margin-bottom: 30px;
            padding: 20px;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 6px;
            border: 1px solid var(--vscode-panel-border);
        }
        .section h2 {
            margin-top: 0;
            margin-bottom: 20px;
            color: var(--vscode-foreground);
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 10px;
            font-size: 18px;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            font-size: 13px;
        }
        input, select {
            width: 100%;
            padding: 8px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            font-size: 13px;
        }
        input:focus, select:focus {
            outline: 1px solid var(--vscode-focusBorder);
        }
        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .checkbox-group input {
            width: auto;
        }
        button {
            padding: 10px 20px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 10px;
            font-size: 13px;
            font-weight: 500;
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .metric-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .metric-card {
            padding: 15px;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
        }
        .metric-label {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 8px;
        }
        .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: var(--vscode-foreground);
        }
        .status-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status-healthy { background-color: #4caf50; }
        .status-warning { background-color: #ff9800; }
        .status-error { background-color: #f44336; }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            border-radius: 3px;
            font-size: 11px;
            font-weight: 600;
            margin-left: 8px;
        }
        .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .info-box {
            padding: 12px;
            background-color: var(--vscode-textCodeBlock-background);
            border-left: 3px solid var(--vscode-focusBorder);
            border-radius: 4px;
            margin-top: 15px;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Enhanced LiteLLM Configuration</h1>
        <p style="color: var(--vscode-descriptionForeground); margin-top: 8px;">
            Configure your LLM provider with enterprise-grade features
        </p>
    </div>

    <!-- Basic Configuration -->
    <div class="section">
        <h2>🔧 Basic Configuration</h2>
        <div class="grid-2">
            <div class="form-group">
                <label for="baseURL">Base URL</label>
                <input type="text" id="baseURL" value="http://localhost:4000" placeholder="http://localhost:4000">
            </div>
            <div class="form-group">
                <label for="model">Model</label>
                <select id="model">
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo" selected>GPT-3.5 Turbo</option>
                    <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                    <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                    <option value="gemini-pro">Gemini Pro</option>
                </select>
            </div>
        </div>
        <div class="form-group">
            <label for="apiKey">API Key (Optional)</label>
            <input type="password" id="apiKey" placeholder="sk-...">
        </div>
    </div>

    <!-- Reliability Features -->
    <div class="section">
        <h2>⚡ Reliability & Performance</h2>
        <div class="grid-2">
            <div class="form-group">
                <label for="maxRetries">Max Retries</label>
                <input type="number" id="maxRetries" value="3" min="0" max="10">
            </div>
            <div class="form-group">
                <label for="circuitBreakerThreshold">Circuit Breaker Threshold</label>
                <input type="number" id="circuitBreakerThreshold" value="5" min="1" max="20">
            </div>
        </div>
        <div class="form-group checkbox-group">
            <input type="checkbox" id="enableCache" checked>
            <label for="enableCache" style="margin-bottom: 0;">Enable Caching</label>
        </div>
        <div class="form-group">
            <label for="cacheType">Cache Type</label>
            <select id="cacheType">
                <option value="memory" selected>Memory</option>
                <option value="redis">Redis</option>
            </select>
        </div>
        <div class="form-group checkbox-group">
            <input type="checkbox" id="enableFallback" checked>
            <label for="enableFallback" style="margin-bottom: 0;">Enable Fallback</label>
        </div>
    </div>

    <!-- Budget & Cost Management -->
    <div class="section">
        <h2>💰 Budget & Cost Management</h2>
        <div class="form-group checkbox-group">
            <input type="checkbox" id="enableBudget">
            <label for="enableBudget" style="margin-bottom: 0;">Enable Budget Tracking</label>
        </div>
        <div class="form-group">
            <label for="budgetLimit">Budget Limit (USD)</label>
            <input type="number" id="budgetLimit" value="100" step="0.01" min="0">
        </div>

        <div class="metric-grid" style="margin-top: 20px;">
            <div class="metric-card">
                <div class="metric-label">Budget Spent</div>
                <div class="metric-value" id="budgetSpent">$0.00</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Budget Remaining</div>
                <div class="metric-value" id="budgetRemaining">$100.00</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">API Calls</div>
                <div class="metric-value" id="apiCalls">0</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Cache Hit Rate</div>
                <div class="metric-value" id="cacheHitRate">0%</div>
            </div>
        </div>
    </div>

    <!-- Health & Status -->
    <div class="section">
        <h2>🏥 Health & Status</h2>
        <div style="margin-bottom: 15px;">
            <span class="status-indicator status-healthy" id="statusIndicator"></span>
            <span id="statusText">Checking...</span>
            <span class="badge" id="statusBadge">Initializing</span>
        </div>
        <button onclick="checkHealth()">🔄 Refresh Health Status</button>
    </div>

    <!-- Actions -->
    <div class="section">
        <h2>⚙️ Actions</h2>
        <div style="margin-bottom: 15px;">
            <button onclick="testConnection()">🔍 Test Connection</button>
            <button onclick="saveConfiguration()">💾 Save Configuration</button>
            <button onclick="resetBudget()">🔄 Reset Budget</button>
        </div>

        <div class="info-box">
            <strong>💡 Tip:</strong> Use "Test Connection" to verify your LiteLLM proxy is running before saving configuration.
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        // Load saved configuration
        window.addEventListener('DOMContentLoaded', () => {
            // Load from state if available
            const state = vscode.getState() || {};

            if (state.baseURL) document.getElementById('baseURL').value = state.baseURL;
            if (state.model) document.getElementById('model').value = state.model;
            if (state.maxRetries) document.getElementById('maxRetries').value = state.maxRetries;
            if (state.circuitBreakerThreshold) document.getElementById('circuitBreakerThreshold').value = state.circuitBreakerThreshold;
            if (state.cacheType) document.getElementById('cacheType').value = state.cacheType;

            // Initial health check
            setTimeout(checkHealth, 1000);
            // Periodic metrics update
            setInterval(updateMetrics, 10000);
        });

        function getConfig() {
            return {
                baseURL: document.getElementById('baseURL').value,
                model: document.getElementById('model').value,
                apiKey: document.getElementById('apiKey').value,
                maxRetries: parseInt(document.getElementById('maxRetries').value),
                circuitBreakerThreshold: parseInt(document.getElementById('circuitBreakerThreshold').value),
                enableCache: document.getElementById('enableCache').checked,
                cacheType: document.getElementById('cacheType').value,
                enableFallback: document.getElementById('enableFallback').checked,
                enableBudget: document.getElementById('enableBudget').checked,
                budgetLimit: parseFloat(document.getElementById('budgetLimit').value)
            };
        }

        function testConnection() {
            const config = getConfig();
            vscode.postMessage({
                command: 'testConnection',
                config
            });
        }

        function saveConfiguration() {
            const config = getConfig();
            vscode.setState(config);
            vscode.postMessage({
                command: 'saveConfig',
                config
            });
        }

        function resetBudget() {
            vscode.postMessage({
                command: 'resetBudget'
            });
        }

        function checkHealth() {
            vscode.postMessage({
                command: 'getHealth'
            });
        }

        function updateMetrics() {
            vscode.postMessage({
                command: 'getMetrics'
            });
        }

        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;

            switch (message.command) {
                case 'connectionTestResult':
                    // Already handled by extension notification
                    break;

                case 'healthStatus':
                    const indicator = document.getElementById('statusIndicator');
                    const statusText = document.getElementById('statusText');
                    const statusBadge = document.getElementById('statusBadge');

                    if (message.healthy) {
                        indicator.className = 'status-indicator status-healthy';
                        statusText.textContent = 'Healthy';
                        statusBadge.textContent = 'Online';
                        statusBadge.style.backgroundColor = '#4caf50';
                    } else {
                        indicator.className = 'status-indicator status-error';
                        statusText.textContent = 'Unhealthy';
                        statusBadge.textContent = 'Offline';
                        statusBadge.style.backgroundColor = '#f44336';
                    }
                    break;

                case 'metricsUpdate':
                    const metrics = message.metrics;
                    document.getElementById('budgetSpent').textContent =
                        '$' + metrics.budgetSpent.toFixed(2);
                    document.getElementById('budgetRemaining').textContent =
                        '$' + metrics.budgetRemaining.toFixed(2);
                    document.getElementById('apiCalls').textContent = metrics.apiCalls;
                    document.getElementById('cacheHitRate').textContent =
                        metrics.cacheHitRate + '%';
                    break;

                case 'budgetReset':
                    document.getElementById('budgetSpent').textContent = '$0.00';
                    document.getElementById('budgetRemaining').textContent = '$100.00';
                    document.getElementById('apiCalls').textContent = '0';
                    break;
            }
        });
    </script>
</body>
</html>`;
    }

    public dispose() {
        LiteLLMConfigPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
