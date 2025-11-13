/**
 * @fileoverview Production-ready local AI detection and management service
 */
import { LocalAIProvider } from '../types/core';
import { ServiceState } from '../constants/types';
export declare class LocalAIDetectionService {
    private state;
    private providers;
    private detectionInterval?;
    private readonly detectionIntervalMs;
    constructor();
    start(): Promise<void>;
    stop(): Promise<void>;
    getState(): ServiceState;
    detect(): Promise<LocalAIProvider[]>;
    detectAvailableAIs(): LocalAIProvider[];
    getAllProviders(): LocalAIProvider[];
    getProvider(name: string): LocalAIProvider | undefined;
    addProvider(provider: LocalAIProvider): void;
    removeProvider(name: string): boolean;
    checkProviderAvailability(provider: LocalAIProvider): Promise<boolean>;
    getProviderModels(providerName: string): Promise<string[]>;
    private initializeDefaultProviders;
    private detectAllProviders;
    private checkOllamaAvailability;
    private checkLMStudioAvailability;
    private checkLocalAIAvailability;
    private checkCustomProviderAvailability;
    private getOllamaModels;
    private getLMStudioModels;
    private getLocalAIModels;
    private makeHttpRequest;
    testProvider(providerName: string): Promise<{
        available: boolean;
        models: string[];
        responseTime: number;
        error?: string;
    }>;
    getProviderStats(): Record<string, any>;
    /**
     * Detect and create agent DTOs from available local AI providers
     */
    detectAndCreateAgents(userId: string): Promise<any[]>;
    /**
     * Create default system agents for all detected local AI providers
     */
    createDefaultSystemAgents(): Promise<any[]>;
    /**
     * Get capabilities for a specific provider type
     */
    private getCapabilitiesForProvider;
    /**
     * Get system-level capabilities for a specific provider type
     */
    private getSystemCapabilitiesForProvider;
}
//# sourceMappingURL=LocalAIDetectionService.d.ts.map