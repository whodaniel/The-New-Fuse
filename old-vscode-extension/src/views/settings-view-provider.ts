// Settings view provider for The New Fuse extension
import * as vscode from 'vscode';
import { LLMProvider } from '../../lm-api-bridge.js';

/**
 * Provider for the settings webview
 */
export class SettingsViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'thefuse.settingsView';
  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _extensionContext: vscode.ExtensionContext
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(message => {
      switch (message.command) {
        case 'saveSettings':
          this._saveSettings(message.settings);
          break;
      }
    });

    // Update webview when configuration changes
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('theFuse')) {
        this._updateWebview();
      }
    });
  }

  /**
   * Save settings to VS Code configuration
   */
  private _saveSettings(settings: any): void {
    const config = vscode.workspace.getConfiguration('theFuse');
    
    // Update settings
    for (const [key, value] of Object.entries(settings)) {
      config.update(key, value, vscode.ConfigurationTarget.Global);
    }

    vscode.window.showInformationMessage('The New Fuse settings saved successfully!');
  }

  /**
   * Update the webview content
   */
  private _updateWebview(): void {
    if (this._view) {
      this._view.webview.html = this._getHtmlForWebview(this._view.webview);
    }
  }

  /**
   * Get the current settings
   */
  private _getCurrentSettings(): any {
    const config = vscode.workspace.getConfiguration('theFuse');
    return {
      // LLM settings
      llmProvider: config.get('llmProvider', 'vscode'),
      vscodeModel: config.get('vscodeModel', 'copilot-chat.completion-gpt-4'),
      openAIModel: config.get('openAIModel', 'gpt-4'),
      anthropicModel: config.get('anthropicModel', 'claude-3-opus'),
      ollamaModel: config.get('ollamaModel', 'codellama'),
      customModelEndpoint: config.get('customModelEndpoint', ''),
      customModelAPIKey: config.get('customModelAPIKey', ''),
      
      // Chat settings
      enableChat: config.get('enableChat', true),
      defaultChatView: config.get('defaultChatView', 'panel'),
      chatPanelPosition: config.get('chatPanelPosition', 'smart'),
      chatFontSize: config.get('chatFontSize', 13),
      saveChatHistory: config.get('saveChatHistory', true),
      maxChatHistoryLength: config.get('maxChatHistoryLength', 50),
      
      // MCP settings
      mcpConfigPath: config.get('mcpConfigPath', ''),
      autoInitializeMcp: config.get('autoInitializeMcp', true),
      agentServerUrl: config.get('agentServerUrl', 'http://localhost:3000')
    };
  }

  /**
   * Generate the HTML for the webview
   */
  private _getHtmlForWebview(webview: vscode.Webview): string {
    // Get current settings
    const settings = this._getCurrentSettings();
    
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>The New Fuse Settings</title>
        <style>
            body {
                font-family: var(--vscode-font-family);
                font-size: var(--vscode-font-size);
                color: var(--vscode-foreground);
                padding: 20px;
                background-color: var(--vscode-editor-background);
            }
            h1 {
                font-size: 24px;
                margin-bottom: 20px;
                font-weight: 400;
                color: var(--vscode-settings-headerForeground);
                border-bottom: 1px solid var(--vscode-panel-border);
                padding-bottom: 10px;
            }
            h2 {
                font-size: 18px;
                margin-top: 30px;
                margin-bottom: 15px;
                font-weight: 400;
                color: var(--vscode-settings-headerForeground);
            }
            .section {
                margin-bottom: 30px;
            }
            .setting-group {
                margin-bottom: 20px;
                padding: 15px;
                background-color: var(--vscode-settings-rowHoverBackground);
                border-radius: 5px;
            }
            .form-row {
                margin-bottom: 15px;
            }
            label {
                display: block;
                margin-bottom: 6px;
                font-weight: 500;
            }
            select, input[type="text"], input[type="number"], input[type="password"] {
                width: 100%;
                padding: 8px;
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
                border-radius: 3px;
            }
            input[type="checkbox"] {
                margin-right: 8px;
            }
            button {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 8px 16px;
                border-radius: 3px;
                cursor: pointer;
                font-weight: 500;
                margin-top: 15px;
            }
            button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
            .provider-settings {
                padding: 10px;
                margin-top: 10px;
                border-left: 3px solid var(--vscode-activityBar-activeBorder);
                background-color: var(--vscode-editor-background);
            }
            .checkbox-setting {
                display: flex;
                align-items: center;
            }
            .checkbox-setting label {
                margin-bottom: 0;
                display: inline;
            }
            .description {
                font-size: 12px;
                color: var(--vscode-descriptionForeground);
                margin-top: 4px;
                margin-bottom: 8px;
            }
            .hidden {
                display: none;
            }
        </style>
    </head>
    <body>
        <h1>The New Fuse Settings</h1>
        
        <div class="section">
            <h2>🤖 Language Model Settings</h2>
            <div class="setting-group">
                <div class="form-row">
                    <label for="llmProvider">LLM Provider</label>
                    <div class="description">Select the AI provider for chat and code assistance</div>
                    <select id="llmProvider">
                        <option value="vscode" ${settings.llmProvider === 'vscode' ? 'selected' : ''}>VS Code LM API (GitHub Copilot)</option>
                        <option value="openai" ${settings.llmProvider === 'openai' ? 'selected' : ''}>OpenAI</option>
                        <option value="anthropic" ${settings.llmProvider === 'anthropic' ? 'selected' : ''}>Anthropic</option>
                        <option value="ollama" ${settings.llmProvider === 'ollama' ? 'selected' : ''}>Ollama (Local)</option>
                        <option value="custom" ${settings.llmProvider === 'custom' ? 'selected' : ''}>Custom</option>
                    </select>
                </div>
                
                <!-- VS Code LM API settings -->
                <div id="vscode-settings" class="provider-settings ${settings.llmProvider !== 'vscode' ? 'hidden' : ''}">
                    <div class="form-row">
                        <label for="vscodeModel">VS Code LM API Model</label>
                        <div class="description">Select which VS Code Language Model to use</div>
                        <select id="vscodeModel">
                            <option value="copilot-chat.completion-gpt-4" ${settings.vscodeModel === 'copilot-chat.completion-gpt-4' ? 'selected' : ''}>GPT-4 (Default)</option>
                            <option value="copilot-chat.completion-gpt-3.5-turbo" ${settings.vscodeModel === 'copilot-chat.completion-gpt-3.5-turbo' ? 'selected' : ''}>GPT-3.5 Turbo</option>
                            <option value="copilot-chat.generation" ${settings.vscodeModel === 'copilot-chat.generation' ? 'selected' : ''}>Copilot Code Generation</option>
                        </select>
                    </div>
                </div>
                
                <!-- OpenAI settings -->
                <div id="openai-settings" class="provider-settings ${settings.llmProvider !== 'openai' ? 'hidden' : ''}">
                    <div class="form-row">
                        <label for="openAIModel">OpenAI Model</label>
                        <select id="openAIModel">
                            <option value="gpt-4" ${settings.openAIModel === 'gpt-4' ? 'selected' : ''}>GPT-4</option>
                            <option value="gpt-4-turbo" ${settings.openAIModel === 'gpt-4-turbo' ? 'selected' : ''}>GPT-4 Turbo</option>
                            <option value="gpt-3.5-turbo" ${settings.openAIModel === 'gpt-3.5-turbo' ? 'selected' : ''}>GPT-3.5 Turbo</option>
                        </select>
                    </div>
                    <!-- API key would be added here in a full implementation -->
                </div>
                
                <!-- Anthropic settings -->
                <div id="anthropic-settings" class="provider-settings ${settings.llmProvider !== 'anthropic' ? 'hidden' : ''}">
                    <div class="form-row">
                        <label for="anthropicModel">Anthropic Model</label>
                        <select id="anthropicModel">
                            <option value="claude-3-opus" ${settings.anthropicModel === 'claude-3-opus' ? 'selected' : ''}>Claude 3 Opus</option>
                            <option value="claude-3-sonnet" ${settings.anthropicModel === 'claude-3-sonnet' ? 'selected' : ''}>Claude 3 Sonnet</option>
                            <option value="claude-3-haiku" ${settings.anthropicModel === 'claude-3-haiku' ? 'selected' : ''}>Claude 3 Haiku</option>
                        </select>
                    </div>
                    <!-- API key would be added here in a full implementation -->
                </div>
                
                <!-- Ollama settings -->
                <div id="ollama-settings" class="provider-settings ${settings.llmProvider !== 'ollama' ? 'hidden' : ''}">
                    <div class="form-row">
                        <label for="ollamaModel">Ollama Model</label>
                        <select id="ollamaModel">
                            <option value="codellama" ${settings.ollamaModel === 'codellama' ? 'selected' : ''}>CodeLlama</option>
                            <option value="llama3" ${settings.ollamaModel === 'llama3' ? 'selected' : ''}>Llama 3</option>
                            <option value="mistral" ${settings.ollamaModel === 'mistral' ? 'selected' : ''}>Mistral</option>
                            <option value="phi" ${settings.ollamaModel === 'phi' ? 'selected' : ''}>Phi</option>
                            <option value="gemma" ${settings.ollamaModel === 'gemma' ? 'selected' : ''}>Gemma</option>
                        </select>
                    </div>
                </div>
                
                <!-- Custom settings -->
                <div id="custom-settings" class="provider-settings ${settings.llmProvider !== 'custom' ? 'hidden' : ''}">
                    <div class="form-row">
                        <label for="customModelEndpoint">Custom Model Endpoint</label>
                        <input type="text" id="customModelEndpoint" value="${settings.customModelEndpoint}" placeholder="https://api.example.com/v1/chat/completions">
                    </div>
                    <div class="form-row">
                        <label for="customModelAPIKey">API Key</label>
                        <input type="password" id="customModelAPIKey" value="${settings.customModelAPIKey}" placeholder="Your API key">
                    </div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>💬 Chat Interface Settings</h2>
            <div class="setting-group">
                <div class="form-row checkbox-setting">
                    <input type="checkbox" id="enableChat" ${settings.enableChat ? 'checked' : ''}>
                    <label for="enableChat">Enable Chat Interface</label>
                </div>
                <div class="description">Show or hide the chat interface in The New Fuse</div>
                
                <div class="form-row">
                    <label for="defaultChatView">Default Chat View</label>
                    <select id="defaultChatView">
                        <option value="panel" ${settings.defaultChatView === 'panel' ? 'selected' : ''}>Panel (Copilot-like)</option>
                        <option value="sidebar" ${settings.defaultChatView === 'sidebar' ? 'selected' : ''}>Sidebar</option>
                    </select>
                </div>
                
                <div class="form-row">
                    <label for="chatPanelPosition">Chat Panel Position</label>
                    <select id="chatPanelPosition">
                        <option value="smart" ${settings.chatPanelPosition === 'smart' ? 'selected' : ''}>Smart (Auto-position)</option>
                        <option value="beside" ${settings.chatPanelPosition === 'beside' ? 'selected' : ''}>Beside Editor</option>
                        <option value="active" ${settings.chatPanelPosition === 'active' ? 'selected' : ''}>Replace Editor</option>
                    </select>
                </div>
                
                <div class="form-row">
                    <label for="chatFontSize">Chat Font Size (px)</label>
                    <input type="number" id="chatFontSize" value="${settings.chatFontSize}" min="10" max="24">
                </div>
                
                <div class="form-row checkbox-setting">
                    <input type="checkbox" id="saveChatHistory" ${settings.saveChatHistory ? 'checked' : ''}>
                    <label for="saveChatHistory">Save Chat History</label>
                </div>
                
                <div class="form-row">
                    <label for="maxChatHistoryLength">Max Chat History Length</label>
                    <input type="number" id="maxChatHistoryLength" value="${settings.maxChatHistoryLength}" min="10" max="1000">
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>🔧 MCP Integration Settings</h2>
            <div class="setting-group">
                <div class="form-row">
                    <label for="mcpConfigPath">MCP Configuration Path</label>
                    <input type="text" id="mcpConfigPath" value="${settings.mcpConfigPath}" placeholder="Path to MCP config file">
                </div>
                
                <div class="form-row checkbox-setting">
                    <input type="checkbox" id="autoInitializeMcp" ${settings.autoInitializeMcp ? 'checked' : ''}>
                    <label for="autoInitializeMcp">Auto-initialize MCP</label>
                </div>
                
                <div class="form-row">
                    <label for="agentServerUrl">Agent Server URL</label>
                    <input type="text" id="agentServerUrl" value="${settings.agentServerUrl}" placeholder="http://localhost:3000">
                </div>
            </div>
        </div>
        
        <button id="saveBtn">Save Settings</button>
        
        <script>
            (function() {
                const vscode = acquireVsCodeApi();
                
                // Elements
                const llmProviderSelect = document.getElementById('llmProvider');
                const vscodeSettings = document.getElementById('vscode-settings');
                const openaiSettings = document.getElementById('openai-settings');
                const anthropicSettings = document.getElementById('anthropic-settings');
                const ollamaSettings = document.getElementById('ollama-settings');
                const customSettings = document.getElementById('custom-settings');
                const saveBtn = document.getElementById('saveBtn');
                
                // Show/hide provider settings based on selection
                llmProviderSelect.addEventListener('change', () => {
                    const provider = llmProviderSelect.value;
                    
                    vscodeSettings.classList.toggle('hidden', provider !== 'vscode');
                    openaiSettings.classList.toggle('hidden', provider !== 'openai');
                    anthropicSettings.classList.toggle('hidden', provider !== 'anthropic');
                    ollamaSettings.classList.toggle('hidden', provider !== 'ollama');
                    customSettings.classList.toggle('hidden', provider !== 'custom');
                });
                
                // Save settings
                saveBtn.addEventListener('click', () => {
                    const settings = {
                        // LLM settings
                        llmProvider: document.getElementById('llmProvider').value,
                        vscodeModel: document.getElementById('vscodeModel').value,
                        openAIModel: document.getElementById('openAIModel').value,
                        anthropicModel: document.getElementById('anthropicModel').value,
                        ollamaModel: document.getElementById('ollamaModel').value,
                        customModelEndpoint: document.getElementById('customModelEndpoint').value,
                        customModelAPIKey: document.getElementById('customModelAPIKey').value,
                        
                        // Chat settings
                        enableChat: document.getElementById('enableChat').checked,
                        defaultChatView: document.getElementById('defaultChatView').value,
                        chatPanelPosition: document.getElementById('chatPanelPosition').value,
                        chatFontSize: parseInt(document.getElementById('chatFontSize').value, 10),
                        saveChatHistory: document.getElementById('saveChatHistory').checked,
                        maxChatHistoryLength: parseInt(document.getElementById('maxChatHistoryLength').value, 10),
                        
                        // MCP settings
                        mcpConfigPath: document.getElementById('mcpConfigPath').value,
                        autoInitializeMcp: document.getElementById('autoInitializeMcp').checked,
                        agentServerUrl: document.getElementById('agentServerUrl').value
                    };
                    
                    vscode.postMessage({
                        command: 'saveSettings',
                        settings
                    });
                });
            }());
        </script>
    </body>
    </html>`;
  }

  /**
   * Public method to open settings
   */
  public openSettings() {
    if (this._view) {
      this._view.show(true);
    }
  }
}