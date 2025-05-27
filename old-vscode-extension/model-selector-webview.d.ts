import * as vscode from 'vscode';
import { LLMProviderManager } from './llm-provider-manager.js';
/**
 * ModelSelectorWebView provides a UI for selecting AI models
 * with a more visual interface than the standard VS Code QuickPick
 */
export declare class ModelSelectorWebView {
    private static instance;
    private panel;
    private disposables;
    private llmManager;
    private context;
    private constructor();
    static getInstance(context: vscode.ExtensionContext, llmManager: LLMProviderManager): ModelSelectorWebView;
    show(): void;
    private updateModelList;
    private getWebviewContent;
}
//# sourceMappingURL=model-selector-webview.d.ts.map