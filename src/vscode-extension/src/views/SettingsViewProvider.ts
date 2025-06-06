import * as vscode from 'vscode';
export class SettingsViewProvider {
    constructor(private context: vscode.ExtensionContext) {}
    public setHostWebview(webview: vscode.Webview): void { console.log('SettingsViewProvider host webview set'); }
    
    public getHtmlBodySnippet(webview: vscode.Webview, nonce: string): string {
        return `
            <div class="settings-container">
                <h2>Settings</h2>
                <div class="settings-form">
                    <div class="setting-group">
                        <label for="api-key">API Key:</label>
                        <input type="password" id="api-key" placeholder="Enter your API key">
                    </div>
                    <div class="setting-group">
                        <label for="model-selection">Model:</label>
                        <select id="model-selection">
                            <option value="gpt-4">GPT-4</option>
                            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                            <option value="claude-3">Claude 3</option>
                        </select>
                    </div>
                    <div class="setting-group">
                        <label for="auto-save">Auto-save:</label>
                        <input type="checkbox" id="auto-save" checked>
                    </div>
                    <button class="save-button">Save Settings</button>
                </div>
            </div>
        `;
    }
    
    public dispose(): void {}
}
