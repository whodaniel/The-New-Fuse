export interface LLMRequest {
    prompt: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
}
export interface LLMResponse {
    content: string;
    model: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}
export declare class AgentLLMService {
    private readonly defaultModel;
    generateResponse(request: LLMRequest): Promise<LLMResponse>;
    streamResponse(request: LLMRequest): Promise<AsyncIterable<string>>;
    private callLLMAPI;
    private createStreamResponse;
    validateModel(model: string): Promise<boolean>;
    getDefaultModel(): string;
    getSupportedModels(): string[];
}
//# sourceMappingURL=AgentLLMService.d.ts.map