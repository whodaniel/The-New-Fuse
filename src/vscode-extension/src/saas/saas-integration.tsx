import * as vscode from 'vscode';

export class SaasIntegration {
    private context: vscode.ExtensionContext;
    private webviewPanel: vscode.WebviewPanel | undefined;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public async createDashboard(): Promise<vscode.WebviewPanel> {
        if (this.webviewPanel) {
            this.webviewPanel.reveal();
            return this.webviewPanel;
        }

        this.webviewPanel = vscode.window.createWebviewPanel(
            'thefuseDashboard',
            'The New Fuse Dashboard',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(this.context.extensionUri, 'resources')
                ]
            }
        );

        this.webviewPanel.iconPath = {
            light: vscode.Uri.joinPath(this.context.extensionUri, 'resources', 'fusion-icon.svg'),
            dark: vscode.Uri.joinPath(this.context.extensionUri, 'resources', 'fusion-icon.svg')
        };

        const config = vscode.workspace.getConfiguration('theFuse');
        const serverUrl = config.get('agentServerUrl');

        this.webviewPanel.webview.html = this.getDashboardHtml(serverUrl as string);

        // Handle messages from the webview
        this.webviewPanel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'connectToSaas':
                        await this.handleSaasConnection(message.token);
                        return;
                    case 'executeAction':
                        await this.executeAction(message.action, message.params);
                        return;
                }
            },
            undefined,
            this.context.subscriptions
        );

        this.webviewPanel.onDidDispose(
            () => {
                this.webviewPanel = undefined;
            },
            null,
            this.context.subscriptions
        );

        return this.webviewPanel;
    }

    private getDashboardHtml(serverUrl: string): string {
        return `<!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>The New Fuse Dashboard</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                        padding: 1rem;
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                    }
                    .connection-status {
                        display: flex;
                        align-items: center;
                        margin-bottom: 1rem;
                        padding: 0.5rem;
                        border-radius: 4px;
                        background: var(--vscode-toolbar-hoverBackground);
                    }
                    .status-icon {
                        width: 10px;
                        height: 10px;
                        border-radius: 50%;
                        margin-right: 0.5rem;
                    }
                    .connected { background: #4CAF50; }
                    .disconnected { background: #F44336; }
                    button {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 0.5rem 1rem;
                        border-radius: 2px;
                        cursor: pointer;
                    }
                    button:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                </style>
            </head>
            <body>
                <div class="connection-status">
                    <div class="status-icon disconnected" id="statusIcon"></div>
                    <span id="statusText">Disconnected</span>
                </div>
                <button id="connectBtn">Connect to The New Fuse Platform</button>
                <div id="dashboard" style="display: none;">
                    <h2>Available Tools</h2>
                    <div id="toolsList"></div>
                </div>
                <script>
                    const vscode = acquireVsCodeApi();
                    const connectBtn = document.getElementById('connectBtn');
                    const statusIcon = document.getElementById('statusIcon');
                    const statusText = document.getElementById('statusText');
                    const dashboard = document.getElementById('dashboard');

                    connectBtn.addEventListener('click', () => {
                        vscode.postMessage({
                            command: 'connectToSaas'
                        });
                    });

                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.type) {
                            case 'connectionStatus':
                                updateConnectionStatus(message.connected);
                                break;
                            case 'updateTools':
                                updateToolsList(message.tools);
                                break;
                        }
                    });

                    function updateConnectionStatus(connected): any {
                        statusIcon.className = 'status-icon ' + (connected ? 'connected' : 'disconnected');
                        statusText.textContent = connected ? 'Connected' : 'Disconnected';
                        dashboard.style.display = connected ? 'block' : 'none';
                        connectBtn.style.display = connected ? 'none' : 'block';
                    }

                    function updateToolsList(tools): any {
                        const toolsList = document.getElementById('toolsList');
                        toolsList.innerHTML = tools.map(tool => `
                            <div class="tool-item">
                                <h3>${tool.name}</h3>
                                <p>${tool.description}</p>
                                <button onclick="activateTool('${tool.id}')">Activate</button>
                            </div>
                        `).join('');
                    }

                    function activateTool(toolId): any {
                        vscode.postMessage({
                            command: 'executeAction',
                            action: 'activateTool',
                            params: { toolId }
                        });
                    }
                </script>
            </body>
        </html>`;
    }

    private async handleSaasConnection(token?: string) {
        try {
            const config = vscode.workspace.getConfiguration('theFuse');
            const serverUrl = config.get('agentServerUrl');
            
            // Implement connection logic here
            // This would typically involve authenticating with the SAAS platform
            
            if (this.webviewPanel) {
                this.webviewPanel.webview.postMessage({ 
                    type: 'connectionStatus', 
                    connected: true 
                });
            }
        } catch (error) {
            vscode.window.showErrorMessage('Failed to connect to The New Fuse platform: ' + error.message);
            if (this.webviewPanel) {
                this.webviewPanel.webview.postMessage({ 
                    type: 'connectionStatus', 
                    connected: false 
                });
            }
        }
    }

    private async executeAction(action: string, params: any) {
        // Implement action handling here
        switch (action) {
            case 'activateTool':
                // Handle tool activation
                break;
            // Add more actions as needed
        }
    }
}