import * as vscode from 'vscode';

/**
 * ModelSelector React Component for AI model selection
 */
export class ModelSelectorPanel {
  public static currentPanel: ModelSelectorPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (ModelSelectorPanel.currentPanel) {
      ModelSelectorPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      'modelSelector',
      'AI Model Selection',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'media'),
          vscode.Uri.joinPath(extensionUri, 'out') // For the compiled React script
        ]
      }
    );

    ModelSelectorPanel.currentPanel = new ModelSelectorPanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Update the content based on view changes
    this._panel.onDidChangeViewState(
      _e => {
        if (this._panel.visible) {
          this._update();
        }
      },
      null,
      this._disposables
    );

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      async message => {
        switch (message.command) {
          case 'selectProvider':
            await this._handleProviderSelection(message.providerId);
            break;
          case 'selectModel':
            await this._handleModelSelection(message.providerId, message.modelId);
            break;
          case 'saveApiKey': // This message comes from model-selector-react.tsx
            // The extension host (extension.ts) should listen for this message
            // and use context.secrets.store. This panel doesn't store it directly.
            // The task specifies that the extension host will handle this.
            // vscode.commands.executeCommand('thefuse.saveProviderApiKey', message.providerId, message.apiKey);
            break;
          case 'loadProviders':
            await this._loadProviders();
            break;
          case 'getModelsForProvider': // New message from webview to request models
            const models = await this._fetchModels(message.providerId);
            this._panel.webview.postMessage({
                command: 'updateModels',
                providerId: message.providerId,
                models
            });
            break;
        }
      },
      null,
      this._disposables
    );
  }

  public dispose() {
    ModelSelectorPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private async _loadProviders() {
    try {
      const providers = await this._fetchProviders();
      this._panel.webview.postMessage({
        command: 'updateProviders',
        providers
      });
    } catch (error) {
      this._panel.webview.postMessage({
        command: 'showError',
        message: `Error loading providers: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  private async _handleProviderSelection(_providerId: string) {
    try {
      // The webview will now send 'getModelsForProvider' when a provider is selected.
      // So, this method might not need to directly call _fetchModels anymore if
      // the React component handles the 'getModelsForProvider' message posting.
      // However, if we want to pre-load models upon provider selection from here, it can stay.
      // For this task, the React component will request models.
      // So, we can just acknowledge the provider selection or update config if needed.
      // await vscode.workspace.getConfiguration('theFuse.ai').update('selectedProvider', providerId, true);
      // The React component will send a 'getModelsForProvider' message.
    } catch (error) {
      this._panel.webview.postMessage({
        command: 'showError',
        message: `Error processing provider selection: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  private async _handleModelSelection(providerId: string, modelId: string) {
    try {
      // Update the global configuration with the selected provider and model
      await vscode.workspace.getConfiguration('theFuse.ai').update('selectedProvider', providerId, vscode.ConfigurationTarget.Global);
      await vscode.workspace.getConfiguration('theFuse.ai').update('selectedModel', modelId, vscode.ConfigurationTarget.Global);
      
      vscode.window.showInformationMessage(`Selected model: ${modelId} from provider: ${providerId}`);
      this.dispose(); // Close panel after selection
    } catch (error) {
      this._panel.webview.postMessage({
        command: 'showError',
        message: `Error selecting model: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  private async _fetchProviders(): Promise<any[]> {
    // This should ideally call a method in LLMProviderManager in extension.ts
    // For now, it's hardcoded as per the existing structure.
    return [
      {
        id: 'openai',
        name: 'OpenAI',
        requiresApiKey: true,
        description: 'Access to GPT models from OpenAI'
      },
      {
        id: 'anthropic',
        name: 'Anthropic',
        requiresApiKey: true,
        description: 'Access to Claude models from Anthropic'
      },
      {
        id: 'cerebras',
        name: 'Cerebras',
        requiresApiKey: true, // Cerebras requires an API key
        description: 'Access to models from Cerebras'
      },
      {
        id: 'local', // Example: Ollama
        name: 'Local Models (Ollama)',
        requiresApiKey: false,
        description: 'Run local AI models via Ollama'
      }
    ];
  }

  private async _fetchModels(providerId: string): Promise<any[]> {
    // This should ideally call LLMProviderManager.getModelsForProvider(providerId) in extension.ts
    // which would delegate to CerebrasProvider.getAvailableModels() for 'cerebras'
    // For now, it's hardcoded.
    switch (providerId) {
      case 'openai':
        return [
          { id: 'gpt-4o', name: 'GPT-4o', description: 'Most advanced model with vision capabilities' },
          { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Fast and powerful model with extended context' },
        ];
      case 'anthropic':
        return [
          { id: 'claude-3-opus', name: 'Claude 3 Opus', description: 'Most capable Claude model' },
          { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Balanced performance and efficiency' },
        ];
      case 'cerebras':
        // These are placeholders. Actual models would be fetched from CerebrasProvider.
        // The task states CerebrasProvider.getAvailableModels() is hardcoded for now.
        return [
          { id: 'CGPT-13B', name: 'Cerebras-GPT-13B', description: 'A 13 billion parameter Cerebras model' },
          { id: 'CGPT-6.7B', name: 'Cerebras-GPT-6.7B', description: 'A 6.7 billion parameter Cerebras model' },
          { id: 'CGPT-2.7B', name: 'Cerebras-GPT-2.7B', description: 'A 2.7 billion parameter Cerebras model' },
          // Add other hardcoded models if known
        ];
      case 'local':
        return [
          { id: 'llama3', name: 'Llama 3', description: 'Locally run Llama 3 model' },
          { id: 'mistral', name: 'Mistral', description: 'Locally run Mistral model' },
        ];
      default:
        return [];
    }
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.title = "AI Model Selection";
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const nonce = this._getNonce();
    
    const scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'out', 'model-selector-react.js');
    const scriptUri = webview.asWebviewUri(scriptPathOnDisk);
    
    // Get URIs for CSS files
    const resetCssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'css', 'reset.css'));
    const vscodeCssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'css', 'vscode.css'));
    const mainCssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'css', 'main.css'));
    // Add any other specific CSS files if needed, e.g., fuse.css if it's used by this panel

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' ${scriptUri.toString()}; img-src ${webview.cspSource} https: data:;">
        <link href="${resetCssUri}" rel="stylesheet">
        <link href="${vscodeCssUri}" rel="stylesheet">
        <link href="${mainCssUri}" rel="stylesheet">
        <title>AI Model Selection</title>
        <style>
            /* Styles from the original model-selector.tsx, assuming they are still relevant */
            body {
                font-family: var(--vscode-font-family);
                color: var(--vscode-foreground);
                padding: 20px;
                background-color: var(--vscode-editor-background);
            }
            .container {
                display: flex;
                flex-direction: column;
                /* Consider removing fixed height to allow content to define height */
            }
            .header {
                margin-bottom: 20px;
            }
            .panel {
                border: 1px solid var(--vscode-panel-border, var(--vscode-contrastBorder, transparent));
                border-radius: 5px;
                padding: 15px;
                margin-bottom: 20px;
                background-color: var(--vscode-sideBar-background, var(--vscode-editorWidget-background));
            }
            .model-card {
                border: 1px solid var(--vscode-panel-border, var(--vscode-contrastBorder, transparent));
                border-radius: 3px;
                padding: 10px;
                margin-bottom: 10px;
                cursor: pointer;
                background-color: var(--vscode-list-inactiveSelectionBackground, var(--vscode-editor-background));
            }
            .model-card.selected {
                border-color: var(--vscode-focusBorder);
                background-color: var(--vscode-list-activeSelectionBackground);
                color: var(--vscode-list-activeSelectionForeground);
            }
            .model-card:hover {
                background-color: var(--vscode-list-hoverBackground);
            }
            .model-name {
                font-weight: bold;
            }
            .model-description {
                color: var(--vscode-descriptionForeground);
                font-size: 0.9em; /* Slightly smaller */
            }
            button {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: 1px solid var(--vscode-button-border, transparent);
                padding: 8px 12px;
                cursor: pointer;
                border-radius: 2px;
                margin-top: 5px; /* Added margin */
            }
            button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
            button:disabled {
                background-color: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
                cursor: not-allowed;
            }
            input[type="password"], input[type="text"] {
                width: calc(100% - 18px); /* Adjust for padding and border */
                padding: 8px;
                box-sizing: border-box;
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
                border-radius: 2px;
                margin-bottom: 10px;
            }
            .api-key-form {
                margin-top: 10px; /* Reduced margin */
            }
            #root {
                /* height: 100%; Removed fixed height */
            }
            .message {
                padding: 10px;
                margin: 10px 0;
                border-radius: 4px;
                border: 1px solid transparent;
            }
            .error-message {
                color: var(--vscode-errorForeground);
                background-color: var(--vscode-inputValidation-errorBackground, #5a1d1d);
                border-color: var(--vscode-inputValidation-errorBorder, var(--vscode-errorForeground));
            }
            .success-message {
                color: var(--vscode-terminal-ansiGreen); /* Check if this var exists or use a generic success color */
                background-color: var(--vscode-inputValidation-infoBackground, #1d5a1d); /* Example */
                border-color: var(--vscode-inputValidation-infoBorder, var(--vscode-terminal-ansiGreen)); /* Example */
            }
            .loading-message {
                color: var(--vscode-descriptionForeground);
            }
        </style>
    </head>
    <body>
        <div id="root"></div>
        <script nonce="${nonce}">
            // The acquireVsCodeApi function is available globally in the webview context.
            // The React component (model-selector-react.js) will call it.
        </script>
        <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
    </html>`;
  }
}