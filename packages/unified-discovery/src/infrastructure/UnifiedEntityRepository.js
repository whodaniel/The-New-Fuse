"use strict";
/**
 * Unified Entity Repository
 *
 * Repository implementation for unified entities with event sourcing
 * and adaptive storage strategies.
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
var UnifiedEntityRepository_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedEntityRepository = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
let UnifiedEntityRepository = UnifiedEntityRepository_1 = class UnifiedEntityRepository {
    eventPublisher;
    logger = new common_1.Logger(UnifiedEntityRepository_1.name);
    entities = new Map();
    indexes = {
        byArchetype: new Map(),
        bySource: new Map(),
        byCapability: new Map(),
        byTag: new Map()
    };
    constructor(eventPublisher) {
        this.eventPublisher = eventPublisher;
    }
    async save(entity) {
        this.logger.debug(`💾 Saving entity: ${entity.identity.name});
    
    // Store entity
    this.entities.set(entity.id.value, entity);
    
    // Update indexes
    this.updateIndexes(entity);
    
    // Publish domain events
    const publishableEntity = this.eventPublisher.mergeObjectContext(entity);
    publishableEntity.commit();
    `, this.logger.debug(`✅ Entity saved: ${entity.id.value}`));
    }
    async findById(id) {
        const entity = this.entities.get(id.value);
        return entity || null;
    }
    async findByName(name) {
        for (const entity of this.entities.values()) {
            if (entity.identity.name === name) {
                return entity;
            }
        }
        return null;
    }
    async findAll() {
        return Array.from(this.entities.values());
    }
    async search(query) {
        this.logger.debug(Searching, entities);
        with (query)
            : , query;
        ;
        let candidateIds = new Set();
        let isFirstFilter = true;
        // Apply filters using indexes
        if (query.archetypes && query.archetypes.length > 0) {
            const archetypeIds = new Set();
            for (const archetype of query.archetypes) {
                const ids = this.indexes.byArchetype.get(archetype);
                if (ids) {
                    ids.forEach(id => archetypeIds.add(id));
                }
            }
            candidateIds = isFirstFilter ? archetypeIds : this.intersect(candidateIds, archetypeIds);
            isFirstFilter = false;
        }
        if (query.sources && query.sources.length > 0) {
            const sourceIds = new Set();
            for (const source of query.sources) {
                const ids = this.indexes.bySource.get(source);
                if (ids) {
                    ids.forEach(id => sourceIds.add(id));
                }
            }
            candidateIds = isFirstFilter ? sourceIds : this.intersect(candidateIds, sourceIds);
            isFirstFilter = false;
        }
        if (query.capabilities && query.capabilities.length > 0) {
            const capabilityIds = new Set();
            for (const capability of query.capabilities) {
                const ids = this.indexes.byCapability.get(capability);
                if (ids) {
                    ids.forEach(id => capabilityIds.add(id));
                }
            }
            candidateIds = isFirstFilter ? capabilityIds : this.intersect(candidateIds, capabilityIds);
            isFirstFilter = false;
        }
        if (query.tags && query.tags.length > 0) {
            const tagIds = new Set();
            for (const tag of query.tags) {
                const ids = this.indexes.byTag.get(tag);
                if (ids) {
                    ids.forEach(id => tagIds.add(id));
                }
            }
            candidateIds = isFirstFilter ? tagIds : this.intersect(candidateIds, tagIds);
            isFirstFilter = false;
        }
        // If no filters applied, use all entities
        if (isFirstFilter) {
            candidateIds = new Set(this.entities.keys());
        }
        // Convert IDs to entities and apply additional filters
        let results = [];
        for (const id of candidateIds) {
            const entity = this.entities.get(id);
            if (entity && this.matchesQuery(entity, query)) {
                results.push(entity);
            }
        }
        // Apply sorting
        if (query.sortBy) {
            results = this.sortEntities(results, query.sortBy, query.sortOrder || 'asc');
        }
        // Apply pagination
        const totalCount = results.length;
        const offset = query.offset || 0;
        const limit = query.limit || 100;
        if (offset > 0 || limit < totalCount) {
            results = results.slice(offset, offset + limit);
        }
        const hasMore = offset + results.length < totalCount;
        this.logger.debug(Search, completed, $, { results, : .length } / $, { totalCount }, entities);
        return {
            entities: results,
            totalCount,
            hasMore
        };
    }
    async findSimilarEntities(entity, limit = 10) {
        const allEntities = Array.from(this.entities.values());
        const similarities = [];
        for (const other of allEntities) {
            if (other.id.equals(entity.id)) {
                continue;
            }
            const similarity = entity.calculateSimilarityWith(other);
            if (similarity > 0.1) { // Only include entities with some similarity
                similarities.push({ entity: other, similarity });
            }
        }
        // Sort by similarity (descending) and take top results
        similarities.sort((a, b) => b.similarity - a.similarity);
        return similarities.slice(0, limit).map(s => s.entity);
    }
    async findByCapabilityType(capabilityType) {
        const entityIds = this.indexes.byCapability.get(capabilityType);
        if (!entityIds) {
            return [];
        }
        const entities = [];
        for (const id of entityIds) {
            const entity = this.entities.get(id);
            if (entity) {
                entities.push(entity);
            }
        }
        return entities;
    }
    async getStatistics() {
        const entities = Array.from(this.entities.values());
        const statistics = {
            totalEntities: entities.length,
            activeEntities: entities.filter(e => e.isActive).length,
            byArchetype: this.getCountByKey(entities, e => e.archetype),
            bySource: this.getCountByKey(entities, e => e.metadata.discoverySource),
            byCapabilityCount: this.getCapabilityDistribution(entities),
            averageCapabilityScore: this.calculateAverageCapabilityScore(entities),
            lastUpdated: this.getLastUpdateTime(entities)
        };
        return statistics;
    }
    async delete(id) {
        const entity = this.entities.get(id.value);
        if (!entity) {
            return false;
        }
        // Remove from main storage
        this.entities.delete(id.value);
        // Remove from indexes
        this.removeFromIndexes(entity);
        `
    this.logger.debug(🗑️ Entity deleted: ${id.value}`;
        ;
        return true;
    }
    async clear() {
        this.entities.clear();
        this.clearIndexes();
        this.logger.log('🧹 Repository cleared');
    }
    // Private helper methods
    updateIndexes(entity) {
        const id = entity.id.value;
        // Index by archetype
        if (!this.indexes.byArchetype.has(entity.archetype)) {
            this.indexes.byArchetype.set(entity.archetype, new Set());
        }
        this.indexes.byArchetype.get(entity.archetype).add(id);
        // Index by source
        if (!this.indexes.bySource.has(entity.metadata.discoverySource)) {
            this.indexes.bySource.set(entity.metadata.discoverySource, new Set());
        }
        this.indexes.bySource.get(entity.metadata.discoverySource).add(id);
        // Index by capabilities
        for (const capability of entity.capabilities.getAllCapabilities()) {
            if (!this.indexes.byCapability.has(capability.type)) {
                this.indexes.byCapability.set(capability.type, new Set());
            }
            this.indexes.byCapability.get(capability.type).add(id);
        }
        // Index by tags
        for (const tag of entity.metadata.tags) {
            if (!this.indexes.byTag.has(tag)) {
                this.indexes.byTag.set(tag, new Set());
            }
            this.indexes.byTag.get(tag).add(id);
        }
    }
    removeFromIndexes(entity) {
        const id = entity.id.value;
        // Remove from archetype index
        this.indexes.byArchetype.get(entity.archetype)?.delete(id);
        // Remove from source index
        this.indexes.bySource.get(entity.metadata.discoverySource)?.delete(id);
        // Remove from capability indexes
        for (const capability of entity.capabilities.getAllCapabilities()) {
            this.indexes.byCapability.get(capability.type)?.delete(id);
        }
        // Remove from tag indexes
        for (const tag of entity.metadata.tags) {
            this.indexes.byTag.get(tag)?.delete(id);
        }
    }
    clearIndexes() {
        this.indexes.byArchetype.clear();
        this.indexes.bySource.clear();
        this.indexes.byCapability.clear();
        this.indexes.byTag.clear();
    }
    intersect(set1, set2) {
        const result = new Set();
        for (const item of set1) {
            if (set2.has(item)) {
                result.add(item);
            }
        }
        return result;
    }
    matchesQuery(entity, query) {
        // Apply additional filters that can't be indexed
        if (query.ids && !query.ids.includes(entity.id.value)) {
            return false;
        }
        if (query.isActive !== undefined && entity.isActive !== query.isActive) {
            return false;
        }
        return true;
    }
    sortEntities(entities, sortBy, sortOrder) {
        const multiplier = sortOrder === 'asc' ? 1 : -1;
        return entities.sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'name':
                    comparison = a.identity.name.localeCompare(b.identity.name);
                    break;
                case 'discoveredAt':
                    comparison = a.metadata.discoveredAt.getTime() - b.metadata.discoveredAt.getTime();
                    break;
                case 'lastUpdated':
                    comparison = a.metadata.lastUpdated.getTime() - b.metadata.lastUpdated.getTime();
                    break;
                case 'capabilityScore':
                    comparison = a.capabilities.getCapabilityScore() - b.capabilities.getCapabilityScore();
                    break;
                default:
                    comparison = 0;
            }
            return comparison * multiplier;
        });
    }
    getCountByKey(entities, keyExtractor) {
        const counts = {};
        for (const entity of entities) {
            const key = String(keyExtractor(entity));
            counts[key] = (counts[key] || 0) + 1;
        }
        return counts;
    }
    getCapabilityDistribution(entities) {
        const distribution = {};
        for (const entity of entities) {
            const capabilityCount = entity.capabilities.getAllCapabilities().length;
            const bucket = this.getCapabilityBucket(capabilityCount);
            distribution[bucket] = (distribution[bucket] || 0) + 1;
        }
        return distribution;
    }
    getCapabilityBucket(count) {
        if (count === 0)
            return '0';
        if (count <= 2)
            return '1-2';
        if (count <= 5)
            return '3-5';
        if (count <= 10)
            return '6-10';
        return '10+';
    }
    calculateAverageCapabilityScore(entities) {
        if (entities.length === 0)
            return 0;
        const totalScore = entities.reduce((sum, entity) => sum + entity.capabilities.getCapabilityScore(), 0);
        return totalScore / entities.length;
    }
    getLastUpdateTime(entities) {
        if (entities.length === 0)
            return null;
        return entities.reduce((latest, entity) => {
            return entity.metadata.lastUpdated > latest ? entity.metadata.lastUpdated : latest;
        }, new Date(0));
    }
};
exports.UnifiedEntityRepository = UnifiedEntityRepository;
exports.UnifiedEntityRepository = UnifiedEntityRepository = UnifiedEntityRepository_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cqrs_1.EventPublisher])
], UnifiedEntityRepository);
//# sourceMappingURL=UnifiedEntityRepository.js.map