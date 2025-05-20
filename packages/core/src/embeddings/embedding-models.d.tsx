export interface EmbeddingModel {
    name: string;
    dimensions: number;
    embed(text: string | Record<string, unknown>): Promise<Float32Array>;
    compareEmbeddings(a: Float32Array, b: Float32Array): number;
    initialize(): Promise<void>;
}
export declare class USEEmbeddingModel implements EmbeddingModel {
    readonly name: any;
}
export interface EmbeddingModelConfig {
}
export declare class CustomBERTEmbeddingModel implements EmbeddingModel {
    readonly name = "custom-bert";
    readonly dimensions = 768;
    initialize(): Promise<void>;
}
