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
var QdrantDriver_1;
import { Inject, Injectable, Logger } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
let QdrantDriver = QdrantDriver_1 = class QdrantDriver {
    constructor(config) {
        this.config = config;
        this.logger = new Logger(QdrantDriver_1.name);
        this.client = new QdrantClient({
            url: config.host || 'http://localhost:6333',
            apiKey: config.apiKey,
            timeout: config.timeout || 30000,
        });
        // Avoid startup crash loops from async constructor side effects.
        void this.initializeConnection().catch((error) => {
            this.logger.error('Deferred Qdrant initialization failed', error);
        });
    }
    async initializeConnection() {
        try {
            await this.client.getCollections();
            this.logger.log('Qdrant connection established successfully');
        }
        catch (error) {
            this.logger.error('Failed to connect to Qdrant', error);
            throw error;
        }
    }
    async createCollection(config) {
        try {
            const collectionConfig = {
                vectors: {
                    size: config.dimension,
                    distance: this.mapDistanceMetric(config.metric),
                },
                optimizers_config: {
                    default_segment_number: 2,
                    memmap_threshold: 20000,
                },
                replication_factor: 1,
            };
            await this.client.createCollection(config.name, collectionConfig);
            this.logger.log(`Collection "${config.name}" created successfully`);
        }
        catch (error) {
            if (error instanceof Error && error.message?.includes('already exists')) {
                this.logger.warn(`Collection "${config.name}" already exists`);
                return;
            }
            this.logger.error(`Failed to create collection "${config.name}"`, error);
            throw error;
        }
    }
    async deleteCollection(name) {
        try {
            await this.client.deleteCollection(name);
            this.logger.log(`Collection "${name}" deleted successfully`);
        }
        catch (error) {
            this.logger.error(`Failed to delete collection "${name}"`, error);
            throw error;
        }
    }
    async listCollections() {
        try {
            const response = await this.client.getCollections();
            return response.collections.map((collection) => collection.name);
        }
        catch (error) {
            this.logger.error('Failed to list collections', error);
            throw error;
        }
    }
    async collectionExists(name) {
        try {
            await this.client.getCollection(name);
            return true;
        }
        catch (error) {
            if (typeof error === 'object' &&
                error !== null &&
                'status' in error &&
                error.status === 404) {
                return false;
            }
            this.logger.error(`Failed to check if collection "${name}" exists`, error);
            throw error;
        }
    }
    async addDocuments(collection, documents) {
        try {
            const points = documents.map((doc) => ({
                id: doc.id || this.generateId(),
                vector: doc.embedding || [],
                payload: {
                    content: doc.content,
                    metadata: doc.metadata || {},
                    created_at: new Date().toISOString(),
                },
            }));
            await this.client.upsert(collection, {
                wait: true,
                points,
            });
            this.logger.log(`Added ${documents.length} documents to collection "${collection}"`);
        }
        catch (error) {
            this.logger.error(`Failed to add documents to collection "${collection}"`, error);
            throw error;
        }
    }
    async updateDocument(collection, id, document) {
        try {
            // First, get the existing document
            const existing = await this.getDocument(collection, id);
            if (!existing) {
                throw new Error(`Document with id "${id}" not found in collection "${collection}"`);
            }
            // Merge the updates
            const updatedDocument = {
                id,
                content: document.content !== undefined ? document.content : existing.content,
                metadata: document.metadata !== undefined
                    ? { ...existing.metadata, ...document.metadata }
                    : existing.metadata,
                embedding: document.embedding !== undefined ? document.embedding : existing.embedding,
            };
            // Upsert the updated document
            await this.addDocuments(collection, [updatedDocument]);
            this.logger.log(`Updated document "${id}" in collection "${collection}"`);
        }
        catch (error) {
            this.logger.error(`Failed to update document "${id}" in collection "${collection}"`, error);
            throw error;
        }
    }
    async deleteDocument(collection, id) {
        try {
            await this.client.delete(collection, {
                wait: true,
                points: [id],
            });
            this.logger.log(`Deleted document "${id}" from collection "${collection}"`);
        }
        catch (error) {
            this.logger.error(`Failed to delete document "${id}" from collection "${collection}"`, error);
            throw error;
        }
    }
    async getDocument(collection, id) {
        try {
            const response = await this.client.retrieve(collection, {
                ids: [id],
                with_payload: true,
                with_vector: true,
            });
            if (response.length === 0) {
                return null;
            }
            const point = response[0];
            return {
                id: point.id,
                content: point.payload?.content,
                metadata: point.payload?.metadata,
                embedding: point.vector,
            };
        }
        catch (error) {
            this.logger.error(`Failed to get document "${id}" from collection "${collection}"`, error);
            throw error;
        }
    }
    async similaritySearch(collection, query) {
        try {
            if (!query.embedding) {
                throw new Error('Embedding is required for similarity search');
            }
            const searchParams = {
                vector: query.embedding,
                limit: query.limit || 10,
                with_payload: true,
                with_vector: false,
                score_threshold: query.threshold || 0.0,
            };
            // Add metadata filtering if provided
            if (query.metadata_filter) {
                searchParams.filter = {
                    must: Object.entries(query.metadata_filter).map(([key, value]) => ({
                        key: `metadata.${key}`,
                        match: { value },
                    })),
                };
            }
            const response = await this.client.search(collection, searchParams);
            return response.map((point) => ({
                id: point.id,
                content: point.payload?.content,
                metadata: point.payload?.metadata,
                score: point.score,
                distance: 1 - point.score, // Convert score to distance
            }));
        }
        catch (error) {
            this.logger.error(`Failed to perform similarity search in collection "${collection}"`, error);
            throw error;
        }
    }
    async hybridSearch(collection, query) {
        // For now, hybrid search is the same as similarity search
        // In the future, this could combine vector similarity with full-text search
        return this.similaritySearch(collection, query);
    }
    async batchAdd(collection, documents) {
        // Process in batches to avoid memory issues
        const batchSize = 100;
        for (let i = 0; i < documents.length; i += batchSize) {
            const batch = documents.slice(i, i + batchSize);
            await this.addDocuments(collection, batch);
        }
    }
    async batchDelete(collection, ids) {
        try {
            await this.client.delete(collection, {
                wait: true,
                points: ids,
            });
            this.logger.log(`Deleted ${ids.length} documents from collection "${collection}"`);
        }
        catch (error) {
            this.logger.error(`Failed to batch delete documents from collection "${collection}"`, error);
            throw error;
        }
    }
    async isHealthy() {
        try {
            await this.client.getCollections();
            return true;
        }
        catch (error) {
            this.logger.error('Health check failed', error);
            return false;
        }
    }
    async getStats(collection) {
        try {
            if (collection) {
                const info = await this.client.getCollection(collection);
                return {
                    collection,
                    vectors_count: info.indexed_vectors_count || 0, // Fixed: API changed from vectors_count to indexed_vectors_count
                    indexed_vectors_count: info.indexed_vectors_count || 0,
                    points_count: info.points_count || 0,
                    segments_count: info.segments_count || 0,
                    config: info.config,
                    status: info.status,
                };
            }
            else {
                const collections = await this.listCollections();
                const stats = {
                    total_collections: collections.length,
                    collections: {},
                };
                for (const coll of collections) {
                    stats.collections[coll] = await this.getStats(coll);
                }
                return stats;
            }
        }
        catch (error) {
            this.logger.error('Failed to get stats', error);
            throw error;
        }
    }
    mapDistanceMetric(metric) {
        switch (metric.toLowerCase()) {
            case 'cosine':
                return 'Cosine';
            case 'euclidean':
                return 'Euclid';
            case 'dot':
            case 'dot_product':
            case 'dotproduct':
                return 'Dot';
            default:
                return 'Cosine';
        }
    }
    generateId() {
        return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
};
QdrantDriver = QdrantDriver_1 = __decorate([
    Injectable(),
    __param(0, Inject('VECTOR_DB_CONFIG')),
    __metadata("design:paramtypes", [Object])
], QdrantDriver);
export { QdrantDriver };
//# sourceMappingURL=qdrant.driver.js.map