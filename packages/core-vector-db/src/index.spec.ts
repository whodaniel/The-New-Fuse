import { OpenAIEmbeddingProvider } from './drivers/openai-embedding.provider.js';
import { PgVectorDriver } from './drivers/pgvector.driver.js';
import { QdrantDriver } from './drivers/qdrant.driver.js';
import { VectorDatabaseModule } from './vector-database.module.js';
import { VectorDatabaseService } from './vector-database.service.js';

describe('Core Vector DB Exports', () => {
  it('should export necessary modules', () => {
    expect(VectorDatabaseService).toBeDefined();
    expect(VectorDatabaseModule).toBeDefined();
    expect(PgVectorDriver).toBeDefined();
    expect(QdrantDriver).toBeDefined();
    expect(OpenAIEmbeddingProvider).toBeDefined();
  });
});
