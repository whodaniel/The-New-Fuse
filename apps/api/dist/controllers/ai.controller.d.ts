import { DatabaseService } from '@the-new-fuse/database';
export declare class AiController {
    private readonly db;
    private readonly logger;
    constructor(db: DatabaseService);
    textCompletion(body: {
        prompt: string;
        systemPrompt?: string;
    }): Promise<{
        text: string;
        provider: string;
        model: string;
    }>;
    imageGeneration(body: {
        prompt: string;
    }): Promise<{
        imageUrl: string;
        provider: string;
        model: string;
    }>;
    private getPreferredProvider;
    private getEnvFallbackProvider;
    private resolveTextEndpoint;
    private resolveImageEndpoint;
    private buildProviderHeaders;
    private buildTextPayload;
    private extractTextContent;
    private resolveImageModel;
    private isOpenAIProvider;
    private isUsableApiKey;
    private isPlaceholderApiKey;
    private tryParseJson;
}
//# sourceMappingURL=ai.controller.d.ts.map