export interface ModelCost {
    input: number;
    output: number;
}
export interface LLMModel {
    id: string;
    name: string;
    contextWindow: number;
    costPer1kTokens: ModelCost;
    maxOutputTokens?: number;
    capabilities?: string[];
}
export interface LLMProvider {
    id: string;
    name: string;
    baseUrl: string;
    models: LLMModel[];
    available: boolean;
    maxRatePerMinute: number;
    capabilities?: string[];
    authType?: 'bearer' | 'header' | 'query';
}
export interface CompletionOptions {
    model: string;
    prompt: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stop?: string[];
    user?: string;
    stream?: boolean;
    provider?: string;
}
export interface CompletionResult {
    id: string;
    provider: string;
    model: string;
    completion: string;
    finishReason: 'stop' | 'length' | 'content_filter' | null;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    created: number;
}
//# sourceMappingURL=providers.d.ts.map