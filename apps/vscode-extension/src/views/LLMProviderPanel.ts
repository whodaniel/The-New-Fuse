/**
 * LLM Provider Configuration Panel
 *
 * Comprehensive UI for managing LLM providers:
 * - Provider selection (OpenAI, Anthropic, Cohere, Google, LiteLLM, Ollama)
 * - API key management with secure storage
 * - Model selection per provider
 * - Connection testing
 * - Health monitoring
 * - Provider switching
 *
 * Based on LiteLLM documentation:
 * - Direct provider keys (OpenAI, Anthropic, etc.) go to provider APIs
 * - LiteLLM proxy key (if using deployed proxy) goes to proxy
 * - Local models (Ollama) require no keys
 */

import * as vscode from 'vscode';
import { LLMProviderConfig, LLMProviderManager } from '../ai/LLMProviderManager';

export class LLMProviderPanel {
  public static currentPanel: LLMProviderPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private providerManager: LLMProviderManager;

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    providerManager: LLMProviderManager
  ) {
    this._panel = panel;
    this.providerManager = providerManager;
    this._panel.webview.html = this._getWebviewContent();
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._setupWebviewMessageListener();

    // Listen to provider manager events
    this.providerManager.on('providerUpdated', () => this._sendProvidersUpdate());
    this.providerManager.on('providerChanged', () => this._sendProvidersUpdate());
    this.providerManager.on('providerTested', () => this._sendStatusUpdate());
  }

  public static render(extensionUri: vscode.Uri, providerManager: LLMProviderManager): void {
    if (LLMProviderPanel.currentPanel) {
      LLMProviderPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
    } else {
      const panel = vscode.window.createWebviewPanel(
        'llmProviderConfig',
        '🤖 LLM Provider Configuration',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [extensionUri],
        }
      );

      LLMProviderPanel.currentPanel = new LLMProviderPanel(panel, extensionUri, providerManager);
    }
  }

  private _setupWebviewMessageListener(): void {
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'getProviders':
            await this._handleGetProviders();
            break;
          case 'setActiveProvider':
            await this._handleSetActiveProvider(message.provider);
            break;
          case 'updateProvider':
            await this._handleUpdateProvider(message.provider, message.config);
            break;
          case 'testProvider':
            await this._handleTestProvider(message.provider);
            break;
          case 'testAllProviders':
            await this._handleTestAllProviders();
            break;
          case 'resetToDefaults':
            await this._handleResetToDefaults();
            break;
          case 'clearAPIKeys':
            await this._handleClearAPIKeys();
            break;
        }
      },
      null,
      this._disposables
    );
  }

  private async _handleGetProviders(): Promise<void> {
    const providers = this.providerManager.getProviders();
    const activeProvider = this.providerManager.getActiveProvider();
    const statuses = this.providerManager.getAllStatuses();

    this._panel.webview.postMessage({
      command: 'providersData',
      providers: providers.map((p) => ({
        ...p,
        apiKey: p.apiKey ? '***' : undefined, // Mask API keys
        proxyAPIKey: p.proxyAPIKey ? '***' : undefined,
      })),
      activeProvider: activeProvider?.provider,
      statuses: Array.from(statuses.entries()).map(([provider, status]) => ({
        ...status,
        provider,
      })),
    });
  }

  private async _handleSetActiveProvider(provider: string): Promise<void> {
    try {
      await this.providerManager.setActiveProvider(provider);
      vscode.window.showInformationMessage(`✅ Switched to ${provider}`);
      await this._sendProvidersUpdate();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`❌ Failed to switch provider: ${message}`);
      this._panel.webview.postMessage({
        command: 'error',
        message,
      });
    }
  }

  private async _handleUpdateProvider(
    provider: string,
    config: Partial<LLMProviderConfig>
  ): Promise<void> {
    try {
      await this.providerManager.updateProvider(provider, config);
      vscode.window.showInformationMessage(`✅ Updated ${provider} configuration`);
      await this._sendProvidersUpdate();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`❌ Failed to update provider: ${message}`);
      this._panel.webview.postMessage({
        command: 'error',
        message,
      });
    }
  }

  private async _handleTestProvider(provider: string): Promise<void> {
    try {
      const status = await this.providerManager.testProvider(provider);
      this._panel.webview.postMessage({
        command: 'providerTested',
        provider,
        status,
      });

      if (status.healthy) {
        vscode.window.showInformationMessage(
          `✅ ${provider} is healthy${status.models ? ` - ${status.models.length} models available` : ''}`
        );
      } else {
        vscode.window.showWarningMessage(
          `⚠️ ${provider} health check failed: ${status.error || 'Unknown error'}`
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`❌ Test failed: ${message}`);
    }
  }

  private async _handleTestAllProviders(): Promise<void> {
    try {
      vscode.window.showInformationMessage('🔍 Testing all enabled providers...');
      await this.providerManager.checkAllProviders();
      await this._sendStatusUpdate();
      vscode.window.showInformationMessage('✅ Provider health checks complete');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`❌ Health check failed: ${message}`);
    }
  }

  private async _handleResetToDefaults(): Promise<void> {
    const confirm = await vscode.window.showWarningMessage(
      '⚠️ Reset to default configuration? This will clear all API keys.',
      { modal: true },
      'Reset',
      'Cancel'
    );

    if (confirm === 'Reset') {
      try {
        await this.providerManager.resetToDefaults();
        vscode.window.showInformationMessage('✅ Reset to default configuration');
        await this._sendProvidersUpdate();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`❌ Reset failed: ${message}`);
      }
    }
  }

  private async _handleClearAPIKeys(): Promise<void> {
    const confirm = await vscode.window.showWarningMessage(
      '⚠️ Clear all API keys? You will need to re-enter them.',
      { modal: true },
      'Clear',
      'Cancel'
    );

    if (confirm === 'Clear') {
      try {
        await this.providerManager.clearAllAPIKeys();
        vscode.window.showInformationMessage('✅ All API keys cleared');
        await this._sendProvidersUpdate();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`❌ Failed to clear keys: ${message}`);
      }
    }
  }

  private async _sendProvidersUpdate(): Promise<void> {
    await this._handleGetProviders();
  }

  private async _sendStatusUpdate(): Promise<void> {
    const statuses = this.providerManager.getAllStatuses();
    this._panel.webview.postMessage({
      command: 'statusUpdate',
      statuses: Array.from(statuses.entries()).map(([provider, status]) => ({
        ...status,
        provider,
      })),
    });
  }

  private _getWebviewContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>LLM Provider Configuration</title>
	<style>
		* {
			box-sizing: border-box;
			margin: 0;
			padding: 0;
		}

		body {
			font-family: var(--vscode-font-family);
			padding: 20px;
			color: var(--vscode-foreground);
			background-color: var(--vscode-editor-background);
			line-height: 1.6;
		}

		.header {
			margin-bottom: 30px;
			padding-bottom: 20px;
			border-bottom: 2px solid var(--vscode-panel-border);
		}

		.header h1 {
			font-size: 28px;
			margin-bottom: 10px;
			display: flex;
			align-items: center;
			gap: 10px;
		}

		.header p {
			color: var(--vscode-descriptionForeground);
			font-size: 14px;
		}

		.info-banner {
			background-color: var(--vscode-textCodeBlock-background);
			border-left: 4px solid var(--vscode-focusBorder);
			padding: 15px;
			margin-bottom: 30px;
			border-radius: 4px;
		}

		.info-banner strong {
			display: block;
			margin-bottom: 8px;
			color: var(--vscode-foreground);
		}

		.info-banner ul {
			margin-left: 20px;
			color: var(--vscode-descriptionForeground);
			font-size: 13px;
		}

		.info-banner li {
			margin: 5px 0;
		}

		.actions-bar {
			display: flex;
			gap: 10px;
			margin-bottom: 30px;
			flex-wrap: wrap;
		}

		button {
			padding: 10px 20px;
			background-color: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			border: none;
			border-radius: 4px;
			cursor: pointer;
			font-size: 13px;
			font-weight: 500;
			transition: background-color 0.2s;
		}

		button:hover {
			background-color: var(--vscode-button-hoverBackground);
		}

		button.secondary {
			background-color: var(--vscode-button-secondaryBackground);
			color: var(--vscode-button-secondaryForeground);
		}

		button.secondary:hover {
			background-color: var(--vscode-button-secondaryHoverBackground);
		}

		button.danger {
			background-color: #f44336;
			color: white;
		}

		button.danger:hover {
			background-color: #d32f2f;
		}

		button:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		.providers-grid {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
			gap: 20px;
			margin-bottom: 30px;
		}

		.provider-card {
			background-color: var(--vscode-editor-inactiveSelectionBackground);
			border: 2px solid var(--vscode-panel-border);
			border-radius: 8px;
			padding: 20px;
			transition: all 0.3s;
		}

		.provider-card.active {
			border-color: var(--vscode-focusBorder);
			box-shadow: 0 0 0 2px var(--vscode-focusBorder);
		}

		.provider-card.enabled:not(.active) {
			border-color: var(--vscode-charts-green);
		}

		.provider-header {
			display: flex;
			justify-content: space-between;
			align-items: start;
			margin-bottom: 15px;
		}

		.provider-title {
			display: flex;
			align-items: center;
			gap: 10px;
		}

		.provider-title h3 {
			font-size: 18px;
			margin: 0;
		}

		.status-indicator {
			width: 10px;
			height: 10px;
			border-radius: 50%;
			display: inline-block;
		}

		.status-healthy { background-color: #4caf50; }
		.status-warning { background-color: #ff9800; }
		.status-error { background-color: #f44336; }
		.status-unknown { background-color: #757575; }

		.badge {
			display: inline-block;
			padding: 4px 8px;
			background-color: var(--vscode-badge-background);
			color: var(--vscode-badge-foreground);
			border-radius: 3px;
			font-size: 11px;
			font-weight: 600;
		}

		.badge.active {
			background-color: var(--vscode-focusBorder);
			color: white;
		}

		.form-group {
			margin-bottom: 15px;
		}

		.form-group label {
			display: block;
			margin-bottom: 5px;
			font-weight: 600;
			font-size: 13px;
			color: var(--vscode-foreground);
		}

		.form-group input,
		.form-group select {
			width: 100%;
			padding: 8px;
			background-color: var(--vscode-input-background);
			color: var(--vscode-input-foreground);
			border: 1px solid var(--vscode-input-border);
			border-radius: 4px;
			font-size: 13px;
		}

		.form-group input:focus,
		.form-group select:focus {
			outline: 1px solid var(--vscode-focusBorder);
		}

		.form-group input[type="password"] {
			font-family: monospace;
		}

		.checkbox-group {
			display: flex;
			align-items: center;
			gap: 8px;
		}

		.checkbox-group input[type="checkbox"] {
			width: auto;
		}

		.checkbox-group label {
			margin: 0;
			font-weight: normal;
		}

		.provider-actions {
			display: flex;
			gap: 8px;
			margin-top: 15px;
		}

		.provider-actions button {
			flex: 1;
			padding: 8px;
			font-size: 12px;
		}

		.help-text {
			font-size: 12px;
			color: var(--vscode-descriptionForeground);
			margin-top: 5px;
		}

		.models-list {
			max-height: 100px;
			overflow-y: auto;
			background-color: var(--vscode-editor-background);
			border: 1px solid var(--vscode-panel-border);
			border-radius: 4px;
			padding: 8px;
			margin-top: 5px;
		}

		.models-list-item {
			font-size: 12px;
			padding: 2px 0;
			font-family: monospace;
		}

		.error-message {
			background-color: rgba(244, 67, 54, 0.1);
			border-left: 3px solid #f44336;
			padding: 10px;
			margin-top: 10px;
			border-radius: 4px;
			font-size: 12px;
			color: #f44336;
		}

		.loading {
			display: flex;
			align-items: center;
			gap: 8px;
			color: var(--vscode-descriptionForeground);
			font-size: 13px;
		}

		.spinner {
			border: 2px solid var(--vscode-panel-border);
			border-top: 2px solid var(--vscode-focusBorder);
			border-radius: 50%;
			width: 16px;
			height: 16px;
			animation: spin 1s linear infinite;
		}

		@keyframes spin {
			0% { transform: rotate(0deg); }
			100% { transform: rotate(360deg); }
		}

		.divider {
			height: 1px;
			background-color: var(--vscode-panel-border);
			margin: 20px 0;
		}
	</style>
</head>
<body>
	<div class="header">
		<h1>🤖 LLM Provider Configuration</h1>
		<p>Configure your AI providers, manage API keys, and test connections</p>
	</div>

	<div class="info-banner">
		<strong>📘 About API Keys and LiteLLM</strong>
		<ul>
			<li><strong>Direct Provider Keys</strong>: OpenAI, Anthropic, Cohere, Google require their own API keys</li>
			<li><strong>LiteLLM Proxy</strong>: No API key needed for the library - only for the proxy if deployed centrally</li>
			<li><strong>Local Models (Ollama)</strong>: No API keys required at all</li>
			<li><strong>Security</strong>: All API keys are stored securely in VSCode's SecretStorage</li>
		</ul>
	</div>

	<div class="actions-bar">
		<button onclick="testAllProviders()">🔍 Test All Providers</button>
		<button class="secondary" onclick="refreshProviders()">🔄 Refresh</button>
		<button class="secondary danger" onclick="clearAllAPIKeys()">🗑️ Clear All API Keys</button>
		<button class="secondary danger" onclick="resetToDefaults()">⚠️ Reset to Defaults</button>
	</div>

	<div id="loading" class="loading" style="display: none;">
		<div class="spinner"></div>
		<span>Loading providers...</span>
	</div>

	<div id="providers-container" class="providers-grid"></div>

	<script>
		const vscode = acquireVsCodeApi();
		let providersData = [];
		let activeProvider = null;
		let statuses = {};

		// Initialize
		window.addEventListener('DOMContentLoaded', () => {
			refreshProviders();
		});

		// Handle messages from extension
		window.addEventListener('message', event => {
			const message = event.data;

			switch (message.command) {
				case 'providersData':
					providersData = message.providers;
					activeProvider = message.activeProvider;
					statuses = {};
					message.statuses.forEach(s => {
						statuses[s.provider] = s;
					});
					renderProviders();
					break;

				case 'statusUpdate':
					message.statuses.forEach(s => {
						statuses[s.provider] = s;
					});
					renderProviders();
					break;

				case 'providerTested':
					statuses[message.provider] = message.status;
					renderProviders();
					break;

				case 'error':
					console.error('Error:', message.message);
					break;
			}
		});

		function refreshProviders() {
			document.getElementById('loading').style.display = 'flex';
			vscode.postMessage({ command: 'getProviders' });
			setTimeout(() => {
				document.getElementById('loading').style.display = 'none';
			}, 500);
		}

		function renderProviders() {
			const container = document.getElementById('providers-container');
			container.innerHTML = '';

			providersData.forEach(provider => {
				const card = createProviderCard(provider);
				container.appendChild(card);
			});
		}

		function createProviderCard(provider) {
			const card = document.createElement('div');
			card.className = 'provider-card';

			if (provider.provider === activeProvider) {
				card.className += ' active';
			}
			if (provider.enabled) {
				card.className += ' enabled';
			}

			const status = statuses[provider.provider] || {};
			const isHealthy = status.healthy;
			const hasError = status.error;

			card.innerHTML = \`
				<div class="provider-header">
					<div class="provider-title">
						<span class="status-indicator status-\${isHealthy ? 'healthy' : hasError ? 'error' : 'unknown'}"></span>
						<h3>\${provider.name}</h3>
					</div>
					\${provider.provider === activeProvider ? '<span class="badge active">ACTIVE</span>' : ''}
					\${provider.enabled && provider.provider !== activeProvider ? '<span class="badge">ENABLED</span>' : ''}
				</div>

				<div class="form-group checkbox-group">
					<input type="checkbox" id="enabled-\${provider.provider}"
						\${provider.enabled ? 'checked' : ''}
						onchange="toggleProvider('\${provider.provider}', this.checked)">
					<label for="enabled-\${provider.provider}">Enable Provider</label>
				</div>

				\${provider.provider !== 'ollama' ? \`
					<div class="form-group">
						<label>API Key \${provider.provider === 'litellm' ? '(Proxy Key - Optional)' : '(Required)'}</label>
						<input type="password" id="apiKey-\${provider.provider}"
							placeholder="sk-..."
							value="\${provider.apiKey || ''}"
							onchange="updateProviderField('\${provider.provider}', 'apiKey', this.value)">
						<div class="help-text">
							\${
								provider.provider === 'litellm'
									? 'Only needed if using deployed LiteLLM proxy with authentication'
								: provider.provider === 'openrouter'
									? 'Get your key from openrouter.ai'
								: 'Get your key from ' + provider.name
							}
						</div>
					</div>
				\` : ''}

				<div class="form-group">
					<label>Base URL</label>
					<input type="text" id="baseURL-\${provider.provider}"
						value="\${provider.baseURL || ''}"
						onchange="updateProviderField('\${provider.provider}', 'baseURL', this.value)">
					<div class="help-text">API endpoint for this provider</div>
				</div>

				<div class="form-group">
					<label>Default Model</label>
					<select id="model-\${provider.provider}"
						onchange="updateProviderField('\${provider.provider}', 'model', this.value)">
						\${provider.availableModels?.map(model =>
							\`<option value="\${model}" \${model === provider.model ? 'selected' : ''}>\${model}</option>\`
						).join('') || \`<option value="\${provider.model}">\${provider.model}</option>\`}
					</select>
				</div>

				\${status.models && status.models.length > 0 ? \`
					<div class="form-group">
						<label>Available Models (\${status.models.length})</label>
						<div class="models-list">
							\${status.models.map(m => \`<div class="models-list-item">\${m}</div>\`).join('')}
						</div>
					</div>
				\` : ''}

				\${hasError ? \`
					<div class="error-message">
						⚠️ \${status.error}
					</div>
				\` : ''}

				<div class="provider-actions">
					<button onclick="testProvider('\${provider.provider}')">
						🔍 Test
					</button>
					\${provider.enabled && provider.provider !== activeProvider ? \`
						<button onclick="setActiveProvider('\${provider.provider}')">
							✅ Use This
						</button>
					\` : ''}
				</div>
			\`;

			return card;
		}

		function toggleProvider(provider, enabled) {
			vscode.postMessage({
				command: 'updateProvider',
				provider,
				config: { enabled }
			});
		}

		function updateProviderField(provider, field, value) {
			vscode.postMessage({
				command: 'updateProvider',
				provider,
				config: { [field]: value }
			});
		}

		function setActiveProvider(provider) {
			vscode.postMessage({
				command: 'setActiveProvider',
				provider
			});
		}

		function testProvider(provider) {
			vscode.postMessage({
				command: 'testProvider',
				provider
			});
		}

		function testAllProviders() {
			vscode.postMessage({
				command: 'testAllProviders'
			});
		}

		function clearAllAPIKeys() {
			if (confirm('⚠️ Clear all API keys? You will need to re-enter them.')) {
				vscode.postMessage({
					command: 'clearAPIKeys'
				});
			}
		}

		function resetToDefaults() {
			if (confirm('⚠️ Reset to default configuration? This will clear all API keys and settings.')) {
				vscode.postMessage({
					command: 'resetToDefaults'
				});
			}
		}
	</script>
</body>
</html>`;
  }

  public dispose(): void {
    LLMProviderPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}
