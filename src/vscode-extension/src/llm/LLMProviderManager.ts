import { LLMProvider, LLMProviderInfo, GenerateOptions, LLMModelInfo } from '../types/llm.js';
import { Logger } from '../core/logging.js';
import { getErrorMessage } from '../utils/error-utils.js';

export class LLMProviderManager {
    protected readonly providers: Map<string, LLMProvider> = new Map();
    protected currentProviderId: string | null = null;
    protected readonly logger: Logger;
    protected readonly modelInfo: Map<string, LLMModelInfo[]> = new Map();

    constructor() {
        this.logger = Logger.create('LLMProviderManager');
    }

    public registerProvider(provider: LLMProvider): void {
        this.providers.set(provider.id, provider);
        if (!this.currentProviderId) {
            this.currentProviderId = provider.id;
        }
        this.logger.info(`Registered LLM provider: ${provider.name}`);
    }

    public async initialize(): Promise<void> {
        for (const provider of this.providers.values()) {
            await provider.initialize();
        }
    }

    public async generate(prompt: string, options?: GenerateOptions): Promise<string> {
        const provider = await this.getCurrentProvider();
        if (!provider) {
            throw new Error('No LLM provider available');
        }

        try {
            return await provider.generate(prompt, options);
        } catch (error) {
            this.logger.error('Error generating response:', getErrorMessage(error));
            throw error;
        }
    }

    public async getCurrentProvider(): Promise<LLMProvider | null> {
        if (!this.currentProviderId) return null;
        return this.providers.get(this.currentProviderId) || null;
    }

    public async getCurrentProviderInfo(): Promise<LLMProviderInfo> {
        const provider = await this.getCurrentProvider();
        if (!provider) {
            throw new Error('No LLM provider available');
        }
        return provider.getInfo();
    }

    public async getCurrentModel(): Promise<LLMModelInfo> {
        const provider = await this.getCurrentProvider();
        if (!provider) {
            throw new Error('No LLM provider available');
        }
        return provider.getCurrentModel();
    }

    public async setCurrentModel(model: LLMModelInfo): Promise<void> {
        const provider = await this.getCurrentProvider();
        if (!provider) {
            throw new Error('No LLM provider available');
        }
        await provider.setCurrentModel(model);
    }

    public async getAvailableModels(): Promise<LLMModelInfo[]> {
        const provider = await this.getCurrentProvider();
        if (!provider) {
            throw new Error('No LLM provider available');
        }
        return provider.getAvailableModels();
    }

    public dispose(): void {
        for (const provider of this.providers.values()) {
            if (provider.dispose) {
                provider.dispose();
            }
        }
        this.providers.clear();
        this.currentProviderId = null;
    }
}
