import type { IVectorDatabase, VectorDocument, CollectionConfig, VectorDatabaseConfig } from '../interface/vector-database.interface';
export declare class PgVectorDriver implements IVectorDatabase {
    private readonly config;
    private readonly logger;
    private pool;
    constructor(config: VectorDatabaseConfig);
    private initializeExtensions;
    createCollection(config: CollectionConfig): Promise<void>;
    addDocuments(collection: string, documents: VectorDocument[]): Promise<void>;
    updateDocument(collection: string, id: string, document: Partial<VectorDocument>): Promise<void>;
    catch(error: any): void;
}
//# sourceMappingURL=pgvector.driver.d.ts.map