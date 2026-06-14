var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PointerResolverService_1;
import { Injectable, Logger } from '@nestjs/common';
import { VectorDatabaseService } from '@the-new-fuse/core-vector-db';
import * as fs from 'fs/promises';
let PointerResolverService = class PointerResolverService {
    static { PointerResolverService_1 = this; }
    vectorDbService;
    static serviceName = 'PointerResolverService';
    logger = new Logger(PointerResolverService_1.serviceName);
    constructor(vectorDbService) {
        this.vectorDbService = vectorDbService;
    }
    /**
     * Resolves a TNF Resource Pointer (TRP) to its actual content.
     * This prevents "All-in-Memory" bottlenecks by fetching data only when needed.
     */
    async resolve(pointer) {
        const { uri } = pointer;
        this.logger.debug(`Resolving pointer: ${uri}`);
        if (uri.startsWith('pgvector://')) {
            return this.resolvePgVector(uri);
        }
        else if (uri.startsWith('file://')) {
            return this.resolveFile(uri);
        }
        else if (uri.startsWith('trp://')) {
            return this.resolveTrp(uri);
        }
        else {
            throw new Error(`Unsupported pointer URI scheme: ${uri}`);
        }
    }
    async resolvePgVector(uri) {
        // Expected format: pgvector://collection_name/document_id
        const parts = uri.replace('pgvector://', '').split('/');
        if (parts.length < 2) {
            throw new Error(`Invalid pgvector URI: ${uri}. Expected pgvector://collection/id`);
        }
        const [collection, id] = parts;
        const document = await this.vectorDbService.getDocument(collection, id);
        if (!document) {
            throw new Error(`Resource not found in pgvector: ${uri}`);
        }
        return document.content;
    }
    async resolveFile(uri) {
        const filePath = uri.replace('file://', '');
        try {
            const content = await fs.readFile(filePath, 'utf8');
            return content;
        }
        catch (error) {
            throw new Error(`Failed to read file from pointer: ${uri}. ${error.message}`);
        }
    }
    async resolveTrp(uri) {
        // Internal TNF Relay Protocol resolution
        // For now, this could be a proxy to other services or a specific relay-backed store
        throw new Error(`TRP scheme resolution not yet implemented: ${uri}`);
    }
};
PointerResolverService = PointerResolverService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [VectorDatabaseService])
], PointerResolverService);
export { PointerResolverService };
