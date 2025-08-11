export interface LLMProviderConfig {
  // Implementation needed
}
    name: string;
    apiKey?: string;
    model: string;
    baseUrl?: string;
    parameters: {
  // Implementation needed
}
        temperature: number;
        maxTokens: number;
        topP?: number;
        frequencyPenalty?: number;
        presencePenalty?: number;
    };
}

export interface CompletionConfig {
  // Implementation needed
}
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
  // Implementation needed
}
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}

export interface CompletionResult {
  // Implementation needed
}
    text: string;
    provider: string;
    model: string;
    usage: TokenUsage;
    raw: unknown;
}

export interface StreamingCompletionResult extends CompletionResult {
  // Implementation needed
}
    isComplete: boolean;
    streamId: string;
}

export interface LLMMetrics {
  // Implementation needed
}
    requestCount: number;
    tokenCount: number;
    averageLatency: number;
    errorRate: number;
    costEstimate: number;
    lastUpdated: Date;
}

export interface AgentLLMConfig {
  // Implementation needed
}
    provider: string;
    model: string;
    systemPrompt?: string;
    parameters: {
  // Implementation needed
}
        temperature: number;
        maxTokens: number;
        topP?: number;
        frequencyPenalty?: number;
        presencePenalty?: number;
    };
    constraints?: {
  // Implementation needed
}
        maxRequestsPerMinute?: number;
        maxTokensPerRequest?: number;
        maxCostPerDay?: number;
    };
    capabilities?: {
  // Implementation needed
}
        streaming: boolean;
        functionCalling: boolean;
        toolUse: boolean;
        codeInterpreting: boolean;
    };
}
