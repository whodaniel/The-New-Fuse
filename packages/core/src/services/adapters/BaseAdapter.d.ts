/**
 * Base Adapter for Media Generation Providers
 *
 * Abstract base class for all provider adapters
 *
 * @module BaseAdapter
 * @since 2025-10-06
 */
import { MediaProviderConfig, MediaGenerationRequest, MediaOutput } from '../GenerativeMediaProviderRegistry';
export interface AdapterExecutionResult {
    outputs: MediaOutput[];
    cost?: number;
    metadata?: {
        model?: string;
        parameters?: any;
        processingTime?: number;
    };
}
export declare abstract class BaseAdapter {
    protected provider: MediaProviderConfig;
    protected apiKey?: string;
    constructor(provider: MediaProviderConfig);
    /**
     * Execute media generation request
     */
    abstract execute(request: MediaGenerationRequest): Promise<AdapterExecutionResult>;
    /**
     * Check if provider is healthy
     */
    abstract checkHealth(): Promise<boolean>;
    /**
     * Get API key from environment
     */
    protected getApiKey(): string | undefined;
    /**
     * Make HTTP request with error handling
     */
    protected makeRequest(url: string, options?: RequestInit): Promise<Response>;
    /**`
     * Log operation for debugging
     */
    protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void;
}
//# sourceMappingURL=BaseAdapter.d.ts.map