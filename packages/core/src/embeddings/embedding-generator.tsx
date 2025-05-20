import { EmbeddingModelFactory } from './embedding-models.js';

export class EmbeddingGenerator {
    private model: unknown = null;

    constructor(private modelName: string = 'universal-sentence-encoder') {
        this.initialize();
    }

    async initialize(): Promise<void> {
        try {
            this.model = await EmbeddingModelFactory.getModel({
                modelName: this.modelName
            });
        } catch (error) {
            throw new Error(`Failed to initialize embedding model: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async generateEmbedding(text: string): Promise<Float32Array> {
        if (!this.model) {
            throw new Error('Embedding model not initialized');
        }

        try {
            return await (this.model as any).embed(text);
        } catch (error) {
            throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async compareEmbeddings(a: Float32Array, b: Float32Array): Promise<number> {
        if (!this.model) {
            throw new Error('Embedding model not initialized');
        }

        try {
            return await (this.model as any).compareEmbeddings(a, b);
        } catch (error) {
            throw new Error(`Failed to compare embeddings: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    cleanup(): Promise<void> {
        this.model = null;
        return Promise.resolve();
    }
}