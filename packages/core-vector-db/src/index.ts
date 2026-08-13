// Main exports
export { VectorDatabaseModule } from './vector-database.module.js';
export type { VectorDatabaseModuleOptions } from './vector-database.module.js';
export { VectorDatabaseService } from './vector-database.service.js';

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
} from './interface/vector-database.interface.js';

export {
  CollectionConfigSchema,
  VectorDocumentSchema,
  VectorQuerySchema,
  VectorSearchResultSchema,
} from './interface/vector-database.interface.js';

// Driver exports
export { OpenAIEmbeddingProvider } from './drivers/openai-embedding.provider.js';
export { PgVectorDriver } from './drivers/pgvector.driver.js';
export { QdrantDriver } from './drivers/qdrant.driver.js';

// Adapter exports
export {
  LegacyVectorAdapter,
  TypeConverter,
  createLegacyAdapter,
} from './adapters/legacy-adapter.js';

// Codebase Intelligence exports
export { CodebaseSearch } from './codebase-search.js';
export { CodebaseVectorizer } from './codebase-vectorizer.js';
