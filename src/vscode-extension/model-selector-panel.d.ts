import * as vscode from 'vscode';
import { LLMProviderManager } from './llm-provider-manager.js';
/**
 * ModelSelectorPanel provides a WebView UI for selecting and configuring LLM models.
 */
export declare class ModelSelectorPanel {
    static currentPanel: ModelSelectorPanel | undefined;
    private readonly _panel;
    private readonly _extensionUri;
    private _disposables;
    private readonly _llmProviderManager;
    private constructor();
    /**
     * Creates and shows the model selector panel
     */
    static createOrShow(extensionUri: vscode.Uri, llmProviderManager: LLMProviderManager): ModelSelectorPanel;
    /**
     * Clean up resources
     */
    dispose(): void;
    /**
     * Update the webview content
     */
    private _update;
    /**
     * Handle messages from the webview
     */
    private _handleMessage;
    /**
     * Add a custom provider
     */
    private _addCustomProvider;
    /**
     * Set a provider as default
     */
    private _setDefaultProvider;
    /**
     * Delete a custom provider
     */
    private _deleteCustomProvider;
    /**
     * Configure API key for a provider
     */
    private _configureApiKey;
    /**
     * Get the HTML content for the webview
     */
    private _getHtmlForWebview;
}
//# sourceMappingURL=model-selector-panel.d.ts.map