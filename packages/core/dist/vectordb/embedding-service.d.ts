interface EmbeddingConfig {
    provider?: string;
}
export declare class EmbeddingService {
    private provider;
    private logger;
    constructor(config?: EmbeddingConfig);
    generateEmbedding(text: string): Promise<number[]>;
    private callEmbeddingAPI;
}
export {};
//# sourceMappingURL=embedding-service.d.ts.map