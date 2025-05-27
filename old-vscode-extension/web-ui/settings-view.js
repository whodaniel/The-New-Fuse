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
exports.SettingsView = void 0;
const vscode = __importStar(require("vscode"));
const base_webview_1 = require("./base-webview");
/**
 * Settings view component for configuring API keys and other extension settings
 */
class SettingsView extends base_webview_1.BaseWebView {
    static createOrShow(extensionUri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        // If the panel already exists, show it
        if (SettingsView.currentPanel) {
            SettingsView.currentPanel.panel.reveal(column);
            return SettingsView.currentPanel;
        }
        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(SettingsView.viewType, 'The New Fuse Settings', column || vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'web-ui')]
        });
        SettingsView.currentPanel = new SettingsView(panel, extensionUri);
        return SettingsView.currentPanel;
    }
    constructor(panel, extensionUri) {
        super(panel, extensionUri);
        this.update();
        // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'saveSettings':
                    await this.saveSettings(message.settings);
                    break;
                case 'getSettings':
                    await this.sendCurrentSettings();
                    break;
            }
        }, null, this.disposables);
        this.panel.onDidDispose(() => {
            SettingsView.currentPanel = undefined;
        }, null, this.disposables);
    }
    update() {
        this.panel.webview.html = this.getHtmlForWebview();
    }
    async saveSettings(settings) {
        const config = vscode.workspace.getConfiguration('thefuse');
        // Update each setting in configuration
        for (const [key, value] of Object.entries(settings)) {
            await config.update(key, value, vscode.ConfigurationTarget.Global);
        }
        vscode.window.showInformationMessage('Settings saved successfully');
        // Force an update of the LLM provider configuration
        await vscode.commands.executeCommand('thefuse.refreshLLMProviders');
    }
    async sendCurrentSettings() {
        const config = vscode.workspace.getConfiguration('thefuse');
        const settings = {
            openaiApiKey: config.get('openaiApiKey') || '',
            anthropicApiKey: config.get('anthropicApiKey') || '',
            ollamaUrl: config.get('ollamaUrl') || 'http://localhost:11434',
            defaultProvider: config.get('defaultProvider') || 'openai',
            defaultModel: config.get('defaultModel') || 'gpt-4',
            enableCompletions: config.get('enableCompletions') || true
        };
        // Mask the API keys before sending them back to the webview
        if (settings.openaiApiKey) {
            settings.openaiApiKey = '••••••••' + settings.openaiApiKey.slice(-4);
        }
        if (settings.anthropicApiKey) {
            settings.anthropicApiKey = '••••••••' + settings.anthropicApiKey.slice(-4);
        }
        this.panel.webview.postMessage({
            command: 'updateSettings',
            settings
        });
    }
    getHtmlForWebview() {
        // Get paths for script and CSS resources
        const scriptUri = this.getWebviewUri('settings.js');
        const styleUri = this.getWebviewUri('styles.css');
        const nonce = this.getNonce();
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${this.panel.webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
            <title>The New Fuse Settings</title>
            <link rel="stylesheet" href="${styleUri}">
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1><span class="icon">⚙️</span> The New Fuse Settings</h1>
                </div>
                
                <div class="main-content">
                    <div class="settings-section">
                        <h2>API Key Configuration</h2>
                        <p>Enter your API keys to connect to external LLM providers.</p>
                        
                        <div class="settings-form">
                            <div class="form-group">
                                <label for="openaiApiKey">OpenAI API Key:</label>
                                <input type="password" id="openaiApiKey" class="settings-input" placeholder="sk-...">
                                <p class="field-description">Your OpenAI API key for accessing GPT models</p>
                            </div>
                            
                            <div class="form-group">
                                <label for="anthropicApiKey">Anthropic API Key:</label>
                                <input type="password" id="anthropicApiKey" class="settings-input" placeholder="sk-ant-...">
                                <p class="field-description">Your Anthropic API key for accessing Claude models</p>
                            </div>
                            
                            <div class="form-group">
                                <label for="ollamaUrl">Ollama URL:</label>
                                <input type="text" id="ollamaUrl" class="settings-input" placeholder="http://localhost:11434">
                                <p class="field-description">URL for your local Ollama instance</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h2>LLM Provider Settings</h2>
                        <p>Configure your preferred LLM provider and model defaults.</p>
                        
                        <div class="settings-form">
                            <div class="form-group">
                                <label for="defaultProvider">Default Provider:</label>
                                <select id="defaultProvider" class="settings-input">
                                    <option value="openai">OpenAI</option>
                                    <option value="anthropic">Anthropic</option>
                                    <option value="ollama">Ollama (Local)</option>
                                    <option value="vscode">VS Code Built-in</option>
                                </select>
                                <p class="field-description">The default LLM provider to use</p>
                            </div>
                            
                            <div class="form-group">
                                <label for="defaultModel">Default Model:</label>
                                <input type="text" id="defaultModel" class="settings-input" placeholder="gpt-4">
                                <p class="field-description">The default model to use with the selected provider</p>
                            </div>
                            
                            <div class="form-group checkbox-group">
                                <input type="checkbox" id="enableCompletions">
                                <label for="enableCompletions">Enable AI Completions</label>
                                <p class="field-description">Show AI code completion suggestions as you type</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="footer">
                    <button id="save-settings" class="primary-button">Save Settings</button>
                    <button id="cancel-settings" class="secondary-button">Cancel</button>
                </div>
            </div>

            <script nonce="${nonce}">
                (function() {
                    const vscode = acquireVsCodeApi();
                    
                    // Elements
                    const openaiApiKeyInput = document.getElementById('openaiApiKey');
                    const anthropicApiKeyInput = document.getElementById('anthropicApiKey');
                    const ollamaUrlInput = document.getElementById('ollamaUrl');
                    const defaultProviderSelect = document.getElementById('defaultProvider');
                    const defaultModelInput = document.getElementById('defaultModel');
                    const enableCompletionsCheckbox = document.getElementById('enableCompletions');
                    const saveButton = document.getElementById('save-settings');
                    const cancelButton = document.getElementById('cancel-settings');
                    
                    // Request current settings on load
                    vscode.postMessage({ command: 'getSettings' });
                    
                    // Handle messages from the extension
                    window.addEventListener('message', event => {
                        const message = event.data;
                        
                        switch (message.command) {
                            case 'updateSettings':
                                // Update form with current settings
                                const settings = message.settings;
                                
                                openaiApiKeyInput.value = settings.openaiApiKey || '';
                                anthropicApiKeyInput.value = settings.anthropicApiKey || '';
                                ollamaUrlInput.value = settings.ollamaUrl || 'http://localhost:11434';
                                defaultProviderSelect.value = settings.defaultProvider || 'openai';
                                defaultModelInput.value = settings.defaultModel || 'gpt-4';
                                enableCompletionsCheckbox.checked = settings.enableCompletions !== false;
                                break;
                        }
                    });
                    
                    // Save settings
                    saveButton.addEventListener('click', () => {
                        const settings = {
                            openaiApiKey: openaiApiKeyInput.value.startsWith('••••') ? undefined : openaiApiKeyInput.value,
                            anthropicApiKey: anthropicApiKeyInput.value.startsWith('••••') ? undefined : anthropicApiKeyInput.value,
                            ollamaUrl: ollamaUrlInput.value,
                            defaultProvider: defaultProviderSelect.value,
                            defaultModel: defaultModelInput.value,
                            enableCompletions: enableCompletionsCheckbox.checked
                        };
                        
                        // Remove undefined fields to avoid overwriting with undefined
                        Object.keys(settings).forEach(key => {
                            if (settings[key] === undefined) {
                                delete settings[key];
                            }
                        });
                        
                        vscode.postMessage({ 
                            command: 'saveSettings',
                            settings: settings
                        });
                    });
                    
                    // Cancel button just closes the panel
                    cancelButton.addEventListener('click', () => {
                        vscode.postMessage({ command: 'close' });
                    });
                })();
            </script>
        </body>
        </html>`;
    }
}
exports.SettingsView = SettingsView;
SettingsView.viewType = 'thefuse-settings';
//# sourceMappingURL=settings-view.js.map