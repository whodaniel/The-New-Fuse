var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var VectorMemoryCache_1;
import { Injectable, Logger } from '@nestjs/common';
let VectorMemoryCache = VectorMemoryCache_1 = class VectorMemoryCache {
    logger = new Logger(VectorMemoryCache_1.name);
    cache = new Map();
    maxSize;
    embeddingDimension;
    similarityThreshold;
    constructor() {
        this.maxSize = parseInt(process.env.VECTOR_CACHE_SIZE || '1000');
        this.embeddingDimension = parseInt(process.env.EMBEDDING_DIMENSION || '1536');
        this.similarityThreshold = parseFloat(process.env.SIMILARITY_THRESHOLD || '0.7');
    }
    async store(item) {
        if (!item.embedding) {
            throw new Error('Item must have an embedding to be cached');
        }
        if (item.embedding.length !== this.embeddingDimension) {
            throw new Error(`Embedding dimension mismatch. Expected ${this.embeddingDimension}, got ${item.embedding.length}`);
        }
        // Evict if cache is full
        if (this.cache.size >= this.maxSize && !this.cache.has(item.id)) {
            this.evictLRU();
        }
        const entry = {
            item,
            embedding: item.embedding,
            lastAccessed: Date.now(),
            accessCount: 0,
        };
        this.cache.set(item.id, entry);
        this.logger.debug(`Stored vector in cache: ${item.id}`);
    }
    async get(id) {
        const entry = this.cache.get(id);
        if (!entry) {
            return null;
        }
        entry.lastAccessed = Date.now();
        entry.accessCount++;
        return entry.item;
    }
    async search(query, options = {}) {
        if (!query.embedding) {
            throw new Error('Query must have an embedding for vector search');
        }
        const results = [];
        const limit = options.limit || 10;
        const minSimilarity = options.minSimilarity || this.similarityThreshold;
        for (const [id, entry] of Array.from(this.cache.entries())) {
            // Apply type filter if specified
            if (options.filterByType && entry.item.metadata?.type !== options.filterByType) {
                continue;
            }
            const similarity = this.calculateCosineSimilarity(query.embedding, entry.embedding);
            if (similarity >= minSimilarity) {
                entry.lastAccessed = Date.now();
                entry.accessCount++;
                results.push({
                    item: entry.item,
                    similarity,
                    relevanceScore: similarity,
                });
            }
        }
        // Sort by similarity (descending) and limit results
        results.sort((a, b) => b.similarity - a.similarity);
        return results.slice(0, limit);
    }
    async getVectorsByType(type) {
        const results = [];
        for (const entry of Array.from(this.cache.values())) {
            if (entry.item.metadata?.type === type) {
                results.push(entry);
            }
        }
        return results;
    }
    async delete(id) {
        const deleted = this.cache.delete(id);
        if (deleted) {
            this.logger.debug(`Deleted vector from cache: ${id}`);
        }
        return deleted;
    }
    async clear() {
        this.cache.clear();
        this.logger.debug('Cleared vector cache');
    }
    async has(id) {
        return this.cache.has(id);
    }
    async size() {
        return this.cache.size;
    }
    async getStats() {
        const size = this.cache.size;
        const totalAccessCount = Array.from(this.cache.values())
            .reduce((sum, entry) => sum + entry.accessCount, 0);
        const memoryUsage = this.formatBytes(size * this.embeddingDimension * 4); // 4 bytes per float32
        return {
            size,
            maxSize: this.maxSize,
            memoryUsage,
            averageAccessCount: size > 0 ? totalAccessCount / size : 0,
        };
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
    evictLRU() {
        let oldestId = null;
        let oldestTime = Infinity;
        for (const [id, entry] of Array.from(this.cache.entries())) {
            if (entry.lastAccessed < oldestTime) {
                oldestTime = entry.lastAccessed;
                oldestId = id;
            }
        }
        if (oldestId) {
            this.cache.delete(oldestId);
            this.logger.debug(`Evicted vector from cache: ${oldestId}`);
        }
    }
    formatBytes(bytes) {
        if (bytes === 0)
            return '0 B';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
};
VectorMemoryCache = VectorMemoryCache_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], VectorMemoryCache);
export { VectorMemoryCache };
