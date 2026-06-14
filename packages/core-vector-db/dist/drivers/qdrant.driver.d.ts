import type { CollectionConfig, IVectorDatabase, VectorDatabaseConfig, VectorDocument, VectorQuery, VectorSearchResult } from '../interface/vector-database.interface.js';
export declare class QdrantDriver implements IVectorDatabase {
    private readonly config;
    private readonly logger;
    private client;
    constructor(config: VectorDatabaseConfig);
    private initializeConnection;
    createCollection(config: CollectionConfig): Promise<void>;
    deleteCollection(name: string): Promise<void>;
    listCollections(): Promise<string[]>;
    collectionExists(name: string): Promise<boolean>;
    addDocuments(collection: string, documents: VectorDocument[]): Promise<void>;
    updateDocument(collection: string, id: string, document: Partial<VectorDocument>): Promise<void>;
    deleteDocument(collection: string, id: string): Promise<void>;
    getDocument(collection: string, id: string): Promise<VectorDocument | null>;
    similaritySearch(collection: string, query: VectorQuery): Promise<VectorSearchResult[]>;
    hybridSearch(collection: string, query: VectorQuery): Promise<VectorSearchResult[]>;
    batchAdd(collection: string, documents: VectorDocument[]): Promise<void>;
    batchDelete(collection: string, ids: string[]): Promise<void>;
    isHealthy(): Promise<boolean>;
    getStats(collection?: string): Promise<Record<string, any>>;
    private mapDistanceMetric;
    private generateId;
}
//# sourceMappingURL=qdrant.driver.d.ts.map