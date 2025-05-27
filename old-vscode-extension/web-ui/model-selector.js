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
exports.ModelSelector = void 0;
const vscode = __importStar(require("vscode"));
const base_webview_1 = require("./base-webview");
/**
 * ModelSelector provides a user-friendly interface for selecting LLM providers and models.
 * This webview panel allows users to:
 * - Switch between different AI providers (OpenAI, Anthropic, etc.)
 * - Select specific models for each provider
 * - View and adjust model parameters
 */
class ModelSelector extends base_webview_1.BaseWebView {
    constructor(panel, extensionUri) {
        super(panel, extensionUri);
        // Set initial content
        this.updateContent();
        // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'selectProvider':
                    await vscode.commands.executeCommand('thefuse.selectProvider', message.providerId);
                    this.currentProviderId = message.providerId;
                    this.updateContent();
                    break;
                case 'selectModel':
                    await vscode.commands.executeCommand('thefuse.selectModel', this.currentProviderId, message.modelId);
                    this.currentModelId = message.modelId;
                    vscode.window.showInformationMessage(`Model set to ${message.modelId}`);
                    break;
                case 'refreshProviders':
                    await vscode.commands.executeCommand('thefuse.refreshLLMProviders');
                    this.updateContent();
                    break;
                case 'configureProvider':
                    vscode.commands.executeCommand('thefuse.openSettings');
                    break;
            }
        }, undefined, this.disposables);
    }
    /**
     * Creates or shows the ModelSelector panel
     */
    static createOrShow(extensionUri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        // If we already have a panel, show it
        if (ModelSelector.instance) {
            ModelSelector.instance.panel.reveal(column);
            return ModelSelector.instance;
        }
        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(ModelSelector.viewType, 'Select AI Model', column || vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'web-ui')]
        });
        ModelSelector.instance = new ModelSelector(panel, extensionUri);
        // Reset the instance when the panel is closed
        panel.onDidDispose(() => {
            ModelSelector.instance = undefined;
        }, null, ModelSelector.instance.disposables);
        return ModelSelector.instance;
    }
    /**
     * Updates the webview content with the latest provider and model information
     */
    async updateContent() {
        try {
            // Get provider and model information
            const providers = await vscode.commands.executeCommand('thefuse.getProviders');
            const currentProvider = await vscode.commands.executeCommand('thefuse.getCurrentProvider');
            const currentModel = await vscode.commands.executeCommand('thefuse.getCurrentModel');
            // Update current selections
            this.currentProviderId = currentProvider?.id;
            this.currentModelId = currentModel;
            // Update the webview content
            this.panel.webview.html = this.getHtmlForWebview(providers, currentProvider, currentModel);
        }
        catch (error) {
            vscode.window.showErrorMessage('Failed to update model selector: ' + error);
        }
    }
    /**
     * Generates the HTML for the webview
     */
    getHtmlForWebview(providers = [], currentProvider = null, currentModel = '') {
        // Get a nonce to use for script CSP
        const nonce = this.getNonce();
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
            <title>Select AI Model</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-foreground);
                    padding: 20px;
                }
                h1 {
                    font-size: 1.5em;
                    margin-bottom: 20px;
                    font-weight: normal;
                }
                .container {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .section {
                    background-color: var(--vscode-editor-background);
                    border-radius: 6px;
                    padding: 15px;
                    border: 1px solid var(--vscode-panel-border);
                }
                .section-title {
                    font-size: 1.2em;
                    margin-top: 0;
                    margin-bottom: 15px;
                    font-weight: normal;
                }
                .provider-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-bottom: 20px;
                }
                .provider-card {
                    flex: 1 1 200px;
                    padding: 12px;
                    border-radius: 4px;
                    border: 1px solid var(--vscode-panel-border);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                }
                .provider-card:hover {
                    background-color: var(--vscode-list-hoverBackground);
                }
                .provider-card.selected {
                    background-color: var(--vscode-list-activeSelectionBackground);
                    color: var(--vscode-list-activeSelectionForeground);
                    border-color: var(--vscode-focusBorder);
                }
                .provider-icon {
                    font-size: 24px;
                    margin-bottom: 8px;
                }
                .model-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    max-height: 300px;
                    overflow-y: auto;
                }
                .model-item {
                    padding: 8px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .model-item:hover {
                    background-color: var(--vscode-list-hoverBackground);
                }
                .model-item.selected {
                    background-color: var(--vscode-list-activeSelectionBackground);
                    color: var(--vscode-list-activeSelectionForeground);
                }
                .model-name {
                    flex: 1;
                }
                .model-info {
                    font-size: 0.9em;
                    color: var(--vscode-descriptionForeground);
                }
                .button-row {
                    display: flex;
                    gap: 10px;
                    margin-top: 15px;
                }
                button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 6px 12px;
                    border-radius: 2px;
                    cursor: pointer;
                }
                button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                button.secondary {
                    background-color: transparent;
                    border: 1px solid var(--vscode-button-background);
                    color: var(--vscode-button-background);
                }
                .no-providers {
                    padding: 20px;
                    text-align: center;
                    color: var(--vscode-descriptionForeground);
                }
                .spinner {
                    border: 4px solid rgba(0, 0, 0, 0.1);
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    border-left-color: var(--vscode-button-background);
                    animation: spin 1s linear infinite;
                    display: inline-block;
                    margin-right: 10px;
                    vertical-align: middle;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        </head>
        <body>
            <h1>Select AI Model</h1>
            
            <div class="container">
                <div class="section">
                    <h2 class="section-title">Step 1: Select Provider</h2>
                    
                    ${providers.length > 0 ? `
                        <div class="provider-list">
                            ${providers.map(provider => `
                                <div class="provider-card ${provider.id === currentProvider?.id ? 'selected' : ''}" 
                                     data-provider-id="${provider.id}">
                                    <div class="provider-icon">${getProviderIcon(provider.name)}</div>
                                    <div>${provider.name}</div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="no-providers">
                            <p>No AI providers configured.</p>
                            <p>Click the button below to set up your API keys.</p>
                        </div>
                    `}
                    
                    <div class="button-row">
                        <button id="configureBtn">Configure API Keys</button>
                        <button id="refreshBtn" class="secondary">Refresh Providers</button>
                    </div>
                </div>
                
                ${currentProvider ? `
                    <div class="section">
                        <h2 class="section-title">Step 2: Select Model</h2>
                        <div id="modelSelector">
                            <div class="model-list">
                                ${currentProvider.models ? currentProvider.models.map(model => `
                                    <div class="model-item ${model === currentModel ? 'selected' : ''}"
                                         data-model-id="${model}">
                                        <div class="model-name">${model}</div>
                                        ${model === currentModel ? '<div class="model-info">Current</div>' : ''}
                                    </div>
                                `).join('') : '<p>Loading models...</p>'}
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <script nonce="${nonce}">
                const vscode = acquireVsCodeApi();
                
                // Handle provider selection
                document.querySelectorAll('.provider-card').forEach(card => {
                    card.addEventListener('click', () => {
                        const providerId = card.getAttribute('data-provider-id');
                        vscode.postMessage({
                            command: 'selectProvider',
                            providerId
                        });
                    });
                });
                
                // Handle model selection
                document.querySelectorAll('.model-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const modelId = item.getAttribute('data-model-id');
                        vscode.postMessage({
                            command: 'selectModel',
                            modelId
                        });
                    });
                });
                
                // Handle button clicks
                document.getElementById('configureBtn').addEventListener('click', () => {
                    vscode.postMessage({
                        command: 'configureProvider'
                    });
                });
                
                document.getElementById('refreshBtn').addEventListener('click', () => {
                    vscode.postMessage({
                        command: 'refreshProviders'
                    });
                });
            </script>
        </body>
        </html>`;
    }
}
exports.ModelSelector = ModelSelector;
ModelSelector.viewType = 'fuseModelSelector';
/**
 * Returns an emoji icon for a provider name
 */
function getProviderIcon(providerName) {
    const name = providerName.toLowerCase();
    if (name.includes('openai') || name.includes('gpt')) {
        return '🔄'; // OpenAI
    }
    else if (name.includes('anthropic') || name.includes('claude')) {
        return '🧠'; // Anthropic/Claude
    }
    else if (name.includes('gemini') || name.includes('google')) {
        return '💎'; // Gemini/Google
    }
    else if (name.includes('llama') || name.includes('meta')) {
        return '🦙'; // LLaMa/Meta
    }
    else if (name.includes('mistral')) {
        return '💨'; // Mistral
    }
    else if (name.includes('azure')) {
        return '☁️'; // Azure
    }
    else if (name.includes('local')) {
        return '💻'; // Local
    }
    return '🤖'; // Default
}
//# sourceMappingURL=model-selector.js.map