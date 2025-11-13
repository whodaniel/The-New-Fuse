import type { IEmbeddingProvider, EmbeddingConfig } from '../interface/vector-database.interface';
export declare class OpenAIEmbeddingProvider implements IEmbeddingProvider {
    private readonly config;
    private readonly logger;
    private readonly client;
    private readonly model;
    private readonly dimension;
    constructor(config: EmbeddingConfig);
    generateEmbedding(text: string): Promise<number[]>;
    generateEmbeddings(texts: string[]): Promise<number[][]>;
}
//# sourceMappingURL=openai-embedding.provider.d.ts.map