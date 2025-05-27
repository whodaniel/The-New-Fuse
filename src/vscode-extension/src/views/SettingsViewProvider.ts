import * as vscode from 'vscode';
import { LLMProviderManager } from '../llm/LLMProviderManager';
import { WebviewMessageRouter } from '../services/WebviewMessageRouter';

/**
 * Provider for the settings webview
 */
export class SettingsViewProvider {
  public static readonly viewType = 'theNewFuse.settingsView';
  private _hostWebview?: vscode.Webview;
  private _configChangeListener?: vscode.Disposable;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _extensionContext: vscode.ExtensionContext,
    private readonly _llmProviderManager: LLMProviderManager,
    private readonly _messageRouter: WebviewMessageRouter
  ) {}

  public setHostWebview(webview: vscode.Webview) {
    this._hostWebview = webview;

    // Dispose of any existing listener
    if (this._configChangeListener) {
      this._configChangeListener.dispose();
    }

    // Update webview when configuration changes
    this._configChangeListener = vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('theNewFuse')) {
        this._updateWebviewContent();
      }
    });
  }
  // public resolveWebviewView(
  //   webviewView: vscode.WebviewView,
  //   context: vscode.WebviewViewResolveContext,
  //   _token: vscode.CancellationToken,
  // ) {
  //   this._view = webviewView;
  //   this._hostWebview = webviewView.webview;

  //   webviewView.webview.options = {
  //     enableScripts: true,
  //     localResourceRoots: [this._extensionUri]
  //   };

  //   // webviewView.webview.html = this.getHtmlBodySnippet(webviewView.webview, getNonce());

  //   // Handle messages from the webview
  //   // webviewView.webview.onDidReceiveMessage(async message => {
  //   //   await this.handleSettingsMessage(message);
  //   // });
  // }

  public async handleSettingsMessage(message: any): Promise<void> {
    // This will likely be called by TabbedContainerProvider, which gets messages from the webview
    await this._messageRouter.handleMessage(message); // MessageRouter might need to use _hostWebview to post back
  }

  /**
   * Get the current settings
   */
  private _getCurrentSettings(): any {
    const config = vscode.workspace.getConfiguration('theNewFuse');
    return {
      // LLM settings
      llmProvider: config.get('llm.provider', 'vscode'),
      vscodeModel: config.get('llm.vscodeModel', 'copilot-chat.completion-gpt-4'),
      openAIModel: config.get('llm.openAIModel', 'gpt-4'),
      anthropicModel: config.get('llm.anthropicModel', 'claude-3-opus'),
      ollamaModel: config.get('llm.ollamaModel', 'codellama'),
      customModelEndpoint: config.get('llm.customModelEndpoint', ''),
      customModelAPIKey: config.get('llm.customModelAPIKey', ''),
      
      // Chat settings
      enableChat: config.get('chat.enabled', true),
      defaultChatView: config.get('chat.defaultView', 'panel'),
      chatPanelPosition: config.get('chat.panelPosition', 'smart'),
      chatFontSize: config.get('chat.fontSize', 13),
      saveChatHistory: config.get('chat.saveHistory', true),
      maxChatHistoryLength: config.get('chat.maxHistoryLength', 50),
      
      // MCP settings
      mcpUrl: config.get('mcp.url', 'ws://localhost:3000/mcp'),
      autoConnect: config.get('mcp.autoConnect', false),
      useEnhancedClient: config.get('mcp.useEnhancedClient', true)
    };
  }

  /**
   * Generate the HTML for the webview
   */
  public getHtmlBodySnippet(webview: vscode.Webview, nonce: string): string {
    // Get current settings
    const settings = this._getCurrentSettings();
    
    // Get the local path to main script and CSS files
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'settings.js'));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'settings.css'));
    const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'codicons', 'codicon.css'));

    // Use a nonce to only allow specific scripts to be run

    return `
        <link href="${styleUri}" rel="stylesheet">
        <link href="${codiconsUri}" rel="stylesheet">
        <style nonce="${nonce}">/* Tab-specific styles if any */</style>

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
                    <label for="mcpUrl">MCP Server URL</label>
                    <input type="text" id="mcpUrl" value="${settings.mcpUrl}" placeholder="ws://localhost:3000/mcp">
                </div>
                
                <div class="form-row checkbox-setting">
                    <input type="checkbox" id="autoConnect" ${settings.autoConnect ? 'checked' : ''}>
                    <label for="autoConnect">Auto-connect on startup</label>
                </div>
                
                <div class="form-row checkbox-setting">
                    <input type="checkbox" id="useEnhancedClient" ${settings.useEnhancedClient ? 'checked' : ''}>
                    <label for="useEnhancedClient">Use Enhanced MCP Client</label>
                    <div class="description">Provides better error handling and automatic reconnection</div>
                </div>
            </div>
        </div>
        
        <button id="saveBtn">Save Settings</button>
        
        <script nonce="${nonce}">
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
                        'llm.provider': document.getElementById('llmProvider').value,
                        'llm.vscodeModel': document.getElementById('vscodeModel').value,
                        'llm.openAIModel': document.getElementById('openAIModel').value,
                        'llm.anthropicModel': document.getElementById('anthropicModel').value,
                        'llm.ollamaModel': document.getElementById('ollamaModel').value,
                        'llm.customModelEndpoint': document.getElementById('customModelEndpoint').value,
                        'llm.customModelAPIKey': document.getElementById('customModelAPIKey').value,
                        
                        // Chat settings
                        'chat.enabled': document.getElementById('enableChat').checked,
                        'chat.defaultView': document.getElementById('defaultChatView').value,
                        'chat.panelPosition': document.getElementById('chatPanelPosition').value,
                        'chat.fontSize': parseInt(document.getElementById('chatFontSize').value, 10),
                        'chat.saveHistory': document.getElementById('saveChatHistory').checked,
                        'chat.maxHistoryLength': parseInt(document.getElementById('maxChatHistoryLength').value, 10),
                        
                        // MCP settings
                        'mcp.url': document.getElementById('mcpUrl').value,
                        'mcp.autoConnect': document.getElementById('autoConnect').checked,
                        'mcp.useEnhancedClient': document.getElementById('useEnhancedClient').checked
                    };
                    
                    vscode.postMessage({
                        command: 'saveSettings',
                        data: settings
                    });
                });
            }());
        </script>
    `;
  }

  /**
   * Public method to open settings
   */
  public openSettings() {
    // This method is likely not needed as TabbedContainerProvider handles tab switching.
    // If called, it indicates a potential architectural misstep.
    console.warn("SettingsViewProvider.openSettings() called, but tab switching should be managed by TabbedContainerProvider.");
  }

  private _updateWebviewContent(): void {
    if (this._hostWebview) {
        // Option 1: Tell TabbedContainerProvider to re-fetch and re-render this tab's HTML.
        // This requires communication back to TabbedContainerProvider, or TabbedContainerProvider
        // itself listens to onDidChangeConfiguration.
        // Option 2: Post a message to settings.js to update the UI dynamically.
        const settings = this._getCurrentSettings();
        this._hostWebview.postMessage({ command: 'updateSettingsDisplay', settings: settings });
    }
  }

  public dispose() {
    if (this._configChangeListener) {
      this._configChangeListener.dispose();
      this._configChangeListener = undefined;
    }
    this._hostWebview = undefined;
    console.log('SettingsViewProvider disposed');
  }
}
