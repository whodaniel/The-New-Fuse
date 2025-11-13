export interface LLMConfig {
    modelName: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stopSequences?: string[];
    apiKey?: string;
}
export interface LLMMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
    name?: string;
}
export interface LLMResponse {
    content: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    metadata?: Record<string, unknown>;
}
export interface LLMContext {
    messages: LLMMessage[];
    config?: Partial<LLMConfig>;
    metadata?: Record<string, unknown>;
}
export interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
    name?: string;
}
//# sourceMappingURL=llm.d.ts.map