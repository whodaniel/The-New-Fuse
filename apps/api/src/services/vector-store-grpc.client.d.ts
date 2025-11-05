import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
export declare class VectorStoreGrpcClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private client;
    private readonly grpcUrl;
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    createCollection(request: {
        name: string;
        dimension: number;
        metric?: string;
        config?: {
            [key: string]: string;
        };
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteCollection(name: string): Promise<{
        success: boolean;
        message: string;
    }>;
    listCollections(): Promise<{
        collections: string[];
    }>;
    upsertDocuments(request: {
        collection: string;
        documents: Array<{
            id: string;
            content: string;
            metadata?: any;
            embedding?: number[];
        }>;
        generateEmbeddings?: boolean;
    }): Promise<{
        success: boolean;
        message: string;
        documentsProcessed: number;
    }>;
    getDocument(collection: string, id: string): Promise<{
        document?: {
            id: string;
            content: string;
            metadata?: any;
            embedding?: number[];
        };
        found: boolean;
    }>;
    similaritySearch(request: {
        collection: string;
        embedding?: number[];
        text?: string;
        limit?: number;
        threshold?: number;
        metadataFilter?: any;
    }): Promise<{
        results: Array<{
            id: string;
            content: string;
            metadata?: any;
            score: number;
            distance: number;
        }>;
    }>;
    healthCheck(): Promise<{
        healthy: boolean;
        status: string;
        details: {
            [key: string]: string;
        };
    }>;
    getStats(collection?: string): Promise<{
        stats: any;
    }>;
    searchByText(collection: string, text: string, options?: {
        limit?: number;
        threshold?: number;
        metadataFilter?: any;
    }): Promise<Array<{
        id: string;
        content: string;
        metadata?: any;
        score: number;
    }>>;
    searchByEmbedding(collection: string, embedding: number[], options?: {
        limit?: number;
        threshold?: number;
        metadataFilter?: any;
    }): Promise<Array<{
        id: string;
        content: string;
        metadata?: any;
        score: number;
    }>>;
    addDocuments(collection: string, documents: Array<{
        id: string;
        content: string;
        metadata?: any;
        embedding?: number[];
    }>, generateEmbeddings?: boolean): Promise<number>;
}
//# sourceMappingURL=vector-store-grpc.client.d.ts.map