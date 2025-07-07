var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EnhancedMemoryManager_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { VectorMemoryCache } from './cache/VectorMemoryCache';
import { MemoryCache } from './cache/MemoryCache';
import { AdvancedClustering } from './clustering/AdvancedClustering';
let EnhancedMemoryManager = EnhancedMemoryManager_1 = class EnhancedMemoryManager {
    constructor(configService, eventEmitter, vectorCache, memoryCache, clustering) {
        this.configService = configService;
        this.eventEmitter = eventEmitter;
        this.vectorCache = vectorCache;
        this.memoryCache = memoryCache;
        this.clustering = clustering;
        this.logger = new Logger(EnhancedMemoryManager_1.name);
        this.optimizationInterval = null;
        this.memoryLeakDetector = null;
        this.config = {
            shortTermCapacity: this.configService.get('memory.shortTermCapacity', 1000),
            workingMemoryCapacity: this.configService.get('memory.workingMemoryCapacity', 100),
            longTermRetentionDays: this.configService.get('memory.longTermRetentionDays', 30),
            compressionThreshold: this.configService.get('memory.compressionThreshold', 0.8),
            embeddingDimension: this.configService.get('memory.embeddingDimension', 1536),
            clusteringEnabled: this.configService.get('memory.clusteringEnabled', true),
            autoOptimize: this.configService.get('memory.autoOptimize', true)
        };
        this.initializeOptimization();
        this.initializeMemoryLeakDetection();
    }
    async storeMemory(item) {
        const memoryItem = {
            ...item,
            id: this.generateId(),
            timestamp: Date.now(),
            lastAccessed: Date.now()
        };
        try {
            // Determine storage location based on type and importance
            if (item.type === 'working') {
                await this.storeInWorkingMemory(memoryItem);
            }
            else if (item.importance && item.importance > 0.7 || item.type === 'knowledge') {
                await this.storeInLongTermMemory(memoryItem);
            }
            else {
                await this.storeInShortTermMemory(memoryItem);
            }
            this.eventEmitter.emit('memory.stored', memoryItem);
            this.logger.debug(`Stored memory item: ${memoryItem.id} (type: ${memoryItem.type})`);
            return memoryItem.id;
        }
        catch (error) {
            this.logger.error('Failed to store memory item:', error);
            throw error;
        }
    }
    async retrieveMemory(id) {
        try {
            // Try vector cache first
            const vectorItem = await this.vectorCache.get(id);
            if (vectorItem) {
                this.eventEmitter.emit('memory.accessed', vectorItem);
                return vectorItem;
            }
            // Try memory cache
            const cachedItem = this.memoryCache.get(id);
            if (cachedItem) {
                this.eventEmitter.emit('memory.accessed', cachedItem);
                return cachedItem;
            }
            return null;
        }
        catch (error) {
            this.logger.error(`Failed to retrieve memory item ${id}:`, error);
            return null;
        }
    }
    async searchMemory(query) {
        try {
            const results = await this.vectorCache.search(query, {
                limit: query.limit || 10,
                minSimilarity: query.minSimilarity || 0.7,
                filterByType: query.filterByType,
                includeMetadata: true
            });
            // Enhance results with relevance scoring
            const enhancedResults = results.map(result => ({
                ...result,
                relevanceScore: this.calculateRelevanceScore(result, query)
            }));
            // Sort by relevance score
            enhancedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
            this.eventEmitter.emit('memory.searched', { query, results: enhancedResults });
            return enhancedResults;
        }
        catch (error) {
            this.logger.error('Failed to search memory:', error);
            return [];
        }
    }
    async compressMemory() {
        try {
            this.logger.debug('Starting memory compression...');
            const stats = await this.getMemoryStats();
            const compressionRatio = stats.totalItems / (this.config.shortTermCapacity + this.config.longTermRetentionDays);
            if (compressionRatio > this.config.compressionThreshold) {
                // Identify candidates for compression
                const candidates = await this.identifyCompressionCandidates();
                if (this.config.clusteringEnabled) {
                    // Use clustering to group similar memories
                    const clusteringResult = await this.clustering.clusterVectors(candidates);
                    await this.compressClusteredMemories(clusteringResult);
                }
                else {
                    // Simple time-based compression
                    await this.compressOldMemories(candidates);
                }
                this.logger.debug('Memory compression completed');
                this.eventEmitter.emit('memory.compressed', { compressionRatio });
            }
        }
        catch (error) {
            this.logger.error('Failed to compress memory:', error);
        }
    }
    async optimizeMemory() {
        try {
            this.logger.debug('Starting memory optimization...');
            // Run garbage collection
            await this.cleanupExpiredMemories();
            // Optimize cache structures
            await this.optimizeCacheStructures();
            // Rebalance memory distribution
            await this.rebalanceMemoryDistribution();
            this.logger.debug('Memory optimization completed');
            this.eventEmitter.emit('memory.optimized');
        }
        catch (error) {
            this.logger.error('Failed to optimize memory:', error);
        }
    }
    async getMemoryStats() {
        try {
            const vectorStats = await this.vectorCache.getStats();
            const cacheStats = this.memoryCache.getStats();
            return {
                totalItems: vectorStats.size + cacheStats.size,
                shortTermItems: cacheStats.size,
                longTermItems: vectorStats.size,
                workingMemoryItems: await this.getWorkingMemoryCount(),
                memoryUsage: vectorStats.memoryUsage,
                compressionRatio: this.calculateCompressionRatio(),
                clusteringMetrics: await this.getClusteringMetrics()
            };
        }
        catch (error) {
            this.logger.error('Failed to get memory stats:', error);
            throw error;
        }
    }
    async deleteMemory(id) {
        try {
            const vectorDeleted = await this.vectorCache.delete(id);
            const cacheDeleted = this.memoryCache.delete(id);
            if (vectorDeleted || cacheDeleted) {
                this.eventEmitter.emit('memory.deleted', id);
                this.logger.debug(`Deleted memory item: ${id}`);
                return true;
            }
            return false;
        }
        catch (error) {
            this.logger.error(`Failed to delete memory item ${id}:`, error);
            return false;
        }
    }
    async clearMemory(type) {
        try {
            if (type) {
                // Clear specific type of memory
                await this.clearMemoryByType(type);
            }
            else {
                // Clear all memory
                await this.vectorCache.clear();
                this.memoryCache.clear();
            }
            this.eventEmitter.emit('memory.cleared', { type });
            this.logger.debug(`Cleared memory${type ? ` of type: ${type}` : ''}`);
        }
        catch (error) {
            this.logger.error('Failed to clear memory:', error);
        }
    }
    onModuleDestroy() {
        if (this.optimizationInterval) {
            clearInterval(this.optimizationInterval);
        }
        if (this.memoryLeakDetector) {
            clearInterval(this.memoryLeakDetector);
        }
    }
    async storeInWorkingMemory(item) {
        // Working memory has limited capacity and short TTL
        this.memoryCache.set(item.id, item, 300000); // 5 minutes TTL
    }
    async storeInShortTermMemory(item) {
        // Short-term memory uses regular cache
        this.memoryCache.set(item.id, item, 3600000); // 1 hour TTL
    }
    async storeInLongTermMemory(item) {
        // Long-term memory uses vector cache for similarity search
        await this.vectorCache.store(item);
    }
    calculateRelevanceScore(result, query) {
        let score = result.similarity;
        // Boost score based on importance
        if (result.item.importance) {
            score += result.item.importance * 0.2;
        }
        // Boost score based on recency
        const age = Date.now() - result.item.timestamp;
        const recencyBoost = Math.max(0, 1 - (age / (7 * 24 * 60 * 60 * 1000))); // 7 days
        score += recencyBoost * 0.1;
        // Boost score based on access frequency
        if (result.item.accessCount) {
            score += Math.min(0.1, result.item.accessCount * 0.01);
        }
        return Math.min(1, score);
    }
    async identifyCompressionCandidates() {
        // Implementation would identify memories that are candidates for compression
        // This could be based on age, importance, access frequency, etc.
        return [];
    }
    async compressClusteredMemories(clusteringResult) {
        // Implementation would compress memories based on clustering results
        // Similar memories could be merged or summarized
    }
    async compressOldMemories(candidates) {
        // Implementation would compress old memories using time-based criteria
    }
    async cleanupExpiredMemories() {
        // Implementation would remove expired memories
    }
    async optimizeCacheStructures() {
        // Implementation would optimize internal cache structures
    }
    async rebalanceMemoryDistribution() {
        // Implementation would rebalance memory across different storage types
    }
    async getWorkingMemoryCount() {
        // Implementation would count working memory items
        return 0;
    }
    calculateCompressionRatio() {
        // Implementation would calculate current compression ratio
        return 1.0;
    }
    async getClusteringMetrics() {
        // Implementation would return clustering metrics if available
        return undefined;
    }
    async clearMemoryByType(type) {
        // Implementation would clear memory items of specific type
    }
    initializeOptimization() {
        if (this.config.autoOptimize) {
            this.optimizationInterval = setInterval(async () => {
                await this.optimizeMemory();
                await this.compressMemory();
            }, 300000); // Every 5 minutes
        }
    }
    initializeMemoryLeakDetection() {
        this.memoryLeakDetector = setInterval(() => {
            const used = process.memoryUsage();
            if (used.heapUsed > 500 * 1024 * 1024) { // 500MB threshold
                this.logger.warn('High memory usage detected, triggering optimization');
                this.optimizeMemory();
            }
        }, 60000); // Every minute
    }
    generateId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
};
EnhancedMemoryManager = EnhancedMemoryManager_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService,
        EventEmitter2,
        VectorMemoryCache,
        MemoryCache,
        AdvancedClustering])
], EnhancedMemoryManager);
export { EnhancedMemoryManager };
