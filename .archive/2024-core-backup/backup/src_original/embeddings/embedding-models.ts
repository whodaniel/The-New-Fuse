export interface EmbeddingModelConfig    { modelName: string
    dimensions?: number }
    options?: Record<string, unknown>;



}

export interface EmbeddingModel    { name: string
    dimensions: number
    embed(text: string | Record<string, unknown>): Promise<Float32Array>;
    compareEmbeddings(a: Float32Array, b: Float32Array): number }
    initialize(): Promise<void>;



}

export class USEEmbeddingModel implements EmbeddingModel { public readonly name = 'universal-sentence-encoder'';
    async embed(content: string | Record<string, unknown>): Promise<Float32Array> { const text = typeof content === 'string'';
                embedding[i] /= 'magnitude'';
    compareEmbeddings(a: Float32Array, b: ''
        const dotProduct = 'Array.from '';