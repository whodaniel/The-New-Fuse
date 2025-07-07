export interface LLMProviderConfig {
    name: string;
    apiKey?: string;
    model: string;
    baseUrl?: string;
    parameters: {
        temperature: number;
        maxTokens: number;
        topP?: number;
        frequencyPenalty?: number;
        presencePenalty?: number;
    };
}

export interface CompletionConfig {
    provider?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stopSequences?: string[];
    cache?: boolean;
    stream?: boolean;
}

export interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}

export interface CompletionResult {
    text: string;
    provider: string;
    model: string;
    usage: TokenUsage;
    raw: unknown;
}

export interface StreamingCompletionResult extends CompletionResult {
    isComplete: boolean;
    streamId: string;
}

export interface LLMMetrics {
    requestCount: number;
    tokenCount: number;
    averageLatency: number;
    errorRate: number;
    costEstimate: number;
    lastUpdated: Date;
}

export interface AgentLLMConfig {
    provider: string;
    model: string;
    systemPrompt?: string;
    parameters: {
        temperature: number;
        maxTokens: number;
        topP?: number;
        frequencyPenalty?: number;
        presencePenalty?: number;
    };
    constraints?: {
        maxRequestsPerMinute?: number;
        maxTokensPerRequest?: number;
        maxCostPerDay?: number;
    };
    capabilities?: {
        streaming: boolean;
        functionCalling: boolean;
        toolUse: boolean;
        codeInterpreting: boolean;
    };
}
