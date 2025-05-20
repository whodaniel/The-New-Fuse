// filepath: /Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/src/vscode-extension/model-selector-panel.ts
import * as vscode from 'vscode';
import * as path from 'path';
import { LLMProviderManager, LLMProviderConfig } from './llm-provider-manager.js';
import { LLMProvider } from './lm-api-bridge.js';

/**
 * ModelSelectorPanel provides a WebView UI for selecting and configuring LLM models.
 */
export class ModelSelectorPanel {
    public static currentPanel: ModelSelectorPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private readonly _llmProviderManager: LLMProviderManager;

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        llmProviderManager: LLMProviderManager
    ) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._llmProviderManager = llmProviderManager;

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Update the content based on view changes
        this._panel.onDidChangeViewState(
            e => {
                if (this._panel.visible) {
                    this._update();
                }
            },
            null,
            this._disposables
        );

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            message => this._handleMessage(message),
            null,
            this._disposables
        );
    }

    /**
     * Creates and shows the model selector panel
     */
    public static createOrShow(
        extensionUri: vscode.Uri,
        llmProviderManager: LLMProviderManager
    ): ModelSelectorPanel {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it
        if (ModelSelectorPanel.currentPanel) {
            ModelSelectorPanel.currentPanel._panel.reveal(column);
            return ModelSelectorPanel.currentPanel;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            'modelSelector',
            'AI Model Selection',
            column || vscode.ViewColumn.One,
            {
                // Enable JavaScript in the webview
                enableScripts: true,
                // Restrict the webview to only load resources from the `media` directory
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media')
                ],
                retainContextWhenHidden: true
            }
        );

        ModelSelectorPanel.currentPanel = new ModelSelectorPanel(
            panel,
            extensionUri,
            llmProviderManager
        );

        return ModelSelectorPanel.currentPanel;
    }

    /**
     * Clean up resources
     */
    public dispose() {
        ModelSelectorPanel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    /**
     * Update the webview content
     */
    private async _update() {
        this._panel.title = 'AI Model Selection';
        this._panel.webview.html = await this._getHtmlForWebview();
    }

    /**
     * Handle messages from the webview
     */
    private _handleMessage(message: any) {
        switch (message.command) {
            case 'selectModel':
                // Select the model
                this._llmProviderManager.selectProvider(message.providerId);
                break;
            case 'addCustomModel':
                // Add a custom model
                this._addCustomProvider(message.modelConfig);
                break;
            case 'setDefaultModel':
                // Set default model
                this._setDefaultProvider(message.providerId);
                break;
            case 'deleteCustomModel':
                // Delete custom model
                this._deleteCustomProvider(message.providerId);
                break;
            case 'refreshModels':
                // Refresh the model list
                this._update();
                break;
            case 'configureApiKey':
                // Configure API key for a provider
                this._configureApiKey(message.providerId, message.apiKey);
                break;
        }
    }

    /**
     * Add a custom provider
     */
    private async _addCustomProvider(modelConfig: any) {
        try {
            const provider: LLMProviderConfig = {
                id: `custom-${Date.now()}`,
                name: modelConfig.name,
                provider: modelConfig.provider as LLMProvider,
                modelName: modelConfig.modelName,
                apiKey: modelConfig.apiKey,
                apiEndpoint: modelConfig.apiEndpoint,
                isCustom: true,
                isBuiltin: false
            };

            this._llmProviderManager.registerProvider(provider);
            
            // Update the UI
            this._update();
            
            vscode.window.showInformationMessage(`Added custom model: ${provider.name}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to add custom model: ${error}`);
        }
    }

    /**
     * Set a provider as default
     */
    private _setDefaultProvider(providerId: string) {
        // Get all providers
        const allProviders = this._llmProviderManager.getAllProviders();
        
        // Update isDefault flag for all providers
        for (const provider of allProviders) {
            const updatedProvider = { ...provider, isDefault: provider.id === providerId };
            this._llmProviderManager.registerProvider(updatedProvider);
        }
        
        // Select the provider
        this._llmProviderManager.selectProvider(providerId);
        
        // Update the UI
        this._update();
    }

    /**
     * Delete a custom provider
     */
    private _deleteCustomProvider(providerId: string) {
        this._llmProviderManager.removeProvider(providerId);
        
        // Update the UI
        this._update();
    }

    /**
     * Configure API key for a provider
     */
    private async _configureApiKey(providerId: string, apiKey: string) {
        const provider = this._llmProviderManager.getProvider(providerId);
        if (provider) {
            const updatedProvider = { ...provider, apiKey };
            this._llmProviderManager.registerProvider(updatedProvider);
            
            vscode.window.showInformationMessage(`API key updated for ${provider.name}`);
            
            // Update the UI
            this._update();
        }
    }

    /**
     * Get the HTML content for the webview
     */
    private async _getHtmlForWebview(): Promise<string> {
        // Get all providers
        const allProviders = this._llmProviderManager.getAllProviders();
        const selectedProvider = this._llmProviderManager.getSelectedProvider();

        // Create a script to pass the model data to the webview
        const providersScript = `
            const allProviders = ${JSON.stringify(allProviders)};
            const selectedProviderId = ${JSON.stringify(selectedProvider?.id)};
        `;

        // Get the webview URI for loading styles and scripts
        const styleUri = this._panel.webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'model-selector.css')
        );

        // Create the HTML content
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AI Model Selection</title>
            <style>
                body {
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    font-family: var(--vscode-font-family);
                    padding: 20px;
                }
                .model-card {
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    padding: 12px;
                    margin-bottom: 16px;
                    position: relative;
                    background-color: var(--vscode-editor-background);
                    transition: background-color 0.2s;
                }
                .model-card:hover {
                    background-color: var(--vscode-list-hoverBackground);
                }
                .model-card.selected {
                    background-color: var(--vscode-list-activeSelectionBackground);
                    color: var(--vscode-list-activeSelectionForeground);
                    border: 2px solid var(--vscode-focusBorder);
                }
                .model-name {
                    font-size: 14px;
                    font-weight: bold;
                }
                .model-details {
                    font-size: 12px;
                    margin-top: 6px;
                    color: var(--vscode-descriptionForeground);
                }
                .model-provider {
                    display: inline-block;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 10px;
                    margin-right: 6px;
                    background-color: var(--vscode-badge-background);
                    color: var(--vscode-badge-foreground);
                }
                .model-actions {
                    position: absolute;
                    right: 12px;
                    top: 12px;
                }
                .default-badge {
                    background-color: var(--vscode-statusBarItem-prominentBackground);
                    color: var(--vscode-statusBarItem-prominentForeground);
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 10px;
                    margin-left: 6px;
                }
                button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 4px 8px;
                    border-radius: 2px;
                    cursor: pointer;
                    font-size: 12px;
                    margin-left: 6px;
                }
                button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                .section-header {
                    font-size: 16px;
                    font-weight: bold;
                    margin-top: 24px;
                    margin-bottom: 12px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding-bottom: 6px;
                }
                .add-model-form {
                    margin-top: 24px;
                }
                .form-row {
                    margin-bottom: 12px;
                }
                label {
                    display: block;
                    margin-bottom: 4px;
                    font-size: 12px;
                }
                input, select {
                    width: 100%;
                    padding: 6px 8px;
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 2px;
                }
            </style>
        </head>
        <body>
            <h1>AI Model Selection</h1>
            
            <div class="section-header">Available Models</div>
            <div id="model-list">
                <!-- Model cards will be generated here -->
            </div>
            
            <div class="section-header">Add Custom Model</div>
            <div class="add-model-form">
                <div class="form-row">
                    <label for="model-name">Model Name</label>
                    <input type="text" id="model-name" placeholder="My Custom Model">
                </div>
                
                <div class="form-row">
                    <label for="model-provider">Provider</label>
                    <select id="model-provider">
                        <option value="OpenAI">OpenAI</option>
                        <option value="Anthropic">Anthropic</option>
                        <option value="Cohere">Cohere</option>
                        <option value="HuggingFace">Hugging Face</option>
                        <option value="Custom">Custom Provider</option>
                    </select>
                </div>
                
                <div class="form-row">
                    <label for="model-id">Model ID</label>
                    <input type="text" id="model-id" placeholder="gpt-4, claude-3-opus-20240229, etc.">
                </div>
                
                <div class="form-row">
                    <label for="api-key">API Key</label>
                    <input type="password" id="api-key" placeholder="API Key for authentication">
                </div>
                
                <div class="form-row">
                    <label for="api-endpoint">API Endpoint (Optional)</label>
                    <input type="text" id="api-endpoint" placeholder="https://api.example.com/v1">
                </div>
                
                <button id="add-model-btn">Add Model</button>
            </div>

            <script>
                (function() {
                    // Initialize with data from extension
                    ${providersScript}
                    
                    // VSCode API for messaging
                    const vscode = acquireVsCodeApi();
                    
                    // Render the model list
                    function renderModelList() {
                        const modelList = document.getElementById('model-list');
                        modelList.innerHTML = '';
                        
                        allProviders.forEach(provider => {
                            const isSelected = provider.id === selectedProviderId;
                            const isDefault = provider.isDefault;
                            const isCustom = provider.isCustom;
                            
                            const card = document.createElement('div');
                            card.className = \`model-card \${isSelected ? 'selected' : ''}\`;
                            card.dataset.id = provider.id;
                            
                            let providerLabel = '';
                            switch(provider.provider) {
                                case 'OpenAI': 
                                    providerLabel = 'OpenAI'; 
                                    break;
                                case 'Anthropic': 
                                    providerLabel = 'Anthropic'; 
                                    break;
                                case 'VSCode': 
                                    providerLabel = 'VS Code'; 
                                    break;
                                default: 
                                    providerLabel = provider.provider;
                            }
                            
                            card.innerHTML = \`
                                <div class="model-name">
                                    \${provider.name}
                                    \${isDefault ? '<span class="default-badge">Default</span>' : ''}
                                </div>
                                <div class="model-details">
                                    <span class="model-provider">\${providerLabel}</span>
                                    <span class="model-id">\${provider.modelName}</span>
                                </div>
                                <div class="model-actions">
                                    \${isSelected ? '' : '<button class="select-btn">Select</button>'}
                                    \${!isDefault ? '<button class="set-default-btn">Set Default</button>' : ''}
                                    \${provider.provider === 'OpenAI' || provider.provider === 'Anthropic' ? 
                                        '<button class="configure-api-btn">API Key</button>' : ''}
                                    \${isCustom ? '<button class="delete-btn">Delete</button>' : ''}
                                </div>
                            \`;
                            
                            // Add click handler for select button
                            const selectBtn = card.querySelector('.select-btn');
                            if (selectBtn) {
                                selectBtn.addEventListener('click', () => {
                                    vscode.postMessage({
                                        command: 'selectModel',
                                        providerId: provider.id
                                    });
                                });
                            }
                            
                            // Add click handler for set default button
                            const setDefaultBtn = card.querySelector('.set-default-btn');
                            if (setDefaultBtn) {
                                setDefaultBtn.addEventListener('click', () => {
                                    vscode.postMessage({
                                        command: 'setDefaultModel',
                                        providerId: provider.id
                                    });
                                });
                            }
                            
                            // Add click handler for configure API key button
                            const configureApiBtn = card.querySelector('.configure-api-btn');
                            if (configureApiBtn) {
                                configureApiBtn.addEventListener('click', () => {
                                    const apiKey = prompt('Enter API key for ' + provider.name + ':');
                                    if (apiKey) {
                                        vscode.postMessage({
                                            command: 'configureApiKey',
                                            providerId: provider.id,
                                            apiKey
                                        });
                                    }
                                });
                            }
                            
                            // Add click handler for delete button
                            const deleteBtn = card.querySelector('.delete-btn');
                            if (deleteBtn) {
                                deleteBtn.addEventListener('click', () => {
                                    if (confirm('Are you sure you want to delete ' + provider.name + '?')) {
                                        vscode.postMessage({
                                            command: 'deleteCustomModel',
                                            providerId: provider.id
                                        });
                                    }
                                });
                            }
                            
                            modelList.appendChild(card);
                        });
                    }
                    
                    // Add model form handler
                    document.getElementById('add-model-btn').addEventListener('click', () => {
                        const name = document.getElementById('model-name').value;
                        const provider = document.getElementById('model-provider').value;
                        const modelName = document.getElementById('model-id').value;
                        const apiKey = document.getElementById('api-key').value;
                        const apiEndpoint = document.getElementById('api-endpoint').value;
                        
                        if (!name || !provider || !modelName) {
                            alert('Please fill in all required fields');
                            return;
                        }
                        
                        vscode.postMessage({
                            command: 'addCustomModel',
                            modelConfig: {
                                name,
                                provider,
                                modelName,
                                apiKey,
                                apiEndpoint
                            }
                        });
                        
                        // Clear form
                        document.getElementById('model-name').value = '';
                        document.getElementById('model-id').value = '';
                        document.getElementById('api-key').value = '';
                        document.getElementById('api-endpoint').value = '';
                    });
                    
                    // Render initial model list
                    renderModelList();
                })();
            </script>
        </body>
        </html>`;
    }
}