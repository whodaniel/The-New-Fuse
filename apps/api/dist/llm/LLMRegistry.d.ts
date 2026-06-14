export interface LLMProvider {
    id: string;
    name: string;
    type: 'openai' | 'anthropic' | 'local' | 'other';
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
}
export declare class LLMRegistry {
    private providers;
    registerProvider(provider: LLMProvider): void;
    getProvider(id: string): LLMProvider | null;
    getAllProviders(): LLMProvider[];
    removeProvider(id: string): boolean;
}
export declare const llmRegistry: LLMRegistry;
//# sourceMappingURL=LLMRegistry.d.ts.map