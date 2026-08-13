"use strict";
/**
 * @fileoverview Production-ready memory system for agent knowledge management
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MemorySystem_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemorySystem = void 0;
const common_1 = require("@nestjs/common");
const types_js_1 = require("../constants/types.js");
let MemorySystem = MemorySystem_1 = class MemorySystem {
    constructor(config) {
        this.logger = new common_1.Logger(MemorySystem_1.name);
        this.state = types_js_1.ServiceState.UNINITIALIZED;
        this.memories = new Map();
        this.memoryIndex = new Map(); // keyword -> memory IDs
        this.config = {
            provider: 'local',
            connectionString: 'memory://local',
            maxMemorySize: 100 * 1024 * 1024, // 100MB
            retentionPolicy: {
                defaultTTL: 24 * 60 * 60, // 24 hours
                maxAge: 7 * 24 * 60 * 60, // 7 days
                maxItems: 10000,
                cleanupInterval: 60 * 60, // 1 hour
                priorityBased: true,
            },
            indexingStrategy: 'immediate',
            ...config,
        };
    }
    async start() {
        if (this.state === types_js_1.ServiceState.RUNNING) {
            this.logger.warn('MemorySystem is already running');
            return;
        }
        try {
            this.state = types_js_1.ServiceState.INITIALIZING;
            this.logger.log('Starting MemorySystem');
            // Start cleanup interval
            setInterval(() => {
                this.performCleanup().catch(error => {
                    this.logger.error('Memory cleanup failed', error);
                });
            }, this.config.retentionPolicy.cleanupInterval * 1000);
            this.state = types_js_1.ServiceState.RUNNING;
            this.logger.log('MemorySystem started successfully');
        }
        catch (error) {
            this.state = types_js_1.ServiceState.ERROR;
            this.logger.error('Failed to start MemorySystem', error);
            throw error;
        }
    }
    async stop() {
        if (this.state === types_js_1.ServiceState.STOPPED) {
            this.logger.warn('MemorySystem is already stopped');
            return;
        }
        try {
            this.state = types_js_1.ServiceState.STOPPING;
            this.logger.log('Stopping MemorySystem');
            this.state = types_js_1.ServiceState.STOPPED;
            this.logger.log('MemorySystem stopped successfully');
        }
        catch (error) {
            this.state = types_js_1.ServiceState.ERROR;
            this.logger.error('Failed to stop MemorySystem', error);
            throw error;
        }
    }
    getState() {
        return this.state;
    }
    async store(content) {
        const id = `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();
        const memoryContent = {
            ...content,
            id,
            createdAt: now,
            updatedAt: now,
            accessCount: 0,
            lastAccessed: now,
        };
        this.memories.set(id, memoryContent);
        // Index the content for search
        await this.indexContent(memoryContent);
        this.logger.debug(`Stored memory: ${id}`, {
            type: content.type,
            contentLength: content.content.length,
            tags: content.metadata.tags,
        });
        return id;
    }
    async retrieve(id) {
        const memory = this.memories.get(id);
        if (!memory) {
            return null;
        }
        // Update access statistics
        memory.accessCount++;
        memory.lastAccessed = new Date();
        this.logger.debug(`Retrieved memory: ${id}`, {
            accessCount: memory.accessCount,
        });
        return memory;
    }
    async update(id, updates) {
        const memory = this.memories.get(id);
        if (!memory) {
            return null;
        }
        const updatedMemory = {
            ...memory,
            ...updates,
            updatedAt: new Date(),
        };
        this.memories.set(id, updatedMemory);
        // Re-index if content changed
        if (updates.content || updates.metadata) {
            await this.reindexContent(memory, updatedMemory);
        }
        this.logger.debug(`Updated memory: ${id}`);
        return updatedMemory;
    }
    async delete(id) {
        const memory = this.memories.get(id);
        if (!memory) {
            return false;
        }
        this.memories.delete(id);
        await this.removeFromIndex(memory);
        this.logger.debug(`Deleted memory: ${id}`);
        return true;
    }
    async search(query) {
        const startTime = Date.now();
        const results = [];
        // Get all memories that match the basic criteria
        let candidateMemories = Array.from(this.memories.values());
        // Filter by type
        if (query.type) {
            candidateMemories = candidateMemories.filter(m => m.type === query.type);
        }
        // Filter by agent ID
        if (query.agentId) {
            candidateMemories = candidateMemories.filter(m => m.metadata.agentId === query.agentId);
        }
        // Filter by tags
        if (query.tags && query.tags.length > 0) {
            candidateMemories = candidateMemories.filter(m => query.tags.some(tag => m.metadata.tags.includes(tag)));
        }
        // Filter by time range
        if (query.timeRange) {
            candidateMemories = candidateMemories.filter(m => m.createdAt >= query.timeRange.start && m.createdAt <= query.timeRange.end);
        }
        // Perform text search and calculate relevance scores
        const searchResults = candidateMemories.map(memory => {
            const relevanceScore = this.calculateRelevanceScore(memory, query.query);
            return {
                content: memory,
                relevanceScore,
                matchedTerms: this.getMatchedTerms(memory, query.query),
            };
        });
        // Filter by minimum relevance
        const filteredResults = searchResults.filter(result => result.relevanceScore >= (query.minRelevance || 0));
        // Sort by relevance score
        filteredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
        // Apply limit
        const limitedResults = query.limit ? filteredResults.slice(0, query.limit) : filteredResults;
        const queryTime = Date.now() - startTime;
        this.logger.debug(`Memory search completed`, {
            query: query.query,
            totalResults: filteredResults.length,
            returnedResults: limitedResults.length,
            queryTime,
        });
        return {
            results: limitedResults,
            totalCount: filteredResults.length,
            queryTime,
            suggestions: this.generateSearchSuggestions(query.query),
        };
    }
    async getStats() {
        const memories = Array.from(this.memories.values());
        const totalSize = memories.reduce((size, memory) => size + memory.content.length, 0);
        const averageRelevance = memories.reduce((sum, memory) => sum + (memory.metadata.relevanceScore || 0), 0) / memories.length;
        const mostAccessedItems = memories
            .sort((a, b) => b.accessCount - a.accessCount)
            .slice(0, 10);
        return {
            totalItems: memories.length,
            totalSize,
            averageRelevance: averageRelevance || 0,
            mostAccessedItems,
            recentOperations: [], // Would be populated from operation log
            storageUtilization: (totalSize / this.config.maxMemorySize) * 100,
            indexingStatus: 'up-to-date',
        };
    }
    async indexContent(memory) {
        const keywords = this.extractKeywords(memory.content);
        for (const keyword of keywords) {
            if (!this.memoryIndex.has(keyword)) {
                this.memoryIndex.set(keyword, new Set());
            }
            this.memoryIndex.get(keyword).add(memory.id);
        }
        // Index tags
        for (const tag of memory.metadata.tags) {
            if (!this.memoryIndex.has(tag)) {
                this.memoryIndex.set(tag, new Set());
            }
            this.memoryIndex.get(tag).add(memory.id);
        }
    }
    async reindexContent(oldMemory, newMemory) {
        await this.removeFromIndex(oldMemory);
        await this.indexContent(newMemory);
    }
    async removeFromIndex(memory) {
        const keywords = this.extractKeywords(memory.content);
        for (const keyword of keywords) {
            const memorySet = this.memoryIndex.get(keyword);
            if (memorySet) {
                memorySet.delete(memory.id);
                if (memorySet.size === 0) {
                    this.memoryIndex.delete(keyword);
                }
            }
        }
        // Remove from tag index
        for (const tag of memory.metadata.tags) {
            const memorySet = this.memoryIndex.get(tag);
            if (memorySet) {
                memorySet.delete(memory.id);
                if (memorySet.size === 0) {
                    this.memoryIndex.delete(tag);
                }
            }
        }
    }
    extractKeywords(content) {
        // Simple keyword extraction - can be enhanced with NLP
        return content
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2)
            .filter(word => !this.isStopWord(word));
    }
    isStopWord(word) {
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
            'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
            'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
        ]);
        return stopWords.has(word);
    }
    calculateRelevanceScore(memory, query) {
        const queryTerms = this.extractKeywords(query);
        const contentTerms = this.extractKeywords(memory.content);
        if (queryTerms.length === 0)
            return 0;
        let matchCount = 0;
        for (const term of queryTerms) {
            if (contentTerms.includes(term)) {
                matchCount++;
            }
        }
        const baseScore = matchCount / queryTerms.length;
        // Boost score based on importance and access count
        const importanceBoost = memory.metadata.importance || 0.5;
        const accessBoost = Math.min(memory.accessCount / 10, 0.2); // Max 20% boost
        return Math.min(baseScore + importanceBoost * 0.3 + accessBoost, 1.0);
    }
    getMatchedTerms(memory, query) {
        const queryTerms = this.extractKeywords(query);
        const contentTerms = this.extractKeywords(memory.content);
        return queryTerms.filter(term => contentTerms.includes(term));
    }
    generateSearchSuggestions(query) {
        // Simple suggestion generation based on indexed keywords
        const queryTerms = this.extractKeywords(query);
        const suggestions = [];
        for (const [keyword, memoryIds] of this.memoryIndex) {
            if (memoryIds.size > 0 && !queryTerms.includes(keyword)) {
                // Check if this keyword appears with query terms
                const relatedMemories = Array.from(memoryIds).map(id => this.memories.get(id)).filter(Boolean);
                const hasRelation = relatedMemories.some(memory => queryTerms.some(term => memory.content.toLowerCase().includes(term)));
                if (hasRelation) {
                    suggestions.push(keyword);
                }
            }
        }
        return suggestions.slice(0, 5); // Return top 5 suggestions
    }
    async performCleanup() {
        const now = Date.now();
        const memories = Array.from(this.memories.values());
        const policy = this.config.retentionPolicy;
        let deletedCount = 0;
        // Remove expired memories
        for (const memory of memories) {
            const age = (now - memory.createdAt.getTime()) / 1000;
            const ttl = memory.metadata.expiresAt
                ? (memory.metadata.expiresAt.getTime() - memory.createdAt.getTime()) / 1000
                : policy.defaultTTL;
            if (age > ttl || age > policy.maxAge) {
                await this.delete(memory.id);
                deletedCount++;
            }
        }
        // Remove excess memories if over limit
        if (this.memories.size > policy.maxItems) {
            const sortedMemories = Array.from(this.memories.values())
                .sort((a, b) => {
                if (policy.priorityBased) {
                    // Sort by importance and access count
                    const scoreA = (a.metadata.importance || 0) + (a.accessCount / 100);
                    const scoreB = (b.metadata.importance || 0) + (b.accessCount / 100);
                    return scoreA - scoreB; // Ascending (least important first)
                }
                else {
                    // Sort by age (oldest first)
                    return a.createdAt.getTime() - b.createdAt.getTime();
                }
            });
            const excessCount = this.memories.size - policy.maxItems;
            for (let i = 0; i < excessCount; i++) {
                await this.delete(sortedMemories[i].id);
                deletedCount++;
            }
        }
        if (deletedCount > 0) {
            this.logger.debug(`Memory cleanup completed`, { deletedCount });
        }
    }
};
exports.MemorySystem = MemorySystem;
exports.MemorySystem = MemorySystem = MemorySystem_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], MemorySystem);
//# sourceMappingURL=MemorySystem.js.map