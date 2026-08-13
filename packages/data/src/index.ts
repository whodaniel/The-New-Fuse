/**
 * @the-new-fuse/data
 * Unified Data Stack
 *
 * Provides a single entry point for all data-related operations:
 * - Relational (Drizzle ORM)
 * - Vector (pgvector/qdrant)
 * - Shared Configuration
 */

export * from '@the-new-fuse/core-vector-db';
export * from '@the-new-fuse/database';
export { loadDatabaseConfig } from '@the-new-fuse/infrastructure';

import {
  OpenAIEmbeddingProvider,
  PgVectorDriver,
  VectorDatabaseService,
} from '@the-new-fuse/core-vector-db';
import { db, queryClient } from '@the-new-fuse/database';
import { loadDatabaseConfig } from '@the-new-fuse/infrastructure';

/**
 * Unified Data Stack Helper
 */
export class DataStack {
  static getRelational() {
    return db;
  }

  static getQueryClient() {
    return queryClient;
  }

  static async createVectorService(options?: { apiKey?: string; model?: string }) {
    const config = loadDatabaseConfig();

    // Create driver
    const driver = new PgVectorDriver({
      provider: 'pgvector',
      connectionString: config.url,
      host: config.host,
      port: config.port,
      database: config.database,
      ssl: config.ssl,
      poolSize: config.maxConnections,
      timeout: config.idleTimeout * 1000,
    });

    // Create embedding provider
    const embeddingProvider = new OpenAIEmbeddingProvider({
      provider: 'openai',
      apiKey: options?.apiKey || process.env.OPENAI_API_KEY || '',
      model: options?.model || 'text-embedding-3-small',
    });

    return new VectorDatabaseService(driver as any, embeddingProvider as any);
  }
}
