"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var VectorDatabaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorDatabaseService = void 0;
const common_1 = require("@nestjs/common");
const pgvector_driver_1 = require("./drivers/pgvector.driver");
const openai_embedding_provider_1 = require("./drivers/openai-embedding.provider");
let VectorDatabaseService = VectorDatabaseService_1 = class VectorDatabaseService {
    dbConfig;
    embeddingConfig;
    logger = new common_1.Logger(VectorDatabaseService_1.name);
    vectorDb;
    embeddingProvider;
    constructor(dbConfig, embeddingConfig) {
        this.dbConfig = dbConfig;
        this.embeddingConfig = embeddingConfig;
    }
    async onModuleInit() {
        await this.initializeProviders();
        this.logger.log('Vector Database Service initialized');
    }
    async initializeProviders() {
        // Initialize vector database driver
        switch (this.dbConfig.provider) {
            case 'pgvector':
                this.vectorDb = new pgvector_driver_1.PgVectorDriver(this.dbConfig);
                break;
            case 'chroma':
            case 'weaviate':
            case 'pinecone':
                throw new Error(`Vector database provider "${this.dbConfig.provider}" not yet implemented);
      default:`);
                throw new Error(`Unknown vector database provider: ${this.dbConfig.provider}`);
        }
        // Initialize embedding provider
        switch (this.embeddingConfig.provider) {
            case 'openai':
                this.embeddingProvider = new openai_embedding_provider_1.OpenAIEmbeddingProvider(this.embeddingConfig);
                break;
            case 'huggingface':
            case 'custom':
                throw new Error(Embedding, provider, "${this.embeddingConfig.provider}", not, yet, implemented);
            default:
                `
        throw new Error(Unknown embedding provider: ${this.embeddingConfig.provider}`;
                ;
        }
    }
    // Collection Management
    async createCollection(config) {
        return this.vectorDb.createCollection(config);
    }
    async deleteCollection(name) {
        return this.vectorDb.deleteCollection(name);
    }
    async listCollections() {
        return this.vectorDb.listCollections();
    }
    async collectionExists(name) {
        return this.vectorDb.collectionExists(name);
    }
    // Document Operations with Automatic Embedding
    async addDocuments(collection, documents) {
        const documentsWithEmbeddings = await Promise.all(documents.map(async (doc) => {
            if (!doc.embedding && doc.content) {
                doc.embedding = await this.embeddingProvider.generateEmbedding(doc.content);
            }
            return doc;
        }));
        return this.vectorDb.addDocuments(collection, documentsWithEmbeddings);
    }
    async updateDocument(collection, id, document) {
        if (document.content && !document.embedding) {
            document.embedding = await this.embeddingProvider.generateEmbedding(document.content);
        }
        return this.vectorDb.updateDocument(collection, id, document);
    }
    async deleteDocument(collection, id) {
        return this.vectorDb.deleteDocument(collection, id);
    }
    async getDocument(collection, id) {
        return this.vectorDb.getDocument(collection, id);
    }
    // Search Operations with Automatic Embedding
    async searchByText(collection, query, options = {}) {
        const embedding = await this.embeddingProvider.generateEmbedding(query);
        const vectorQuery = {
            query,
            embedding,
            limit: 10,
            threshold: 0.7,
            ...options,
        };
        return this.vectorDb.similaritySearch(collection, vectorQuery);
    }
    async searchByEmbedding(collection, embedding, options = {}) {
        const vectorQuery = {
            embedding,
            limit: 10,
            threshold: 0.7,
            ...options,
        };
        return this.vectorDb.similaritySearch(collection, vectorQuery);
    }
    async hybridSearch(collection, query) {
        if (query.query && !query.embedding) {
            query.embedding = await this.embeddingProvider.generateEmbedding(query.query);
        }
        return this.vectorDb.hybridSearch(collection, query);
    }
    // Batch Operations
    async batchAddDocuments(collection, documents) {
        // Generate embeddings for documents that don't have them
        const textsToEmbed = documents
            .filter(doc => !doc.embedding && doc.content)
            .map(doc => doc.content);
        if (textsToEmbed.length > 0) {
            const embeddings = await this.embeddingProvider.generateEmbeddings(textsToEmbed);
            let embeddingIndex = 0;
            documents.forEach(doc => {
                if (!doc.embedding && doc.content) {
                    doc.embedding = embeddings[embeddingIndex++];
                }
            });
        }
        return this.vectorDb.batchAdd(collection, documents);
    }
    async batchDeleteDocuments(collection, ids) {
        return this.vectorDb.batchDelete(collection, ids);
    }
    // Utility Methods
    async generateEmbedding(text) {
        return this.embeddingProvider.generateEmbedding(text);
    }
    async generateEmbeddings(texts) {
        return this.embeddingProvider.generateEmbeddings(texts);
    }
    getEmbeddingDimension() {
        return this.embeddingProvider.getDimension();
    }
    getEmbeddingModel() {
        return this.embeddingProvider.getModelName();
    }
    // Health & Metrics
    async isHealthy() {
        try {
            const dbHealthy = await this.vectorDb.isHealthy();
            // Test embedding provider by generating a small embedding
            await this.embeddingProvider.generateEmbedding('health check');
            return dbHealthy;
        }
        catch (error) {
            this.logger.error('Health check failed', error);
            return false;
        }
    }
    async getStats(collection) {
        const dbStats = await this.vectorDb.getStats(collection);
        return {
            ...dbStats,
            embedding_provider: {
                model: this.getEmbeddingModel(),
                dimension: this.getEmbeddingDimension(),
            },
        };
    }
    // Advanced Search Features
    async semanticSearch(collection, query, options = {}) {
        return this.searchByText(collection, query, {
            limit: options.limit || 10,
            threshold: options.threshold || 0.7,
            metadata_filter: options.metadata_filter,
        });
    }
    async findSimilarDocuments(collection, documentId, options = {}) {
        // Get the document to find its embedding
        const document = await this.getDocument(collection, documentId);
        if (!document || !document.embedding) {
            throw new Error(Document, "${documentId}", not, found, or, has, no, embedding `);
    }

    return this.searchByEmbedding(collection, document.embedding, {
      limit: options.limit || 10,
      threshold: options.threshold || 0.7,
      metadata_filter: options.metadata_filter,
    });
  }
});
        }
    }
};
exports.VectorDatabaseService = VectorDatabaseService;
exports.VectorDatabaseService = VectorDatabaseService = VectorDatabaseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object, Object])
], VectorDatabaseService);
//# sourceMappingURL=vector-database.service.js.map