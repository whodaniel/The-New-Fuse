export interface ModelConfig {
    name: string;
    provider: string;
    maxTokens: number;
    temperature: number;
}
export interface AIResponse {
    content: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    model: string;
}
export interface AIRequest {
    prompt: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
    stream?: boolean;
}
export declare class AIService {
    private models;
    constructor();
    private initializeModels;
    getModel(modelName: string): ModelConfig | undefined;
    getAllModels(): ModelConfig[];
    getModelsByProvider(provider: string): ModelConfig[];
    generateResponse(request: AIRequest): Promise<AIResponse>;
    generateStreamResponse(request: AIRequest): Promise<AsyncIterable<string>>;
    validateRequest(request: AIRequest): {
        valid: boolean;
        errors: string[];
    };
    addModel(config: ModelConfig): boolean;
    removeModel(modelName: string): boolean;
    updateModel(modelName: string, updates: Partial<ModelConfig>): boolean;
    getModelStats(): {
        totalModels: number;
        providerDistribution: Record<string, number>;
        averageMaxTokens: number;
    };
}
//# sourceMappingURL=ai-service.d.ts.map