import { VectorDatabaseService } from './vector-database.service';
import { VectorDatabaseModule } from './vector-database.module';
import { PgVectorDriver } from './drivers/pgvector.driver';
import { QdrantDriver } from './drivers/qdrant.driver';
import { OpenAIEmbeddingProvider } from './drivers/openai-embedding.provider';

describe('Core Vector DB Exports', () => {
  it('should export necessary modules', () => {
    expect(VectorDatabaseService).toBeDefined();
    expect(VectorDatabaseModule).toBeDefined();
    expect(PgVectorDriver).toBeDefined();
    expect(QdrantDriver).toBeDefined();
    expect(OpenAIEmbeddingProvider).toBeDefined();
  });
});
