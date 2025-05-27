import * as vscode from 'vscode';
import { LLMProviderManager } from '../llm-provider-manager.js';
/**
 * Interface for inline completion items
 */
export interface InlineCompletion {
    text: string;
    range?: {
        startLine: number;
        startCharacter: number;
        endLine: number;
        endCharacter: number;
    };
}
/**
 * Interface for panel completion solutions
 */
export interface PanelSolution {
    code: string;
    score: number;
}
/**
 * Service that provides code completions functionality
 */
export declare class CompletionsProvider {
    private llmProviderManager;
    private logger;
    private worker;
    private nodeWorker;
    private isNode;
    private pendingRequests;
    private requestCounter;
    constructor(llmProviderManager: LLMProviderManager);
    /**
     * Initialize the completions provider
     */
    private initialize;
    /**
     * Handle messages from the worker
     */
    private handleWorkerMessage;
    /**
     * Reject all pending requests
     */
    private rejectAllPendingRequests;
    /**
     * Send a request to the worker
     */
    private sendRequest;
    /**
     * Get inline completions for the current document
     */
    getInlineCompletions(documentText: string, position: vscode.Position, context: string, language: string): Promise<InlineCompletion[]>;
    /**
     * Get multiple solutions for display in a panel
     */
    getPanelCompletions(documentText: string, position: vscode.Position, context: string, language: string): Promise<PanelSolution[]>;
    /**
     * Get code explanation
     */
    getCodeExplanation(code: string, language: string): Promise<any>;
    /**
     * Get code refactoring
     */
    getCodeRefactoring(code: string, language: string, instructions: string): Promise<any>;
    /**
     * Dispose of resources
     */
    dispose(): void;
}
//# sourceMappingURL=completions-provider.d.ts.map