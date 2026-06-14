import type { CollectionConfig, IVectorDatabase, VectorDatabaseConfig, VectorDocument, VectorQuery, VectorSearchResult } from '../interface/vector-database.interface.js';
export declare class ForgeDriver implements IVectorDatabase {
    private readonly config;
    private readonly logger;
    private readonly baseUrl;
    constructor(config: VectorDatabaseConfig);
    createCollection(_config: CollectionConfig): Promise<void>;
    deleteCollection(_name: string): Promise<void>;
    listCollections(): Promise<string[]>;
    collectionExists(_name: string): Promise<boolean>;
    addDocuments(_collection: string, documents: VectorDocument[]): Promise<void>;
    updateDocument(collection: string, id: string, document: Partial<VectorDocument>): Promise<void>;
    deleteDocument(_collection: string, _id: string): Promise<void>;
    getDocument(_collection: string, _id: string): Promise<VectorDocument | null>;
    similaritySearch(_collection: string, query: VectorQuery): Promise<VectorSearchResult[]>;
    hybridSearch(collection: string, query: VectorQuery): Promise<VectorSearchResult[]>;
    batchAdd(collection: string, documents: VectorDocument[]): Promise<void>;
    batchDelete(_collection: string, _ids: string[]): Promise<void>;
    isHealthy(): Promise<boolean>;
    getStats(_collection?: string): Promise<Record<string, any>>;
}
//# sourceMappingURL=forge.driver.d.ts.map