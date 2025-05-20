import * as vscode from 'vscode';
import { BaseWebView } from './base-webview.js';
/**
 * ModelSelector provides a user-friendly interface for selecting LLM providers and models.
 * This webview panel allows users to:
 * - Switch between different AI providers (OpenAI, Anthropic, etc.)
 * - Select specific models for each provider
 * - View and adjust model parameters
 */
export declare class ModelSelector extends BaseWebView {
    private static instance;
    private static readonly viewType;
    private currentProviderId;
    private currentModelId;
    private constructor();
    /**
     * Creates or shows the ModelSelector panel
     */
    static createOrShow(extensionUri: vscode.Uri): ModelSelector;
    /**
     * Updates the webview content with the latest provider and model information
     */
    private updateContent;
    /**
     * Generates the HTML for the webview
     */
    protected getHtmlForWebview(providers?: any[], currentProvider?: any, currentModel?: string): string;
}
//# sourceMappingURL=model-selector.d.ts.map