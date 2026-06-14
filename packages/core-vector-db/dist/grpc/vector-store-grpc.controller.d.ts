import type { Metadata, ServerUnaryCall } from '@grpc/grpc-js';
import { VectorDatabaseService } from '../vector-database.service.js';
interface CreateCollectionRequest {
    name: string;
    dimension: number;
    metric: 'cosine' | 'euclidean' | 'dot_product';
    config: {
        [key: string]: string;
    };
}
interface CreateCollectionResponse {
    success: boolean;
    message: string;
}
interface VectorDocument {
    id: string;
    content: string;
    metadata: any;
    embedding: number[];
}
interface UpsertDocumentsRequest {
    collection: string;
    documents: VectorDocument[];
    generateEmbeddings: boolean;
}
interface UpsertDocumentsResponse {
    success: boolean;
    message: string;
    documentsProcessed: number;
}
interface GetDocumentRequest {
    collection: string;
    id: string;
}
interface GetDocumentResponse {
    document: VectorDocument;
    found: boolean;
}
interface SimilaritySearchRequest {
    collection: string;
    embedding?: number[];
    text?: string;
    limit: number;
    threshold: number;
    metadataFilter?: any;
}
interface SearchResult {
    id: string;
    content: string;
    metadata: any;
    score: number;
    distance: number;
}
interface SimilaritySearchResponse {
    results: SearchResult[];
}
interface HealthCheckResponse {
    healthy: boolean;
    status: string;
    details: {
        [key: string]: string;
    };
}
interface GetStatsRequest {
    collection?: string;
}
interface GetStatsResponse {
    stats: any;
}
export declare class VectorStoreGrpcController {
    private readonly vectorService;
    private readonly logger;
    constructor(vectorService: VectorDatabaseService);
    createCollection(request: CreateCollectionRequest, _metadata: Metadata, _call: ServerUnaryCall<CreateCollectionRequest, CreateCollectionResponse>): Promise<CreateCollectionResponse>;
    upsertDocuments(request: UpsertDocumentsRequest, _metadata: Metadata, _call: ServerUnaryCall<UpsertDocumentsRequest, UpsertDocumentsResponse>): Promise<UpsertDocumentsResponse>;
    getDocument(request: GetDocumentRequest, _metadata: Metadata, _call: ServerUnaryCall<GetDocumentRequest, GetDocumentResponse>): Promise<GetDocumentResponse>;
    similaritySearch(request: SimilaritySearchRequest, _metadata: Metadata, _call: ServerUnaryCall<SimilaritySearchRequest, SimilaritySearchResponse>): Promise<SimilaritySearchResponse>;
    healthCheck(): Promise<HealthCheckResponse>;
    getStats(request: GetStatsRequest, _metadata: Metadata, _call: ServerUnaryCall<GetStatsRequest, GetStatsResponse>): Promise<GetStatsResponse>;
    listCollections(): Promise<{
        collections: string[];
    }>;
    deleteCollection(request: {
        name: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
export {};
//# sourceMappingURL=vector-store-grpc.controller.d.ts.map