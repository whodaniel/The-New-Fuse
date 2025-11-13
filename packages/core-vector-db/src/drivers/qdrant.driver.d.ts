import type { IVectorDatabase, CollectionConfig, VectorDatabaseConfig } from '../interface/vector-database.interface';
export declare class QdrantDriver implements IVectorDatabase {
    private readonly config;
    private readonly logger;
    private client;
    constructor(config: VectorDatabaseConfig);
    private initializeConnection;
    createCollection(config: CollectionConfig): Promise<void>;
}
//# sourceMappingURL=qdrant.driver.d.ts.map