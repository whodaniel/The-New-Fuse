import { initializeLogging, log, logError, logWarning, showError, showInfo } from './utils/logging.js';
import { LLMProvider, LLMProviderInfo, LLMResponse, GenerateOptions } from './types/llm.js';

export class LLMProviderManager {
    protected readonly logger = { // Replace logger instance with direct calls or a wrapper if needed
        info: log,
        error: logError,
        warn: logWarning,
        showError: showError,
        showInfo: showInfo,
    };
    private currentProvider: LLMProvider | undefined;
    private providers: Map<string, LLMProvider>;

    constructor() {
        // Logging is initialized in extension.ts, no need to initialize here
        this.providers = new Map();
    }

    public async generate(prompt: string, options?: GenerateOptions): Promise<string> {
        const provider = await this.getCurrentProvider();
        if (!provider) {
            throw new Error('No LLM provider available');
        }

        try {
            const result = await provider.generate(prompt, options);
            return result;
        } catch (error) {
            this.logger.error('Generation failed:', error);
            throw error;
        }
    }

    public async getCurrentProvider(): Promise<LLMProvider | undefined> {
        return this.currentProvider;
    }

    public async getCurrentProviderInfo(): Promise<LLMProviderInfo | undefined> {
        const provider = await this.getCurrentProvider();
        if (!provider) {
            return undefined;
        }

        // Create a provider info object that conforms to the LLMProviderInfo interface
        return {
            name: provider.name,
            version: "1.0.0", // Default version
            capabilities: Array.isArray(provider.capabilities) ? provider.capabilities : ["text"],
            models: ["default"], // Default model
            maxTokens: 4096, // Default max tokens
            isAvailable: true,
            metadata: {
                id: provider.id,
                modelName: provider.modelName
            }
        };
    }

    public async getAvailableProviders(): Promise<LLMProviderInfo[]> {
        return Array.from(this.providers.values()).map(provider => ({
            name: provider.name,
            version: "1.0.0", // Default version
            capabilities: Array.isArray(provider.capabilities) ? provider.capabilities : ["text"],
            models: ["default"], // Default model
            maxTokens: 4096, // Default max tokens
            isAvailable: true,
            metadata: {
                id: provider.id,
                modelName: provider.modelName
            }
        }));
    }

    public registerProvider(provider: LLMProvider): void {
        this.providers.set(provider.id, provider);
        if (!this.currentProvider) {
            this.currentProvider = provider;
        }
    }

    public unregisterProvider(providerId: string): void {
        this.providers.delete(providerId);
        if (this.currentProvider?.id === providerId) {
            this.currentProvider = this.providers.values().next().value;
        }
    }

    public async setCurrentProvider(providerId: string): Promise<void> {
        const provider = this.providers.get(providerId);
        if (!provider) {
            throw new Error(`Provider ${providerId} not found`);
        }
        this.currentProvider = provider;
    }

    public dispose(): void {
        this.providers.clear();
        this.currentProvider = undefined;
    }
}
