import * as vscode from 'vscode';

export class CommunicationHubProvider {
    private webview?: vscode.Webview;

    setHostWebview(webview: vscode.Webview): void {
        this.webview = webview;
    }

    getHtmlBodySnippet(webview: vscode.Webview, nonce: string, pathModule: any): string {
        return `
            <div class="communication-hub">
                <h3>🔗 Communication Hub</h3>
                <div class="connection-status">
                    <p>WebSocket Status: <span id="ws-status">Disconnected</span></p>
                    <button id="connect-btn">Connect</button>
                    <button id="disconnect-btn">Disconnect</button>
                </div>
                <div class="message-area">
                    <textarea id="message-input" placeholder="Enter message..."></textarea>
                    <button id="send-msg-btn">Send Message</button>
                </div>
                <div id="message-log"></div>
            </div>
        `;
    }
}

export class DashboardProvider {
    private webview?: vscode.Webview;

    setHostWebview(webview: vscode.Webview): void {
        this.webview = webview;
    }

    getHtmlBodySnippet(webview: vscode.Webview, nonce: string): string {
        return `
            <div class="dashboard">
                <h3>📊 Dashboard</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <h4>Active Sessions</h4>
                        <span class="stat-value">0</span>
                    </div>
                    <div class="stat-card">
                        <h4>Messages Sent</h4>
                        <span class="stat-value">0</span>
                    </div>
                    <div class="stat-card">
                        <h4>API Calls</h4>
                        <span class="stat-value">0</span>
                    </div>
                </div>
                <div class="recent-activity">
                    <h4>Recent Activity</h4>
                    <ul id="activity-log">
                        <li>Extension activated</li>
                    </ul>
                </div>
            </div>
        `;
    }
}

export class SettingsViewProvider {
    private webview?: vscode.Webview;

    setHostWebview(webview: vscode.Webview): void {
        this.webview = webview;
    }

    getHtmlBodySnippet(webview: vscode.Webview, nonce: string): string {
        return `
            <div class="settings">
                <h3>⚙️ Settings</h3>
                <div class="setting-group">
                    <label for="llm-provider">LLM Provider:</label>
                    <select id="llm-provider">
                        <option value="vscode">VS Code</option>
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                    </select>
                </div>
                <div class="setting-group">
                    <label for="api-url">API URL:</label>
                    <input type="text" id="api-url" value="http://localhost:3001/api">
                </div>
                <div class="setting-group">
                    <label for="debug-mode">
                        <input type="checkbox" id="debug-mode"> Enable Debug Mode
                    </label>
                </div>
                <button id="save-settings">Save Settings</button>
            </div>
        `;
    }
}