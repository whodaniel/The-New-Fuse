var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SemanticSearch_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
let SemanticSearch = SemanticSearch_1 = class SemanticSearch {
    constructor(configService) {
        this.configService = configService;
        this.logger = new Logger(SemanticSearch_1.name);
        this.items = new Map();
        this.config = {
            dimension: this.configService.get('EMBEDDING_DIMENSION', 1536),
            metric: this.configService.get('EMBEDDING_METRIC', 'cosine'),
            maxElements: this.configService.get('MAX_SEMANTIC_ELEMENTS', 10000),
            ef: this.configService.get('HNSW_EF', 200),
            efConstruction: this.configService.get('HNSW_EF_CONSTRUCTION', 200),
            M: this.configService.get('HNSW_M', 16),
        };
        this.logger.log('SemanticSearch initialized with config:', this.config);
    }
    async addItem(item) {
        try {
            if (!item.embedding || item.embedding.length !== this.config.dimension) {
                throw new Error(`Invalid embedding dimension. Expected ${this.config.dimension}, got ${item.embedding?.length}`);
            }
            this.items.set(item.id, item);
            this.logger.debug(`Added item to semantic search: ${item.id}`);
        }
        catch (error) {
            this.logger.error(`Failed to add item to semantic search: ${item.id}`, error);
            throw error;
        }
    }
    async removeItem(itemId) {
        const removed = this.items.delete(itemId);
        if (removed) {
            this.logger.debug(`Removed item from semantic search: ${itemId}`);
        }
        return removed;
    }
    async search(query) {
        try {
            if (!query.embedding) {
                throw new Error('Query must have an embedding for semantic search');
            }
            const results = [];
            const limit = query.limit || 10;
            const minSimilarity = query.minSimilarity || 0.7;
            for (const [id, item] of this.items.entries()) {
                const similarity = this.calculateSimilarity(query.embedding, item.embedding);
                if (similarity >= minSimilarity && this.matchesFilters(item, query)) {
                    results.push({
                        item,
                        similarity,
                        relevanceScore: similarity,
                    });
                }
            }
            // Sort by similarity (descending) and limit results
            results.sort((a, b) => b.similarity - a.similarity);
            return results.slice(0, limit);
        }
        catch (error) {
            this.logger.error('Semantic search failed:', error);
            return [];
        }
    }
    async getSimilarItems(itemId, limit = 10) {
        const item = this.items.get(itemId);
        if (!item) {
            throw new Error(`Item not found: ${itemId}`);
        }
        return this.search({
            embedding: item.embedding,
            limit,
            minSimilarity: 0.5,
        });
    }
    async getStats() {
        const memoryUsage = this.items.size * this.config.dimension * 4; // 4 bytes per float32
        return {
            totalItems: this.items.size,
            dimension: this.config.dimension,
            metric: this.config.metric,
            memoryUsage: this.formatBytes(memoryUsage),
        };
    }
    async clear() {
        this.items.clear();
        this.logger.debug('Cleared semantic search index');
    }
    calculateSimilarity(vecA, vecB) {
        switch (this.config.metric) {
            case 'cosine':
                return this.calculateCosineSimilarity(vecA, vecB);
            case 'l2':
                return 1 / (1 + this.calculateL2Distance(vecA, vecB));
            case 'ip':
                return this.calculateInnerProduct(vecA, vecB);
            default:
                throw new Error(`Unsupported metric: ${this.config.metric}`);
        }
    }
    calculateCosineSimilarity(vecA, vecB) {
        if (vecA.length !== vecB.length) {
            throw new Error('Vector dimensions must match');
        }
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        if (normA === 0 || normB === 0) {
            return 0;
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
    calculateL2Distance(vecA, vecB) {
        if (vecA.length !== vecB.length) {
            throw new Error('Vector dimensions must match');
        }
        let sumSquaredDiffs = 0;
        for (let i = 0; i < vecA.length; i++) {
            const diff = vecA[i] - vecB[i];
            sumSquaredDiffs += diff * diff;
        }
        return Math.sqrt(sumSquaredDiffs);
    }
    calculateInnerProduct(vecA, vecB) {
        if (vecA.length !== vecB.length) {
            throw new Error('Vector dimensions must match');
        }
        let dotProduct = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
        }
        return dotProduct;
    }
    matchesFilters(item, query) {
        // Apply metadata filters
        if (query.filters) {
            for (const [key, value] of Object.entries(query.filters)) {
                if (item.metadata[key] !== value) {
                    return false;
                }
            }
        }
        // Apply tag filters
        if (query.tags && query.tags.length > 0) {
            const itemTags = item.tags || [];
            const hasAllTags = query.tags.every(tag => itemTags.includes(tag));
            if (!hasAllTags) {
                return false;
            }
        }
        // Apply cluster filter
        if (query.clusterId && item.clusterId !== query.clusterId) {
            return false;
        }
        // Apply date range filter
        if (query.dateRange) {
            const itemTime = item.timestamp;
            if (itemTime < query.dateRange.start || itemTime > query.dateRange.end) {
                return false;
            }
        }
        return true;
    }
    formatBytes(bytes) {
        if (bytes === 0)
            return '0 B';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
};
SemanticSearch = SemanticSearch_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], SemanticSearch);
export { SemanticSearch };
