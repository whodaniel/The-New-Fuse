import * as vscode from 'vscode';
import { ConfigurationService } from '../services/core/ConfigurationService';

export class SettingsViewProvider {
    private _webview?: vscode.Webview;
    private _extensionUri: vscode.Uri;

    constructor(
        extensionUri: vscode.Uri,
        private configService: ConfigurationService
    ) {
        this._extensionUri = extensionUri;
    }

    public setHostWebview(webview: vscode.Webview): void {
        this._webview = webview;
    }

    public getHtmlBodySnippet(webview: vscode.Webview, nonce: string, path: any): string {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media', 'settings.js'))
        );
        
        const styleUri = webview.asWebviewUri(
            vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media', 'settings.css'))
        );

        return `
            <link href="${styleUri}" rel="stylesheet">
            <div class="settings-container">
                <div class="settings-header">
                    <h2><i class="codicon codicon-settings-gear"></i> Settings</h2>
                </div>
                
                <div class="settings-tabs">
                    <button class="settings-tab active" data-settings-tab="general">General</button>
                    <button class="settings-tab" data-settings-tab="providers">LLM Providers</button>
                    <button class="settings-tab" data-settings-tab="communication">Communication</button>
                    <button class="settings-tab" data-settings-tab="appearance">Appearance</button>
                </div>
                
                <div class="settings-content">
                    <!-- General Settings -->
                    <div id="settings-general" class="settings-tab-content active">
                        <h3>General Settings</h3>
                        <div class="setting-group">
                            <label for="auto-save">Auto-save conversations</label>
                            <input type="checkbox" id="auto-save" checked>
                        </div>
                        <div class="setting-group">
                            <label for="show-notifications">Show notifications</label>
                            <input type="checkbox" id="show-notifications" checked>
                        </div>
                        <div class="setting-group">
                            <label for="max-history">Maximum conversation history</label>
                            <input type="number" id="max-history" value="100" min="10" max="1000">
                        </div>
                        <div class="setting-group">
                            <label for="theme">Theme</label>
                            <select id="theme">
                                <option value="auto">Auto (VS Code)</option>
                                <option value="light">Light</option>
                                <option value="dark">Dark</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- LLM Providers Settings -->
                    <div id="settings-providers" class="settings-tab-content">
                        <h3>LLM Providers</h3>
                        <div class="provider-list">
                            <div class="provider-item">
                                <div class="provider-header">
                                    <h4>OpenAI</h4>
                                    <button class="btn-small provider-toggle" data-provider="openai">
                                        Configure
                                    </button>
                                </div>
                                <div class="provider-config" id="openai-config" style="display: none;">
                                    <div class="setting-group">
                                        <label for="openai-api-key">API Key</label>
                                        <input type="password" id="openai-api-key" placeholder="sk-...">
                                    </div>
                                    <div class="setting-group">
                                        <label for="openai-model">Model</label>
                                        <select id="openai-model">
                                            <option value="gpt-4">GPT-4</option>
                                            <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="provider-item">
                                <div class="provider-header">
                                    <h4>Anthropic</h4>
                                    <button class="btn-small provider-toggle" data-provider="anthropic">
                                        Configure
                                    </button>
                                </div>
                                <div class="provider-config" id="anthropic-config" style="display: none;">
                                    <div class="setting-group">
                                        <label for="anthropic-api-key">API Key</label>
                                        <input type="password" id="anthropic-api-key" placeholder="sk-ant-...">
                                    </div>
                                    <div class="setting-group">
                                        <label for="anthropic-model">Model</label>
                                        <select id="anthropic-model">
                                            <option value="claude-3-opus">Claude 3 Opus</option>
                                            <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                                            <option value="claude-3-haiku">Claude 3 Haiku</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Communication Settings -->
                    <div id="settings-communication" class="settings-tab-content">
                        <h3>Communication Settings</h3>
                        <div class="setting-group">
                            <label for="websocket-url">WebSocket URL</label>
                            <input type="url" id="websocket-url" value="ws://localhost:3710">
                        </div>
                        <div class="setting-group">
                            <label for="relay-url">Relay Server URL</label>
                            <input type="url" id="relay-url" value="http://localhost:3000">
                        </div>
                        <div class="setting-group">
                            <label for="api-url">API Server URL</label>
                            <input type="url" id="api-url" value="http://localhost:3001">
                        </div>
                        <div class="setting-group">
                            <label for="auto-reconnect">Auto-reconnect on connection loss</label>
                            <input type="checkbox" id="auto-reconnect" checked>
                        </div>
                        <div class="setting-group">
                            <label for="max-retry-attempts">Max retry attempts</label>
                            <input type="number" id="max-retry-attempts" value="5" min="1" max="10">
                        </div>
                    </div>
                    
                    <!-- Appearance Settings -->
                    <div id="settings-appearance" class="settings-tab-content">
                        <h3>Appearance</h3>
                        <div class="setting-group">
                            <label for="font-size">Font Size</label>
                            <input type="range" id="font-size" min="12" max="18" value="14">
                            <span id="font-size-value">14px</span>
                        </div>
                        <div class="setting-group">
                            <label for="show-line-numbers">Show line numbers in code blocks</label>
                            <input type="checkbox" id="show-line-numbers" checked>
                        </div>
                        <div class="setting-group">
                            <label for="enable-syntax-highlighting">Enable syntax highlighting</label>
                            <input type="checkbox" id="enable-syntax-highlighting" checked>
                        </div>
                        <div class="setting-group">
                            <label for="compact-mode">Compact mode</label>
                            <input type="checkbox" id="compact-mode">
                        </div>
                    </div>
                </div>
                
                <div class="settings-footer">
                    <button id="save-settings" class="btn-primary">
                        <i class="codicon codicon-save"></i> Save Settings
                    </button>
                    <button id="reset-settings" class="btn-secondary">
                        <i class="codicon codicon-discard"></i> Reset to Defaults
                    </button>
                </div>
            </div>
            
            <script nonce="${nonce}" src="${scriptUri}"></script>
        `;
    }

    public dispose(): void {
        this._webview = undefined;
    }
}
