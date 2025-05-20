import * as vscode from 'vscode';
import { FuseMonitoringClient } from './monitoring/FuseMonitoringClient.js';
import { LLMProviderConfig, LLMProviderManager } from './llm-provider-manager.js';
/**
 * MonitoredLLMProviderManager
 *
 * Extends the LLMProviderManager with integrated monitoring capabilities.
 * This class wraps all LLM provider operations with monitoring to track
 * performance, usage, and errors across different LLM providers.
 */
export declare class MonitoredLLMProviderManager {
    private providerManager;
    private monitoringClient;
    private context;
    constructor(context: vscode.ExtensionContext, providerManager: LLMProviderManager, monitoringClient: FuseMonitoringClient);
    /**
     * Get all available LLM providers
     */
    getAllProviders(): LLMProviderConfig[];
    /**
     * Get a provider by ID
     */
    getProvider(id: string): LLMProviderConfig | undefined;
    /**
     * Get the currently selected provider
     */
    getCurrentProvider(): LLMProviderConfig;
    /**
     * Set the current provider by ID
     */
    setCurrentProvider(id: string): Promise<boolean>;
    /**
     * Generate text with the current provider, with monitoring
     */
    generateText(prompt: string, options?: any): Promise<any>;
    /**
     * Generate a chat completion with the current provider, with monitoring
     */
    generateChatCompletion(messages: any[], options?: any): Promise<any>;
    /**
     * Generate code with the current provider, with monitoring
     */
    generateCode(prompt: string, language: string, options?: any): Promise<any>;
    /**
     * Add a user rating for a generation
     */
    rateGeneration(generationId: string, rating: number, comment?: string): void;
    /**
     * Save a user preference for a provider
     */
    saveUserPreference(providerId: string, preferred: boolean): void;
    /**
     * Get monitoring metrics for LLM usage
     */
    getMetrics(): any;
    /**
     * Open the monitoring dashboard
     */
    openMonitoringDashboard(): void;
}
//# sourceMappingURL=monitored-llm-provider-manager.d.ts.map