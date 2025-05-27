import { LLMProviderManager } from './src/llm/LLMProviderManager.js';
import { LLMProvider, LLMResult, LLMResponse } from './src/types/llm.js';
export { LLMProvider, LLMResult, LLMResponse };
export declare class LMAPIBridge {
    private providerManager;
    private logger;
    constructor(providerManager: LLMProviderManager);
    generate(params: {
        prompt: string;
        systemPrompt?: string;
        temperature?: number;
        maxTokens?: number;
        stopSequences?: string[];
    }): Promise<LLMResponse>;
    configureProvider(): Promise<void>;
    getAvailableProviders(): string[];
    setProvider(providerId: string): Promise<void>;
}
//# sourceMappingURL=lm-api-bridge.d.ts.map