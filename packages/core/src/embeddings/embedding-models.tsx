export interface EmbeddingModelConfig {
    modelName: string;
    dimensions?: number;
    options?: Record<string, unknown>;
}

export interface EmbeddingModel {
    name: string;
    dimensions: number;
    embed(text: string | Record<string, unknown>): Promise<Float32Array>;
    compareEmbeddings(a: Float32Array, b: Float32Array): number;
    initialize(): Promise<void>;
}

export class USEEmbeddingModel implements EmbeddingModel {
    public readonly name = 'universal-sentence-encoder';
    public readonly dimensions = 512;

    async initialize(): Promise<void> {
        // No initialization needed for simple embedding
        return Promise.resolve();
    }

    async embed(content: string | Record<string, unknown>): Promise<Float32Array> {
        const text = typeof content === 'string' ? content : JSON.stringify(content);
        const words = text.toLowerCase().split(/\s+/);
        const embedding = new Float32Array(this.dimensions).fill(0);
        
        // Simple hash-based embedding
        words.forEach((word) => {
            const hash = this.simpleHash(word);
            for(let i = 0; i < this.dimensions; i++) {
                embedding[i] += ((hash + i) % 997) / 997;
            }
        });
        
        // Normalize
        let magnitude = 0;
        for (let i = 0; i < this.dimensions; i++) {
            magnitude += embedding[i] * embedding[i];
        }
        
        magnitude = Math.sqrt(magnitude);
        if (magnitude > 0) {
            for (let i = 0; i < this.dimensions; i++) {
                embedding[i] /= magnitude;
            }
        }
        
        return embedding;
    }

    compareEmbeddings(a: Float32Array, b: Float32Array): number {
        const dotProduct = Array.from(a).reduce((sum, val, i) => sum + val * b[i], 0);
        const magnitudeA = Math.sqrt(Array.from(a).reduce((sum, val) => sum + val * val, 0));
        const magnitudeB = Math.sqrt(Array.from(b).reduce((sum, val) => sum + val * val, 0));
        return dotProduct / (magnitudeA * magnitudeB);
    }
    
    private simpleHash(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }
}

export class CustomBERTEmbeddingModel implements EmbeddingModel {
    public readonly name = 'custom-bert';
    public readonly dimensions = 768;

    async initialize(): Promise<void> {
        // Implementation would load model
        return Promise.resolve();
    }

    async embed(content: string | Record<string, unknown>): Promise<Float32Array> {
        // Simplified implementation
        const useModel = new USEEmbeddingModel();
        return useModel.embed(content);
    }

    compareEmbeddings(a: Float32Array, b: Float32Array): number {
        return new USEEmbeddingModel().compareEmbeddings(a, b);
    }
}

export class EmbeddingModelFactory {
    private static models: Map<string, EmbeddingModel> = new Map();

    static async getModel(config: EmbeddingModelConfig | string): Promise<EmbeddingModel> {
        const modelName = typeof config === 'string' ? config : config.modelName;

        if (this.models.has(modelName)) {
            return this.models.get(modelName)!;
        }
        
        let model: EmbeddingModel;
        
        switch (modelName) {
            case 'universal-sentence-encoder':
                model = new USEEmbeddingModel();
                await model.initialize();
                break;
            case 'custom-bert':
                model = new CustomBERTEmbeddingModel();
                await model.initialize();
                break;
            default:
                throw new Error(`Unknown embedding model: ${modelName}`);
        }

        this.models.set(modelName, model);
        return model;
    }
}
