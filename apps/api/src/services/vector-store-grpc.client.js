var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var VectorStoreGrpcClient_1;
import { Injectable, Logger } from '@nestjs/common';
import { credentials } from '@grpc/grpc-js';
import { promisify } from 'util';
import { join } from 'path';
let VectorStoreGrpcClient = VectorStoreGrpcClient_1 = class VectorStoreGrpcClient {
    logger = new Logger(VectorStoreGrpcClient_1.name);
    client;
    grpcUrl;
    constructor() {
        this.grpcUrl = process.env.VECTOR_DB_GRPC_URL || 'localhost:50051';
    }
    async onModuleInit() {
        try {
            // Dynamic import of gRPC client (will be generated from proto)
            const grpc = require('@grpc/grpc-js');
            const protoLoader = require('@grpc/proto-loader');
            const protoPath = join(__dirname, '../../../proto-definitions/proto/vector_store.proto');
            const packageDefinition = protoLoader.loadSync(protoPath, {
                keepCase: true,
                longs: String,
                enums: String,
                defaults: true,
                oneofs: true,
            });
            const vectorStoreProto = grpc.loadPackageDefinition(packageDefinition).vectorstore.v1;
            this.client = new vectorStoreProto.VectorStoreService(this.grpcUrl, credentials.createInsecure(), // Use SSL in production
            {
                'grpc.keepalive_time_ms': 120000,
                'grpc.keepalive_timeout_ms': 5000,
                'grpc.keepalive_permit_without_calls': true,
                'grpc.http2.max_pings_without_data': 0,
                'grpc.http2.min_time_between_pings_ms': 10000,
                'grpc.http2.min_ping_interval_without_data_ms': 300000,
            });
            this.logger.log(`Connected to Vector Store gRPC service at ${this.grpcUrl}`);
        }
        catch (error) {
            this.logger.error('Failed to initialize gRPC client:', error);
            throw error;
        }
    }
    async onModuleDestroy() {
        if (this.client) {
            // Close gRPC client connection
            this.logger.log('Closing Vector Store gRPC client connection');
        }
    }
    // Collection Management
    async createCollection(request) {
        const createCollection = promisify(this.client.createCollection.bind(this.client));
        try {
            const response = await createCollection({
                name: request.name,
                dimension: request.dimension,
                metric: request.metric || 'cosine',
                config: request.config || {},
            });
            return response;
        }
        catch (error) {
            this.logger.error(`Failed to create collection ${request.name}:`, error);
            throw error;
        }
    }
    async deleteCollection(name) {
        const deleteCollection = promisify(this.client.deleteCollection.bind(this.client));
        try {
            const response = await deleteCollection({ name });
            return response;
        }
        catch (error) {
            this.logger.error(`Failed to delete collection ${name}:`, error);
            throw error;
        }
    }
    async listCollections() {
        const listCollections = promisify(this.client.listCollections.bind(this.client));
        try {
            const response = await listCollections({});
            return response;
        }
        catch (error) {
            this.logger.error('Failed to list collections:', error);
            throw error;
        }
    }
    // Document Operations
    async upsertDocuments(request) {
        const upsertDocuments = promisify(this.client.upsertDocuments.bind(this.client));
        try {
            const response = await upsertDocuments({
                collection: request.collection,
                documents: request.documents,
                generateEmbeddings: request.generateEmbeddings || false,
            });
            return response;
        }
        catch (error) {
            this.logger.error(`Failed to upsert documents in collection ${request.collection}:`, error);
            throw error;
        }
    }
    async getDocument(collection, id) {
        const getDocument = promisify(this.client.getDocument.bind(this.client));
        try {
            const response = await getDocument({ collection, id });
            return response;
        }
        catch (error) {
            this.logger.error(`Failed to get document ${id} from collection ${collection}:`, error);
            throw error;
        }
    }
    // Search Operations
    async similaritySearch(request) {
        const similaritySearch = promisify(this.client.similaritySearch.bind(this.client));
        try {
            const response = await similaritySearch({
                collection: request.collection,
                embedding: request.embedding,
                text: request.text,
                limit: request.limit || 10,
                threshold: request.threshold || 0.0,
                metadataFilter: request.metadataFilter,
            });
            return response;
        }
        catch (error) {
            this.logger.error(`Failed to perform similarity search in collection ${request.collection}:`, error);
            throw error;
        }
    }
    // Health and Stats
    async healthCheck() {
        const healthCheck = promisify(this.client.healthCheck.bind(this.client));
        try {
            const response = await healthCheck({});
            return response;
        }
        catch (error) {
            this.logger.error('Failed to perform health check:', error);
            throw error;
        }
    }
    async getStats(collection) {
        const getStats = promisify(this.client.getStats.bind(this.client));
        try {
            const response = await getStats({ collection });
            return response;
        }
        catch (error) {
            this.logger.error('Failed to get stats:', error);
            throw error;
        }
    }
    // Convenience methods with better error handling
    async searchByText(collection, text, options = {}) {
        const response = await this.similaritySearch({
            collection,
            text,
            limit: options.limit || 10,
            threshold: options.threshold || 0.0,
            metadataFilter: options.metadataFilter,
        });
        return response.results;
    }
    async searchByEmbedding(collection, embedding, options = {}) {
        const response = await this.similaritySearch({
            collection,
            embedding,
            limit: options.limit || 10,
            threshold: options.threshold || 0.0,
            metadataFilter: options.metadataFilter,
        });
        return response.results;
    }
    async addDocuments(collection, documents, generateEmbeddings = true) {
        const response = await this.upsertDocuments({
            collection,
            documents,
            generateEmbeddings,
        });
        if (!response.success) {
            throw new Error(`Failed to add documents: ${response.message}`);
        }
        return response.documentsProcessed;
    }
};
VectorStoreGrpcClient = VectorStoreGrpcClient_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], VectorStoreGrpcClient);
export { VectorStoreGrpcClient };
//# sourceMappingURL=vector-store-grpc.client.js.map