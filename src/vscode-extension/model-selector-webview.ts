import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { LLMProviderManager } from './llm-provider-manager.js';
import { LLMProvider } from './src/types.js';

/**
 * ModelSelectorWebView provides a UI for selecting AI models
 * with a more visual interface than the standard VS Code QuickPick
 */
export class ModelSelectorWebView {
  private static instance: ModelSelectorWebView | undefined;
  private panel: vscode.WebviewPanel | undefined;
  private disposables: vscode.Disposable[] = [];
  private llmManager: LLMProviderManager;
  private context: vscode.ExtensionContext;

  private constructor(context: vscode.ExtensionContext, llmManager: LLMProviderManager) {
    this.context = context;
    this.llmManager = llmManager;
  }

  public static getInstance(context: vscode.ExtensionContext, llmManager: LLMProviderManager): ModelSelectorWebView {
    if (!ModelSelectorWebView.instance) {
      ModelSelectorWebView.instance = new ModelSelectorWebView(context, llmManager);
    }
    return ModelSelectorWebView.instance;
  }

  public show() {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Beside);
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'modelSelector',
      'AI Model Selection',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(this.context.extensionPath, 'resources'))
        ]
      }
    );

    this.panel.iconPath = vscode.Uri.file(path.join(this.context.extensionPath, 'resources', 'fusion-icon.png'));
    
    this.panel.webview.html = this.getWebviewContent();

    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'selectModel':
            this.llmManager.selectProvider(message.modelId);
            vscode.window.showInformationMessage(`Selected AI model: ${message.modelName}`);
            break;
          case 'addCustomModel':
            await this.llmManager.showAddCustomProviderQuickPick();
            this.updateModelList();
            break;
          case 'deleteModel':
            if (this.llmManager.removeProvider(message.modelId)) {
              vscode.window.showInformationMessage(`Removed AI model: ${message.modelName}`);
              this.updateModelList();
            }
            break;
          case 'setDefaultModel':
            // Set this model as default
            const providers = this.llmManager.getAllProviders();
            for (const provider of providers) {
              if (provider.id === message.modelId) {
                provider.isDefault = true;
              } else {
                provider.isDefault = false;
              }
            }
            this.llmManager.saveCustomProviders();
            this.updateModelList();
            vscode.window.showInformationMessage(`Set ${message.modelName} as default AI model`);
            break;
        }
      },
      undefined,
      this.disposables
    );

    this.panel.onDidDispose(
      () => {
        this.panel = undefined;
        while (this.disposables.length) {
          const disposable = this.disposables.pop();
          if (disposable) {
            disposable.dispose();
          }
        }
      },
      null,
      this.disposables
    );
    
    // Update when provider changes
    this.llmManager.onProviderChanged((providerId) => {
      if (this.panel) {
        this.updateModelList();
      }
    });
  }
  
  private updateModelList() {
    if (!this.panel) return;
    
    const providers = this.llmManager.getAllProviders();
    const selectedProvider = this.llmManager.getSelectedProvider();
    
    this.panel.webview.postMessage({
      command: 'updateModels',
      models: providers.map(provider => ({
        id: provider.id,
        name: provider.name,
        provider: provider.provider,
        modelName: provider.modelName,
        isDefault: provider.isDefault,
        isSelected: selectedProvider && provider.id === selectedProvider.id,
        isCustom: provider.isCustom,
        isBuiltin: provider.isBuiltin
      }))
    });
  }

  private getWebviewContent() {
    const providers = this.llmManager.getAllProviders();
    const selectedProvider = this.llmManager.getSelectedProvider();
    
    // Get the models as JSON string for the initial state
    const modelsJson = JSON.stringify(providers.map(provider => ({
      id: provider.id,
      name: provider.name,
      provider: provider.provider,
      modelName: provider.modelName,
      isDefault: provider.isDefault,
      isSelected: selectedProvider && provider.id === selectedProvider.id,
      isCustom: provider.isCustom,
      isBuiltin: provider.isBuiltin
    })));

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI Model Selection</title>
        <style>
            body {
                font-family: var(--vscode-font-family);
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
                padding: 20px;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
            }
            .header {
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            .model-list {
                display: grid;
                grid-template-columns: 1fr;
                gap: 10px;
                margin-bottom: 20px;
            }
            .model-card {
                border: 1px solid var(--vscode-panel-border);
                border-radius: 5px;
                padding: 15px;
                display: flex;
                flex-direction: column;
                gap: 8px;
                position: relative;
                transition: background-color 0.2s;
            }
            .model-card:hover {
                background-color: var(--vscode-list-hoverBackground);
            }
            .model-card.selected {
                background-color: var(--vscode-list-activeSelectionBackground);
                color: var(--vscode-list-activeSelectionForeground);
            }
            .model-title {
                font-weight: bold;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            .model-provider {
                font-size: 14px;
                opacity: 0.8;
            }
            .model-actions {
                display: flex;
                gap: 8px;
                margin-top: 8px;
            }
            .btn {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 6px 12px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 12px;
            }
            .btn:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
            .btn-danger {
                background-color: var(--vscode-errorForeground);
            }
            .badge {
                font-size: 11px;
                padding: 2px 6px;
                border-radius: 10px;
                background-color: var(--vscode-badge-background);
                color: var(--vscode-badge-foreground);
                margin-left: 8px;
            }
            .add-model {
                margin-top: 20px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>AI Model Selection</h1>
            </div>
            
            <div class="model-list" id="modelList"></div>
            
            <div class="add-model">
                <button class="btn" id="addModelBtn">+ Add Custom Model</button>
            </div>
        </div>

        <script>
            (function() {
                const vscode = acquireVsCodeApi();
                let models = ${modelsJson};
                
                // Initial render
                renderModels();
                
                // Listen for messages from the extension
                window.addEventListener('message', event => {
                    const message = event.data;
                    
                    switch (message.command) {
                        case 'updateModels':
                            models = message.models;
                            renderModels();
                            break;
                    }
                });
                
                // Add event listener for add model button
                document.getElementById('addModelBtn').addEventListener('click', () => {
                    vscode.postMessage({
                        command: 'addCustomModel'
                    });
                });
                
                function renderModels() {
                    const modelList = document.getElementById('modelList');
                    modelList.innerHTML = '';
                    
                    models.forEach(model => {
                        const card = document.createElement('div');
                        card.className = 'model-card' + (model.isSelected ? ' selected' : '');
                        
                        const title = document.createElement('div');
                        title.className = 'model-title';
                        title.innerHTML = model.name;
                        
                        // Add badges
                        if (model.isDefault) {
                            const badge = document.createElement('span');
                            badge.className = 'badge';
                            badge.textContent = 'Default';
                            title.appendChild(badge);
                        }
                        
                        if (model.isSelected) {
                            const badge = document.createElement('span');
                            badge.className = 'badge';
                            badge.textContent = 'Selected';
                            title.appendChild(badge);
                        }
                        
                        const provider = document.createElement('div');
                        provider.className = 'model-provider';
                        provider.textContent = \`Provider: \${model.provider}, Model: \${model.modelName}\`;
                        
                        const actions = document.createElement('div');
                        actions.className = 'model-actions';
                        
                        if (!model.isSelected) {
                            const selectBtn = document.createElement('button');
                            selectBtn.className = 'btn';
                            selectBtn.textContent = 'Select';
                            selectBtn.addEventListener('click', () => {
                                vscode.postMessage({
                                    command: 'selectModel',
                                    modelId: model.id,
                                    modelName: model.name
                                });
                            });
                            actions.appendChild(selectBtn);
                        }
                        
                        if (!model.isDefault) {
                            const defaultBtn = document.createElement('button');
                            defaultBtn.className = 'btn';
                            defaultBtn.textContent = 'Set as Default';
                            defaultBtn.addEventListener('click', () => {
                                vscode.postMessage({
                                    command: 'setDefaultModel',
                                    modelId: model.id,
                                    modelName: model.name
                                });
                            });
                            actions.appendChild(defaultBtn);
                        }
                        
                        if (model.isCustom) {
                            const deleteBtn = document.createElement('button');
                            deleteBtn.className = 'btn btn-danger';
                            deleteBtn.textContent = 'Delete';
                            deleteBtn.addEventListener('click', () => {
                                vscode.postMessage({
                                    command: 'deleteModel',
                                    modelId: model.id,
                                    modelName: model.name
                                });
                            });
                            actions.appendChild(deleteBtn);
                        }
                        
                        card.appendChild(title);
                        card.appendChild(provider);
                        card.appendChild(actions);
                        modelList.appendChild(card);
                    });
                }
            }());
        </script>
    </body>
    </html>`;
  }
}