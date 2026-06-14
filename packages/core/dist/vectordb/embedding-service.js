import { Logger } from '@nestjs/common';
export class EmbeddingService {
    constructor(config = {}) {
        this.logger = new Logger(EmbeddingService.name);
        this.provider = config.provider || 'openai';
    }
    async generateEmbedding(text) {
        try {
            const response = await this.callEmbeddingAPI(text);
            if (!response || !response.embedding) {
                throw new Error('Embedding not returned from API');
            }
            return response.embedding;
        }
        catch (error) {
            this.logger.error('Failed to generate embedding', error);
            throw error;
        }
    }
    async callEmbeddingAPI(_text) {
        // Implementation needed
        // Implementation would depend on the specific provider
        throw new Error('Not implemented');
    }
}
//# sourceMappingURL=embedding-service.js.map