export { VectorDatabaseService } from './vector-database.service';
export { VectorDatabaseModule } from './vector-database.module';
export type { VectorDatabaseModuleOptions } from './vector-database.module';
export type { IVectorDatabase, IEmbeddingProvider, VectorDocument, VectorQuery, VectorSearchResult, CollectionConfig, VectorDatabaseConfig, EmbeddingConfig, } from './interface/vector-database.interface';
export { VectorDocumentSchema, VectorQuerySchema, VectorSearchResultSchema, CollectionConfigSchema, } from './interface/vector-database.interface';
export { PgVectorDriver } from './drivers/pgvector.driver';
export { QdrantDriver } from './drivers/qdrant.driver';
export { OpenAIEmbeddingProvider } from './drivers/openai-embedding.provider';
export { LegacyVectorAdapter, createLegacyAdapter, TypeConverter } from './adapters/legacy-adapter';
//# sourceMappingURL=index.d.ts.map