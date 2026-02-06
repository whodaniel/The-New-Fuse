// Main exports
export { VectorDatabaseModule } from './vector-database.module';
export type { VectorDatabaseModuleOptions } from './vector-database.module';
export { VectorDatabaseService } from './vector-database.service';

// Interface exports
export type {
  CollectionConfig,
  EmbeddingConfig,
  IEmbeddingProvider,
  IVectorDatabase,
  VectorDatabaseConfig,
  VectorDocument,
  VectorQuery,
  VectorSearchResult,
} from './interface/vector-database.interface';

export {
  CollectionConfigSchema,
  VectorDocumentSchema,
  VectorQuerySchema,
  VectorSearchResultSchema,
} from './interface/vector-database.interface';

// Driver exports
export { OpenAIEmbeddingProvider } from './drivers/openai-embedding.provider';
export { PgVectorDriver } from './drivers/pgvector.driver';
export { QdrantDriver } from './drivers/qdrant.driver';

// Adapter exports
export { LegacyVectorAdapter, TypeConverter, createLegacyAdapter } from './adapters/legacy-adapter';

// Codebase Intelligence exports
export { CodebaseSearch } from './codebase-search';
export { CodebaseVectorizer } from './codebase-vectorizer';
