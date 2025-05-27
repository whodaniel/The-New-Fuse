import { LLMProviderManager } from '../llm-provider-manager.js';
/**
 * Unified LLM Orchestrator that consolidates functionality from:
 * - llm-orchestrator.tsx
 * - llm-orchestrator-simple.ts
 * - lm-api-bridge.tsx
 * - lm-api-bridge-simple.tsx
 */
export declare class UnifiedLLMOrchestrator {
    private logger;
    private llmProviderManager;
    private disposables;
    private worker;
    private pendingRequests;
    private cacheEnabled;
    private cache;
    private statusBarItem;
    constructor(llmProviderManager: LLMProviderManager);
    /**
     * Initialize the worker for background LLM processing
     */
    private initializeWorker;
    /**
     * Register LLM-related commands
     */
    private registerCommands;
    /**
     * Generate text using LLM
     */
    generateText(prompt: string, options?: any): Promise<any>;
    /**
     * Generate code using LLM
     */
    generateCode(prompt: string, language: string, options?: any): Promise<any>;
    /**
     * Optimize code using LLM
     */
    optimizeCode(code: string, language: string, options?: any): Promise<any>;
    /**
     * Answer a question using LLM
     */
    answerQuestion(question: string, context?: string, options?: any): Promise<any>;
    /**
     * Send a request to the worker
     */
    private sendWorkerRequest;
    /**
     * Update the status bar item
     */
    private updateStatusBarItem;
    /**
     * Load cache from storage
     */
    private loadCache;
    /**
     * Save cache to storage
     */
    private saveCache;
    /**
     * Generate HTML for generated text
     */
    private getGeneratedTextHtml;
    /**
     * Generate HTML for code optimization
     */
    private getCodeOptimizationHtml;
    /**
     * Generate HTML for question answer
     */
    private getQuestionAnswerHtml;
    /**
     * Escape HTML to prevent XSS
     */
    private escapeHtml;
    /**
     * Dispose of resources
     */
    dispose(): void;
}
/**
 * Create and initialize the unified LLM orchestrator
 */
export declare function createUnifiedLLMOrchestrator(llmProviderManager: LLMProviderManager): UnifiedLLMOrchestrator;
//# sourceMappingURL=unified-llm-orchestrator.d.ts.map