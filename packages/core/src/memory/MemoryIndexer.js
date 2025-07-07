var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MemoryIndexer_1;
import { Injectable, Logger } from '@nestjs/common';
let MemoryIndexer = MemoryIndexer_1 = class MemoryIndexer {
    constructor() {
        this.logger = new Logger(MemoryIndexer_1.name);
        this.textIndex = new Map();
        this.metadataIndex = new Map();
        this.tagIndex = new Map();
        this.timestampIndex = new Map();
        this.logger.log('Initializing MemoryIndexer');
        this.similarityThreshold = parseFloat(process.env.SIMILARITY_THRESHOLD || '0.8');
    }
    async indexMemoryItem(item) {
        try {
            this.logger.debug(`Indexing memory item: ${item.id}`);
            const indexEntry = {
                id: item.id,
                content: item.content,
                metadata: item.metadata,
                tags: item.tags || [],
                timestamp: item.timestamp,
                embedding: item.embedding,
                importance: item.importance,
            };
            // Index text content
            await this.indexText(indexEntry);
            // Index metadata
            await this.indexMetadata(indexEntry);
            // Index tags
            await this.indexTags(indexEntry);
            // Index timestamp
            this.timestampIndex.set(indexEntry.id, indexEntry.timestamp.toString());
            this.logger.debug(`Successfully indexed memory item: ${item.id}`);
        }
        catch (error) {
            this.logger.error(`Failed to index memory item ${item.id}:`, error);
            throw error;
        }
    }
    async removeFromIndex(itemId) {
        try {
            this.logger.debug(`Removing item from index: ${itemId}`);
            // Remove from text index
            for (const [term, itemIds] of this.textIndex.entries()) {
                itemIds.delete(itemId);
                if (itemIds.size === 0) {
                    this.textIndex.delete(term);
                }
            }
            // Remove from metadata index
            for (const [key, itemIds] of this.metadataIndex.entries()) {
                itemIds.delete(itemId);
                if (itemIds.size === 0) {
                    this.metadataIndex.delete(key);
                }
            }
            // Remove from tag index
            for (const [tag, itemIds] of this.tagIndex.entries()) {
                itemIds.delete(itemId);
                if (itemIds.size === 0) {
                    this.tagIndex.delete(tag);
                }
            }
            // Remove from timestamp index
            this.timestampIndex.delete(itemId);
            this.logger.debug(`Successfully removed item from index: ${itemId}`);
        }
        catch (error) {
            this.logger.error(`Failed to remove item from index ${itemId}:`, error);
            throw error;
        }
    }
    async search(query, options = {}) {
        try {
            this.logger.debug('Executing search query');
            let candidateIds = new Set();
            let isFirstConstraint = true;
            // Text search
            if (query.text) {
                const textCandidates = await this.searchText(query.text);
                candidateIds = isFirstConstraint ? textCandidates : this.intersectSets(candidateIds, textCandidates);
                isFirstConstraint = false;
            }
            // Tag search
            if (query.tags && query.tags.length > 0) {
                const tagCandidates = await this.searchTags(query.tags);
                candidateIds = isFirstConstraint ? tagCandidates : this.intersectSets(candidateIds, tagCandidates);
                isFirstConstraint = false;
            }
            // Metadata filters
            if (query.filters) {
                const metadataCandidates = await this.searchMetadata(query.filters);
                candidateIds = isFirstConstraint ? metadataCandidates : this.intersectSets(candidateIds, metadataCandidates);
                isFirstConstraint = false;
            }
            // Cluster filter
            if (query.clusterId) {
                const clusterCandidates = await this.searchByCluster(query.clusterId);
                candidateIds = isFirstConstraint ? clusterCandidates : this.intersectSets(candidateIds, clusterCandidates);
                isFirstConstraint = false;
            }
            // Date range filter
            if (query.dateRange) {
                const dateCandidates = await this.searchByDateRange(query.dateRange.start, query.dateRange.end);
                candidateIds = isFirstConstraint ? dateCandidates : this.intersectSets(candidateIds, dateCandidates);
                isFirstConstraint = false;
            }
            // Convert to array and apply pagination
            const resultIds = Array.from(candidateIds);
            const start = options.offset || 0;
            const limit = options.limit || 100;
            this.logger.debug(`Found ${resultIds.length} candidates, returning ${Math.min(limit, resultIds.length - start)}`);
            return resultIds.slice(start, start + limit);
        }
        catch (error) {
            this.logger.error('Search failed:', error);
            throw error;
        }
    }
    async reindex(items) {
        try {
            this.logger.log(`Reindexing ${items.length} memory items`);
            // Clear existing indices
            this.textIndex.clear();
            this.metadataIndex.clear();
            this.tagIndex.clear();
            this.timestampIndex.clear();
            // Reindex all items
            for (const item of items) {
                await this.indexMemoryItem(item);
            }
            this.logger.log('Reindexing completed successfully');
        }
        catch (error) {
            this.logger.error('Reindexing failed:', error);
            throw error;
        }
    }
    async indexText(entry) {
        const tokens = this.tokenize(entry.content);
        for (const token of tokens) {
            const normalizedToken = token.toLowerCase();
            if (!this.textIndex.has(normalizedToken)) {
                this.textIndex.set(normalizedToken, new Set());
            }
            this.textIndex.get(normalizedToken).add(entry.id);
        }
    }
    async indexMetadata(entry) {
        for (const [key, value] of Object.entries(entry.metadata)) {
            if (typeof value === 'string' || typeof value === 'number') {
                const indexKey = `${key}:${value}`;
                if (!this.metadataIndex.has(indexKey)) {
                    this.metadataIndex.set(indexKey, new Set());
                }
                this.metadataIndex.get(indexKey).add(entry.id);
            }
            else if (typeof value === 'object' && value !== null) {
                // Handle nested objects
                const flattenedKeys = this.flattenObject(value, key);
                for (const flatKey of flattenedKeys) {
                    if (!this.metadataIndex.has(flatKey)) {
                        this.metadataIndex.set(flatKey, new Set());
                    }
                    this.metadataIndex.get(flatKey).add(entry.id);
                }
            }
        }
    }
    async indexTags(entry) {
        for (const tag of entry.tags) {
            const normalizedTag = tag.toLowerCase();
            if (!this.tagIndex.has(normalizedTag)) {
                this.tagIndex.set(normalizedTag, new Set());
            }
            this.tagIndex.get(normalizedTag).add(entry.id);
        }
    }
    async searchText(text) {
        const tokens = this.tokenize(text);
        const candidateSets = [];
        for (const token of tokens) {
            const normalizedToken = token.toLowerCase();
            const itemIds = this.textIndex.get(normalizedToken);
            if (itemIds) {
                candidateSets.push(itemIds);
            }
        }
        return candidateSets.length > 0 ? this.intersectMultipleSets(candidateSets) : new Set();
    }
    async searchTags(tags) {
        const candidateSets = [];
        for (const tag of tags) {
            const normalizedTag = tag.toLowerCase();
            const itemIds = this.tagIndex.get(normalizedTag);
            if (itemIds) {
                candidateSets.push(itemIds);
            }
        }
        return candidateSets.length > 0 ? this.intersectMultipleSets(candidateSets) : new Set();
    }
    async searchMetadata(filters) {
        const candidateSets = [];
        for (const [key, value] of Object.entries(filters)) {
            const indexKey = `${key}:${value}`;
            const itemIds = this.metadataIndex.get(indexKey);
            if (itemIds) {
                candidateSets.push(itemIds);
            }
        }
        return candidateSets.length > 0 ? this.intersectMultipleSets(candidateSets) : new Set();
    }
    async searchByCluster(clusterId) {
        const indexKey = `clusterId:${clusterId}`;
        return this.metadataIndex.get(indexKey) || new Set();
    }
    async searchByDateRange(start, end) {
        const candidates = new Set();
        for (const [itemId, timestamp] of this.timestampIndex.entries()) {
            const ts = parseInt(timestamp, 10);
            if (ts >= start && ts <= end) {
                candidates.add(itemId);
            }
        }
        return candidates;
    }
    tokenize(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(token => token.length > 2);
    }
    flattenObject(obj, prefix) {
        const flattened = [];
        for (const [key, value] of Object.entries(obj)) {
            const newKey = `${prefix}.${key}`;
            if (typeof value === 'string' || typeof value === 'number') {
                flattened.push(`${newKey}:${value}`);
            }
            else if (typeof value === 'object' && value !== null) {
                flattened.push(...this.flattenObject(value, newKey));
            }
        }
        return flattened;
    }
    intersectSets(set1, set2) {
        const intersection = new Set();
        for (const item of set1) {
            if (set2.has(item)) {
                intersection.add(item);
            }
        }
        return intersection;
    }
    intersectMultipleSets(sets) {
        if (sets.length === 0)
            return new Set();
        if (sets.length === 1)
            return sets[0];
        return sets.reduce((acc, set) => this.intersectSets(acc, set));
    }
    getIndexStats() {
        return {
            textTerms: this.textIndex.size,
            metadataKeys: this.metadataIndex.size,
            tags: this.tagIndex.size,
            totalItems: this.timestampIndex.size,
        };
    }
};
MemoryIndexer = MemoryIndexer_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], MemoryIndexer);
export { MemoryIndexer };
