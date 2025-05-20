import * as vscode from 'vscode';
import { BaseWebView } from './base-webview.js';

/**
 * Settings view component for configuring API keys and other extension settings
 */
export class SettingsView extends BaseWebView {
    public static readonly viewType = 'thefuse-settings';
    private static currentPanel: SettingsView | undefined;

    public static createOrShow(extensionUri: vscode.Uri): SettingsView {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If the panel already exists, show it
        if (SettingsView.currentPanel) {
            SettingsView.currentPanel.panel.reveal(column);
            return SettingsView.currentPanel;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            SettingsView.viewType,
            'The New Fuse Settings',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'web-ui'), vscode.Uri.joinPath(extensionUri, 'media')]
            }
        );

        SettingsView.currentPanel = new SettingsView(panel, extensionUri);
        return SettingsView.currentPanel;
    }

    constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        super(panel, extensionUri);
        this.update();

        // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'saveSettings':
                        await this.saveSettings(message.settings);
                        break;
                    case 'getSettings':
                        await this.sendCurrentSettings();
                        break;
                    // saveCerebrasApiKey will be handled by the main extension message listener
                }
            },
            null,
            this.disposables
        );

        this.panel.onDidDispose(
            () => {
                SettingsView.currentPanel = undefined;
            },
            null,
            this.disposables
        );
    }

    public update(): void {
        this.panel.webview.html = this.getHtmlForWebview();
    }

    private async saveSettings(settings: any): Promise<void> {
        const config = vscode.workspace.getConfiguration('theFuse');
        
        // Remove undefined fields to avoid overwriting with undefined
        Object.keys(settings).forEach(key => {
            if (settings[key] === undefined) {
                delete settings[key];
            }
        });

        // Update each setting
        for (const [key, value] of Object.entries(settings)) {
            // Ensure cerebrasApiKey is not saved here as it's handled by vscode.secrets
            if (key !== 'cerebrasApiKey') {
                 await config.update(key, value, vscode.ConfigurationTarget.Global);
            }
        }

        vscode.window.showInformationMessage('Settings saved successfully!');
    }

    private async sendCurrentSettings(): Promise<void> {
        const config = vscode.workspace.getConfiguration('theFuse');
        const settings = {
            // Add your settings keys here
            apiKey: config.get('apiKey'),
            modelName: config.get('modelName'),
            temperature: config.get('temperature'),
            maxTokens: config.get('maxTokens'),
            enableCompletions: config.get('enableCompletions')
            // Information about whether cerebrasApiKey is set would come from the extension
            // after checking vscode.secrets, not directly from config here.
        };

        this.panel.webview.postMessage({
            command: 'settingsUpdate',
            settings
        });
    }

    protected getHtmlForWebview(): string {
        const nonce = this.getNonce();

        // Get local resource URIs
        const scriptUri = this.getWebviewUri('media/js/settings-view.js');
        // Assuming css files are in media/css relative to extensionUri
        const styleResetUri = this.getWebviewUri('media/css/reset.css');
        const styleVSCodeUri = this.getWebviewUri('media/css/vscode.css');
        const styleMainUri = this.getWebviewUri('media/css/main.css');
        const styleFuseUri = this.getWebviewUri('media/css/fuse.css');


        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}' ${this.panel.webview.cspSource}; style-src ${this.panel.webview.cspSource} 'unsafe-inline';">
                <link href="${styleResetUri}" rel="stylesheet">
                <link href="${styleVSCodeUri}" rel="stylesheet">
                <link href="${styleMainUri}" rel="stylesheet">
                <link href="${styleFuseUri}" rel="stylesheet">
                <title>The New Fuse Settings</title>
                <style>
                    /* Add some basic styling for the new button if not covered by existing CSS */
                    .button-secondary {
                        background-color: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                        border: 1px solid var(--vscode-button-border, transparent);
                    }
                    .button-secondary:hover {
                        background-color: var(--vscode-button-secondaryHoverBackground);
                    }
                    .form-group {
                        margin-bottom: 15px;
                    }
                    label {
                        display: block;
                        margin-bottom: 5px;
                    }
                    input[type="text"], input[type="password"], input[type="number"] {
                        width: 100%;
                        padding: 8px;
                        box-sizing: border-box;
                        border: 1px solid var(--vscode-input-border);
                        background-color: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                    }
                    .button-primary {
                         margin-top: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>The New Fuse Settings</h1>
                    
                    <div class="form-group">
                        <label for="cerebrasApiKey">Cerebras API Key</label>
                        <input type="password" id="cerebrasApiKey" name="cerebrasApiKey" class="form-control">
                        <button type="button" id="saveCerebrasKeyButton" class="button-primary" style="margin-top: 5px;">Save Cerebras Key</button>
                    </div>
                    
                    <hr/>
                    <h2>Other Settings</h2>
                    <form id="settings-form">
                        <div class="form-group">
                            <label for="apiKey">Legacy API Key (Example)</label>
                            <input type="password" id="apiKey" name="apiKey" class="form-control">
                        </div>
                        <div class="form-group">
                            <label for="modelName">Model Name (Example)</label>
                            <input type="text" id="modelName" name="modelName" class="form-control">
                        </div>
                        <div class="form-group">
                            <label for="temperature">Temperature (Example)</label>
                            <input type="number" id="temperature" name="temperature" class="form-control" min="0" max="1" step="0.1">
                        </div>
                        <div class="form-group">
                            <label for="maxTokens">Max Tokens (Example)</label>
                            <input type="number" id="maxTokens" name="maxTokens" class="form-control" min="1">
                        </div>
                        <div class="form-group">
                            <label for="enableCompletions">Enable Completions (Example)</label>
                            <input type="checkbox" id="enableCompletions" name="enableCompletions" class="form-control">
                        </div>
                        <button type="submit" class="button-primary">Save Other Settings</button>
                    </form>
                </div>
                <script nonce="${nonce}">
                    // Ensure acquireVsCodeApi is available. It's typically provided by VS Code in webview environments.
                    // If settings-view.js initializes it, this script can use it.
                    // Otherwise, this might need to be more robust or ensure settings-view.js runs first and exposes it.
                    const vscodeApiInstance = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : undefined;

                    if (vscodeApiInstance) {
                        document.getElementById('saveCerebrasKeyButton').addEventListener('click', () => {
                            const apiKeyInput = document.getElementById('cerebrasApiKey');
                            if (apiKeyInput && apiKeyInput.value) {
                                vscodeApiInstance.postMessage({
                                    command: 'saveCerebrasApiKey',
                                    apiKey: apiKeyInput.value
                                });
                                // Optionally, provide user feedback e.g., clear field or show a temporary message.
                                // vscode.window.showInformationMessage is not available here.
                                // Post a message back to extension or update UI locally.
                                 apiKeyInput.value = ''; // Clear after attempting to save
                                 alert('Cerebras API Key sent to extension for saving.'); // Simple feedback
                            } else {
                                alert('Please enter a Cerebras API Key.');
                            }
                        });
                    } else {
                        console.error('acquireVsCodeApi is not available. Cerebras API Key saving might not work.');
                    }
                </script>
                <script nonce="${nonce}" src="${scriptUri}"></script> 
            </body>
            </html>`;
    }
}