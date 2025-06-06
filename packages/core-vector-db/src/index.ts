// Main exports
export { VectorDatabaseService } from './vector-database.service';
export { VectorDatabaseModule } from './vector-database.module';
export type { VectorDatabaseModuleOptions } from './vector-database.module';

// Interface exports
export type {
  IVectorDatabase,
  IEmbeddingProvider,
  VectorDocument,
  VectorQuery,
  VectorSearchResult,
  CollectionConfig,
  VectorDatabaseConfig,
  EmbeddingConfig,
} from './interface/vector-database.interface';

export {
  VectorDocumentSchema,
  VectorQuerySchema,
  VectorSearchResultSchema,
  CollectionConfigSchema,
} from './interface/vector-database.interface';

// Driver exports
export { PgVectorDriver } from './drivers/pgvector.driver';
export { OpenAIEmbeddingProvider } from './drivers/openai-embedding.provider';

// Adapter exports
export { LegacyVectorAdapter, createLegacyAdapter, TypeConverter } from './adapters/legacy-adapter';