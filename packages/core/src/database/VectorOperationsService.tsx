import { Injectable } from '@nestjs/common';
import { DatabaseService } from './DatabaseService.js';
import { LoggerService } from '../logging/LoggerService.js';
import { MetricsService } from '../monitoring/MetricsService.js';

interface VectorSearchOptions {
  limit?: number;
  threshold?: number;
  withMetadata?: boolean;
  excludeIds?: string[];
}

interface VectorIndexConfig {
  dimensions: number;
  metric: 'euclidean' | 'cosine' | 'inner_product';
  listSize?: number;
  probeMultiplier?: number;
}

@Injectable()
export class VectorOperationsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly logger: LoggerService,
    private readonly metrics: MetricsService,
  ) {}

  async createVectorIndex(
    table: string,
    column: string,
    config: VectorIndexConfig
  ): Promise<void> {
    try {
      // Create extension if not exists
      await this.db.executeQuery('CREATE EXTENSION IF NOT EXISTS vector');

      // Create vector index
      const indexName = `idx_${table}_${column}_vector`;
      await this.db.executeQuery(`
        CREATE INDEX ${indexName} ON ${table} 
        USING ivfflat (${column} vector_cosine_ops)
        WITH (lists = $1)
      `, [config.listSize || Math.ceil(Math.sqrt(await this.estimateRowCount(table)))]);

      this.metrics.increment('database.vector.index.created');
      this.logger.info(`Created vector index ${indexName}`);
    } catch (error) {
      this.metrics.increment('database.vector.index.failed');
      this.logger.error('Failed to create vector index:', error);
      throw error;
    }
  }

  async findNearest(
    table: string,
    column: string,
    vector: number[],
    options: VectorSearchOptions = {}
  ): Promise<any[]> {
    const startTime = Date.now();
    try {
      const {
        limit = 10,
        threshold = 0.8,
        withMetadata = true,
        excludeIds = [],
      } = options;

      let query = `
        SELECT 
          *,
          1 - (${column} <=> $1::vector) as similarity
        FROM ${table}
      `;

      if (excludeIds.length > 0) {
        query += ` WHERE id NOT IN (${excludeIds.map((_, i) => `$${i + 3}`).join(',')})`;
      }

      query += `
        WHERE 1 - (${column} <=> $1::vector) >= $2
        ORDER BY ${column} <=> $1::vector
        LIMIT $${excludeIds.length + 3}
      `;

      const results = await this.db.executeQuery(
        query,
        [vector, threshold, ...excludeIds, limit]
      );

      const duration = Date.now() - startTime;
      this.metrics.timing('database.vector.search.duration', duration);
      this.metrics.increment('database.vector.search.success');

      return withMetadata ? results : results.map(r => r.vector);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metrics.timing('database.vector.search.duration', duration);
      this.metrics.increment('database.vector.search.failed');
      
      this.logger.error('Vector search failed:', error);
      throw error;
    }
  }

  async batchUpsert(
    table: string,
    vectors: Array<{ id: string; vector: number[]; metadata?: Record<string, any> }>
  ): Promise<void> {
    const startTime = Date.now();
    try {
      await this.db.withTransaction(async (entityManager) => {
        for (const batch of this.chunk(vectors, 1000)) {
          const values = batch.map(v => `(
            '${v.id}',
            '${JSON.stringify(v.vector)}'::vector,
            '${JSON.stringify(v.metadata || {})}'::jsonb
          )`).join(',');

          await entityManager.query(`
            INSERT INTO ${table} (id, vector, metadata)
            VALUES ${values}
            ON CONFLICT (id) DO UPDATE
            SET 
              vector = EXCLUDED.vector,
              metadata = ${table}.metadata || EXCLUDED.metadata
          `);
        }
      });

      const duration = Date.now() - startTime;
      this.metrics.timing('database.vector.upsert.duration', duration);
      this.metrics.increment('database.vector.upsert.success');
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metrics.timing('database.vector.upsert.duration', duration);
      this.metrics.increment('database.vector.upsert.failed');
      
      this.logger.error('Batch vector upsert failed:', error);
      throw error;
    }
  }

  async deleteVectors(table: string, ids: string[]): Promise<void> {
    try {
      await this.db.executeQuery(
        `DELETE FROM ${table} WHERE id = ANY($1)`,
        [ids]
      );

      this.metrics.increment('database.vector.delete.success');
    } catch (error) {
      this.metrics.increment('database.vector.delete.failed');
      this.logger.error('Vector deletion failed:', error);
      throw error;
    }
  }

  async reindex(table: string, column: string): Promise<void> {
    try {
      await this.db.executeQuery(`REINDEX INDEX idx_${table}_${column}_vector`);
      this.metrics.increment('database.vector.reindex.success');
    } catch (error) {
      this.metrics.increment('database.vector.reindex.failed');
      this.logger.error('Vector reindexing failed:', error);
      throw error;
    }
  }

  async analyzeVectorUsage(table: string, column: string): Promise<{
    totalVectors: number;
    avgDimensions: number;
    indexSize: number;
    searchStats: {
      totalSearches: number;
      avgSearchTime: number;
      cacheMissRate: number;
    };
  }> {
    const stats = await this.db.executeQuery(`
      SELECT
        count(*) as total_vectors,
        avg(array_length(${column}, 1)) as avg_dimensions,
        pg_size_pretty(pg_relation_size('idx_${table}_${column}_vector')) as index_size,
        (SELECT count(*) FROM pg_stat_statements WHERE query LIKE '%${column} <=>%') as total_searches,
        (SELECT avg(mean_exec_time) FROM pg_stat_statements WHERE query LIKE '%${column} <=>%') as avg_search_time,
        (SELECT local_blks_hit::float / nullif(local_blks_hit + local_blks_read, 0)
         FROM pg_statio_user_tables
         WHERE relname = '${table}') as cache_hit_rate
      FROM ${table}
    `);

    return {
      totalVectors: parseInt(stats[0].total_vectors),
      avgDimensions: parseFloat(stats[0].avg_dimensions),
      indexSize: parseInt(stats[0].index_size),
      searchStats: {
        totalSearches: parseInt(stats[0].total_searches),
        avgSearchTime: parseFloat(stats[0].avg_search_time),
        cacheMissRate: 1 - parseFloat(stats[0].cache_hit_rate),
      },
    };
  }

  private chunk<T>(array: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
      array.slice(i * size, i * size + size)
    );
  }

  private async estimateRowCount(table: string): Promise<number> {
    const result = await this.db.executeQuery(
      'SELECT reltuples::bigint AS estimate FROM pg_class WHERE relname = $1',
      [table]
    );
    return result[0].estimate;
  }
}