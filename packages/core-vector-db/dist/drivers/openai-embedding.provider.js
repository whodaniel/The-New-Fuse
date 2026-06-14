var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var OpenAIEmbeddingProvider_1;
import { Inject, Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
let OpenAIEmbeddingProvider = OpenAIEmbeddingProvider_1 = class OpenAIEmbeddingProvider {
    constructor(config) {
        this.config = config;
        this.logger = new Logger(OpenAIEmbeddingProvider_1.name);
        this.client = new OpenAI({
            apiKey: config.apiKey,
            baseURL: config.baseUrl,
        });
        this.model = config.model || 'text-embedding-3-small';
        this.dimension = config.dimension || this.getDefaultDimension(this.model);
    }
    async generateEmbedding(text) {
        try {
            const response = await this.client.embeddings.create({
                model: this.model,
                input: text,
                dimensions: this.dimension,
            });
            const embedding = response.data[0].embedding;
            this.logger.debug(`Generated embedding for text of length ${text.length}`);
            return embedding;
        }
        catch (error) {
            this.logger.error('Failed to generate embedding', error);
            throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async generateEmbeddings(texts) {
        try {
            // Process in batches to avoid rate limits
            const batchSize = 100;
            const results = [];
            for (let i = 0; i < texts.length; i += batchSize) {
                const batch = texts.slice(i, i + batchSize);
                const response = await this.client.embeddings.create({
                    model: this.model,
                    input: batch,
                    dimensions: this.dimension,
                });
                const batchEmbeddings = response.data.map((item) => item.embedding);
                results.push(...batchEmbeddings);
            }
            this.logger.debug(`Generated ${results.length} embeddings for batch of texts`);
            return results;
        }
        catch (error) {
            this.logger.error('Failed to generate batch embeddings', error);
            throw new Error(`Failed to generate batch embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    getDimension() {
        return this.dimension;
    }
    getModelName() {
        return this.model;
    }
    getDefaultDimension(model) {
        const dimensionMap = {
            'text-embedding-ada-002': 1536,
            'text-embedding-3-small': 1536,
            'text-embedding-3-large': 3072,
        };
        return dimensionMap[model] || 1536;
    }
};
OpenAIEmbeddingProvider = OpenAIEmbeddingProvider_1 = __decorate([
    Injectable(),
    __param(0, Inject('EMBEDDING_CONFIG')),
    __metadata("design:paramtypes", [Object])
], OpenAIEmbeddingProvider);
export { OpenAIEmbeddingProvider };
//# sourceMappingURL=openai-embedding.provider.js.map