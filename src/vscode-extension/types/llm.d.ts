export interface LLMResult {
    text: string;
    items?: Array<{
        insertText?: string;
    }>;
}
export interface LLMProvider {
    id: string;
    name: string;
    modelName?: string;
    generate(prompt: string, options?: any): Promise<LLMResult>;
    configure?(): Promise<void>;
    getAvailableModels?(): Promise<string[]>;
    setModel?(model: string): Promise<void>;
    pullModel?(modelName: string): Promise<void>;
}
export interface LLMProviderManager {
    getCurrentProvider(): LLMProvider | undefined;
    selectProvider(providerId: string): Promise<void>;
    getProviders(): Array<{
        id: string;
        name: string;
    }>;
    generate(prompt: string, options?: any): Promise<LLMResult>;
    selectModel(): Promise<void>;
}
//# sourceMappingURL=llm.d.ts.map