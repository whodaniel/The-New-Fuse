import type { EmbeddingConfig, IEmbeddingProvider } from '../interface/vector-database.interface.js';
export declare class OpenAIEmbeddingProvider implements IEmbeddingProvider {
    private readonly config;
    private readonly logger;
    private readonly client;
    private readonly model;
    private readonly dimension;
    constructor(config: EmbeddingConfig);
    generateEmbedding(text: string): Promise<number[]>;
    generateEmbeddings(texts: string[]): Promise<number[][]>;
    getDimension(): number;
    getModelName(): string;
    private getDefaultDimension;
}
//# sourceMappingURL=openai-embedding.provider.d.ts.map