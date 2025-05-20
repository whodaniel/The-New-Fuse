import * as vscode from 'vscode';
import { LLMProvider } from './lm-api-bridge.js';
/**
 * Interface for LLM provider configuration
 */
export interface LLMProviderConfig {
    id: string;
    name: string;
    provider: LLMProvider;
    modelName: string;
    apiKey?: string;
    apiEndpoint?: string;
    isDefault?: boolean;
    isCustom?: boolean;
    isBuiltin?: boolean;
}
/**
 * Enhanced Request Options
 */
export interface RequestOptions {
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stop?: string[];
    timeout?: number;
    retryCount?: number;
    retryDelay?: number;
    useCache?: boolean;
    cacheKey?: string;
    contextSize?: number;
}
/**
 * LLMProviderManager handles the registration, selection, and management
 * of LLM providers within the VS Code extension.
 */
export declare class LLMProviderManager {
    private providers;
    private selectedProviderId;
    private statusBarItem;
    private onProviderChangedEmitter;
    private context;
    private outputChannel;
    private workerPool;
    private responseCache;
    private telemetryEvents;
    private isProcessingQueue;
    private requestQueue;
    readonly onProviderChanged: vscode.Event<string>;
    constructor(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel);
    /**
     * Initialize the default LLM providers
     */
    private initializeDefaultProviders;
    /**
     * Check if GitHub Copilot is available in the current VS Code instance
     */
    private checkCopilotAvailability;
    /**
     * Register a new LLM provider
     */
    registerProvider(provider: LLMProviderConfig): LLMProviderConfig;
    /**
     * Get a provider by ID
     */
    getProvider(id: string): LLMProviderConfig | undefined;
    /**
     * Get all registered providers
     */
    getAllProviders(): LLMProviderConfig[];
    /**
     * Get the currently selected provider
     */
    getSelectedProvider(): LLMProviderConfig | undefined;
    /**
     * Select a provider by ID
     */
    selectProvider(id: string): boolean;
    /**
     * Remove a provider by ID
     */
    removeProvider(id: string): boolean;
    /**
     * Save custom providers to extension storage
     */
    private saveCustomProviders;
    /**
     * Show quick pick to select a provider
     */
    private showProviderSelectionQuickPick;
    /**
     * Show quick pick to add a custom provider
     */
    private showAddCustomProviderQuickPick;
    /**
     * Show quick pick to manage providers
     */
    private showManageProvidersQuickPick;
    /**
     * Update the status bar item
     */
    private updateStatusBar;
    /**
     * Log a message to the output channel
     */
    private log;
    /**
     * Initialize a pool of workers for concurrent processing
     */
    private initializeWorkerPool;
    /**
     * Handle a message from a worker
     */
    private handleWorkerMessage;
    /**
     * Process the request queue
     */
    private processQueue;
    /**
     * Configure response caching
     */
    private setupResponseCaching;
    /**
     * Cache a response
     */
    private cacheResponse;
    /**
     * Get a cached response
     */
    private getCachedResponse;
    /**
     * Record telemetry event
     */
    private recordTelemetry;
    /**
     * Set up telemetry flushing
     */
    private setupTelemetry;
    /**
     * Flush telemetry events
     */
    private flushTelemetry;
    /**
     * Generate text with the currently selected provider
     */
    generateText(prompt: string, options?: RequestOptions): Promise<any>;
    /**
     * Generate a chat completion with the currently selected provider
     */
    generateChatCompletion(messages: any[], options?: RequestOptions): Promise<any>;
    /**
     * Generate code with the currently selected provider
     */
    generateCode(prompt: string, language: string, options?: RequestOptions): Promise<any>;
    /**
     * Helper: Convert chat messages to a prompt string
     */
    private convertMessagesToPrompt;
    /**
     * Helper: Generate text with OpenAI
     */
    private generateOpenAIText;
    /**
     * Helper: Generate chat completion with OpenAI
     */
    private generateOpenAIChatCompletion;
    /**
     * Helper: Generate text with Anthropic
     */
    private generateAnthropicText;
    /**
     * Helper: Generate chat completion with Anthropic
     */
    private generateAnthropicChatCompletion;
    /**
     * Helper: Generate text with GitHub Copilot
     */
    private generateCopilotText;
}
/**
 * Create an LLM Provider Manager
 */
export declare function createLLMProviderManager(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel): LLMProviderManager;
//# sourceMappingURL=llm-provider-manager.d.ts.map