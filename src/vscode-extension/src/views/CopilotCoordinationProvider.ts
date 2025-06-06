import * as vscode from 'vscode';
import { CopilotInstanceCoordinator, CopilotInstance, CoordinationMessage } from '../copilot-coordination/CopilotInstanceCoordinator';

/**
 * Provides a webview for managing Copilot instance coordination
 */
export class CopilotCoordinationProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'theNewFuse.copilotCoordination';

    private _view?: vscode.WebviewView;
    private readonly _coordinator: CopilotInstanceCoordinator;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _context: vscode.ExtensionContext,
        coordinator: CopilotInstanceCoordinator
    ) {
        this._coordinator = coordinator;
        
        // Listen for coordination events
        this._coordinator.onInstanceRegistered(this._onInstanceRegistered.bind(this));
        this._coordinator.onInstanceDeregistered(this._onInstanceDeregistered.bind(this));
        this._coordinator.onMessageReceived(this._onMessageReceived.bind(this));
    }

    public resolveWebviewView(
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
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'startCoordination':
                    await this._coordinator.startCoordination();
                    this._updateView();
                    break;
                case 'stopCoordination':
                    await this._coordinator.stopCoordination();
                    this._updateView();
                    break;
                case 'shareContext':
                    await this._shareCurrentContext();
                    break;
                case 'requestSuggestion':
                    await this._requestSuggestion();
                    break;
                case 'refresh':
                    this._updateView();
                    break;
            }
        });

        this._updateView();
    }

    private async _shareCurrentContext() {
        try {
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                vscode.window.showWarningMessage('No active editor to share context from');
                return;
            }

            const context = {
                document: {
                    uri: activeEditor.document.uri.toString(),
                    languageId: activeEditor.document.languageId,
                    content: activeEditor.document.getText(),
                    selection: activeEditor.selection ? {
                        start: activeEditor.selection.start,
                        end: activeEditor.selection.end,
                        text: activeEditor.document.getText(activeEditor.selection)
                    } : undefined
                },
                workspace: vscode.workspace.workspaceFolders?.[0]?.uri.toString(),
                timestamp: new Date().toISOString()
            };

            await this._coordinator.shareContext(context);
            vscode.window.showInformationMessage('Context shared with other Copilot instances');
            this._updateView();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to share context: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private async _requestSuggestion() {
        try {
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                vscode.window.showWarningMessage('No active editor for suggestion request');
                return;
            }

            const request = {
                context: {
                    document: {
                        uri: activeEditor.document.uri.toString(),
                        languageId: activeEditor.document.languageId,
                        content: activeEditor.document.getText(),
                        selection: activeEditor.selection ? {
                            start: activeEditor.selection.start,
                            end: activeEditor.selection.end,
                            text: activeEditor.document.getText(activeEditor.selection)
                        } : undefined
                    },
                    workspace: vscode.workspace.workspaceFolders?.[0]?.uri.toString()
                },
                type: 'code_completion' as const,
                priority: 'normal' as const
            };

            const response = await this._coordinator.requestSuggestion(request);
            if (response?.suggestion) {
                // Show suggestion in a popup
                const action = await vscode.window.showInformationMessage(
                    `💡 Suggestion received from ${response.sourceInstance}`,
                    'Apply', 'View', 'Dismiss'
                );

                if (action === 'Apply' && activeEditor.selection) {
                    await activeEditor.edit(editBuilder => {
                        editBuilder.replace(activeEditor.selection, response.suggestion);
                    });
                } else if (action === 'View') {
                    // Show in a new document
                    const doc = await vscode.workspace.openTextDocument({
                        content: response.suggestion,
                        language: activeEditor.document.languageId
                    });
                    await vscode.window.showTextDocument(doc);
                }
            } else {
                vscode.window.showInformationMessage('No suggestions available from other Copilot instances');
            }
            this._updateView();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to request suggestion: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private _onInstanceRegistered(instance: CopilotInstance) {
        this._updateView();
        vscode.window.showInformationMessage(`🤖 Copilot instance registered: ${instance.type} (${instance.id})`);
    }

    private _onInstanceDeregistered(instanceId: string) {
        this._updateView();
        vscode.window.showInformationMessage(`🤖 Copilot instance deregistered: ${instanceId}`);
    }

    private _onMessageReceived(message: CoordinationMessage) {
        this._updateView();
        // Could show notifications for important messages
        if (message.type === 'suggestion_request') {
            // Maybe show a notification that another instance is requesting suggestions
        }
    }

    private _updateView() {
        if (this._view) {
            const instances = this._coordinator.getActiveInstances();
            const isActive = this._coordinator.isCoordinationActive();
            
            this._view.webview.postMessage({
                type: 'update',
                data: {
                    instances,
                    isActive,
                    timestamp: new Date().toISOString()
                }
            });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Copilot Coordination</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    margin: 0;
                    padding: 10px;
                }
                
                .header {
                    margin-bottom: 20px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding-bottom: 10px;
                }
                
                .status {
                    display: flex;
                    align-items: center;
                    margin-bottom: 15px;
                }
                
                .status-indicator {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    margin-right: 10px;
                }
                
                .status-active {
                    background-color: var(--vscode-charts-green);
                }
                
                .status-inactive {
                    background-color: var(--vscode-charts-red);
                }
                
                .controls {
                    margin-bottom: 20px;
                }
                
                .button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 16px;
                    margin: 4px 8px 4px 0;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 13px;
                }
                
                .button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                
                .button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .button-secondary {
                    background-color: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                }
                
                .instances {
                    margin-top: 20px;
                }
                
                .instance {
                    background-color: var(--vscode-list-inactiveSelectionBackground);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    padding: 10px;
                    margin-bottom: 8px;
                }
                
                .instance-header {
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                
                .instance-details {
                    font-size: 12px;
                    color: var(--vscode-descriptionForeground);
                }
                
                .no-instances {
                    text-align: center;
                    color: var(--vscode-descriptionForeground);
                    font-style: italic;
                    margin: 20px 0;
                }
                
                .timestamp {
                    font-size: 11px;
                    color: var(--vscode-descriptionForeground);
                    margin-top: 10px;
                    text-align: right;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h3>🤖 Copilot Coordination</h3>
                <div class="status">
                    <div id="statusIndicator" class="status-indicator status-inactive"></div>
                    <span id="statusText">Coordination Inactive</span>
                </div>
            </div>
            
            <div class="controls">
                <button id="startBtn" class="button">▶️ Start Coordination</button>
                <button id="stopBtn" class="button" disabled>⏹️ Stop Coordination</button>
                <button id="shareContextBtn" class="button button-secondary">📤 Share Context</button>
                <button id="requestSuggestionBtn" class="button button-secondary">💡 Request Suggestion</button>
                <button id="refreshBtn" class="button button-secondary">🔄 Refresh</button>
            </div>
            
            <div class="instances">
                <h4>Active Instances</h4>
                <div id="instancesList"></div>
            </div>
            
            <div id="timestamp" class="timestamp"></div>
            
            <script>
                const vscode = acquireVsCodeApi();
                
                // Button event listeners
                document.getElementById('startBtn').addEventListener('click', () => {
                    vscode.postMessage({type: 'startCoordination'});
                });
                
                document.getElementById('stopBtn').addEventListener('click', () => {
                    vscode.postMessage({type: 'stopCoordination'});
                });
                
                document.getElementById('shareContextBtn').addEventListener('click', () => {
                    vscode.postMessage({type: 'shareContext'});
                });
                
                document.getElementById('requestSuggestionBtn').addEventListener('click', () => {
                    vscode.postMessage({type: 'requestSuggestion'});
                });
                
                document.getElementById('refreshBtn').addEventListener('click', () => {
                    vscode.postMessage({type: 'refresh'});
                });
                
                // Handle messages from extension
                window.addEventListener('message', event => {
                    const message = event.data;
                    if (message.type === 'update') {
                        updateView(message.data);
                    }
                });
                
                function updateView(data) {
                    const {instances, isActive, timestamp} = data;
                    
                    // Update status
                    const statusIndicator = document.getElementById('statusIndicator');
                    const statusText = document.getElementById('statusText');
                    const startBtn = document.getElementById('startBtn');
                    const stopBtn = document.getElementById('stopBtn');
                    
                    if (isActive) {
                        statusIndicator.className = 'status-indicator status-active';
                        statusText.textContent = 'Coordination Active';
                        startBtn.disabled = true;
                        stopBtn.disabled = false;
                    } else {
                        statusIndicator.className = 'status-indicator status-inactive';
                        statusText.textContent = 'Coordination Inactive';
                        startBtn.disabled = false;
                        stopBtn.disabled = true;
                    }
                    
                    // Update instances list
                    const instancesList = document.getElementById('instancesList');
                    if (instances.length === 0) {
                        instancesList.innerHTML = '<div class="no-instances">No active instances detected</div>';
                    } else {
                        instancesList.innerHTML = instances.map(instance => \`
                            <div class="instance">
                                <div class="instance-header">\${instance.type} (\${instance.id})</div>
                                <div class="instance-details">
                                    <div>Capabilities: \${instance.capabilities.join(', ')}</div>
                                    <div>Last activity: \${new Date(instance.lastActivity).toLocaleTimeString()}</div>
                                </div>
                            </div>
                        \`).join('');
                    }
                    
                    // Update timestamp
                    document.getElementById('timestamp').textContent = 
                        \`Last updated: \${new Date(timestamp).toLocaleTimeString()}\`;
                }
            </script>
        </body>
        </html>`;
    }
}
