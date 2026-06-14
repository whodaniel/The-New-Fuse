// Mock provider classes for now - these need to be implemented properly
class PineconeProvider {
    constructor(_config) {
        this.name = 'pinecone';
    }
    async storeVectors() { throw new Error('Not implemented'); }
    async search() { throw new Error('Not implemented'); }
    async deleteVectors() { throw new Error('Not implemented'); }
    async clearNamespace() { throw new Error('Not implemented'); }
}
class ChromaProvider {
    constructor(_config) {
        this.name = 'chroma';
    }
    async storeVectors() { throw new Error('Not implemented'); }
    async search() { throw new Error('Not implemented'); }
    async deleteVectors() { throw new Error('Not implemented'); }
    async clearNamespace() { throw new Error('Not implemented'); }
}
class RedisProvider {
    constructor(_config) {
        this.name = 'redis';
    }
    async storeVectors() { throw new Error('Not implemented'); }
    async search() { throw new Error('Not implemented'); }
    async deleteVectors() { throw new Error('Not implemented'); }
    async clearNamespace() { throw new Error('Not implemented'); }
}
export class ProviderRegistry {
    static createProvider(config) {
        const { provider, endpoint = 'placeholder', apiKey } = config;
        switch (provider) {
            case 'pinecone':
                return new PineconeProvider({ endpoint, apiKey });
            case 'chroma':
                return new ChromaProvider({ endpoint, apiKey });
            case 'redis':
                return new RedisProvider({ endpoint, apiKey });
            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }
    }
}
//# sourceMappingURL=provider-registry.js.map