export interface LLMMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}
export interface LLMOptions {
    temperature?: number;
    maxTokens?: number;
}
export declare class LLMClient {
    private apiKey;
    baseUrl: string;
    model: string;
    private readonly role;
    constructor(role?: 'orchestrator' | 'worker' | 'reviewer' | 'subagent');
    resolveProvider(): void;
    chatComplete(messages: LLMMessage[], options?: LLMOptions): Promise<string>;
    private callOpenAICompatible;
    private callGemini;
    fetchAvailableModels(): Promise<string[]>;
}
//# sourceMappingURL=llm-client.d.ts.map