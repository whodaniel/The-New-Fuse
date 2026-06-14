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
var ForgeDriver_1;
import { Inject, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
let ForgeDriver = ForgeDriver_1 = class ForgeDriver {
    constructor(config) {
        this.config = config;
        this.logger = new Logger(ForgeDriver_1.name);
        this.baseUrl = config.host || 'http://localhost:3007';
        this.logger.log(`Forge Vector Driver initialized with base URL: ${this.baseUrl}`);
    }
    async createCollection(_config) {
        // Forge synapse currently uses a single unified memory store
        return;
    }
    async deleteCollection(_name) {
        return;
    }
    async listCollections() {
        return ['default'];
    }
    async collectionExists(_name) {
        return true;
    }
    async addDocuments(_collection, documents) {
        try {
            await axios.post(`${this.baseUrl}/vectors`, documents);
            this.logger.log(`Added ${documents.length} documents to Forge Synapse`);
        }
        catch (error) {
            this.logger.error(`Failed to add documents to Forge Synapse: ${error.message}`);
            throw error;
        }
    }
    async updateDocument(collection, id, document) {
        // For simplicity, just add/overwrite
        const doc = { id, ...document };
        return this.addDocuments(collection, [doc]);
    }
    async deleteDocument(_collection, _id) {
        // TODO: Implement delete in Rust kernel
        return;
    }
    async getDocument(_collection, _id) {
        // Forge synapse is currently write-only + search
        return null;
    }
    async similaritySearch(_collection, query) {
        try {
            if (!query.embedding) {
                throw new Error('Embedding is required for Forge similarity search');
            }
            const response = await axios.post(`${this.baseUrl}/search`, {
                embedding: query.embedding,
                limit: query.limit || 10,
                threshold: query.threshold || 0.0,
            });
            return response.data.map((r) => ({
                ...r,
                content: r.metadata?.content || '',
                distance: 1 - r.score,
            }));
        }
        catch (error) {
            this.logger.error(`Failed to perform Forge similarity search: ${error.message}`);
            throw error;
        }
    }
    async hybridSearch(collection, query) {
        return this.similaritySearch(collection, query);
    }
    async batchAdd(collection, documents) {
        return this.addDocuments(collection, documents);
    }
    async batchDelete(_collection, _ids) {
        return;
    }
    async isHealthy() {
        try {
            const response = await axios.get(`${this.baseUrl}/health`);
            return response.data === 'healthy';
        }
        catch {
            return false;
        }
    }
    async getStats(_collection) {
        return {
            provider: 'forge',
            status: 'active',
        };
    }
};
ForgeDriver = ForgeDriver_1 = __decorate([
    Injectable(),
    __param(0, Inject('VECTOR_DB_CONFIG')),
    __metadata("design:paramtypes", [Object])
], ForgeDriver);
export { ForgeDriver };
//# sourceMappingURL=forge.driver.js.map