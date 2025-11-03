import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IndexManager {
  private readonly logger = new Logger(IndexManager.name);

  constructor(private readonly prisma: PrismaService) {}

  async analyzeIndexUsage(): Promise<any[]> {
    this.logger.log('Analyzing index usage...');
    try {
      const result = await this.prisma.$queryRaw`
        SELECT
          relname AS table_name,
          indexrelname AS index_name,
          idx_scan AS index_scans,
          idx_tup_read AS index_tuples_read,
          idx_tup_fetch AS index_tuples_fetched,
          pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
        FROM pg_stat_user_indexes
        ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;
      `;
      this.logger.log('Index usage analysis complete.');
      return result as any[];
    } catch (error) {
      this.logger.error('Error analyzing index usage:', error.stack);
      throw error;
    }
  }

  async suggestIndexes(): Promise<string[]> {
    this.logger.log('Suggesting new indexes based on sequential scan frequency...');
    try {
      // This is a simplified example. A real implementation would be more sophisticated.
      const tables = await this.prisma.$queryRaw`
        SELECT relname AS table_name, seq_scan AS sequential_scans
        FROM pg_stat_user_tables
        WHERE seq_scan > 1000 -- Threshold for suggesting an index
        ORDER BY seq_scan DESC;
      `;
      const suggestions = (tables as any[]).map(
        t => `Table '${t.table_name}' has a high number of sequential scans (${t.sequential_scans}). Consider adding an index to frequently queried columns.`
      );
      this.logger.log(`${suggestions.length} index suggestions found.`);
      return suggestions;
    } catch (error) {
      this.logger.error('Error suggesting indexes:', error.stack);
      throw error;
    }
  }

  async createIndex(tableName: string, columns: string[], options: { unique?: boolean; concurrently?: boolean } = {}): Promise<void> {
    const indexName = `idx_${tableName}_${columns.join('_')}`;
    const columnsStr = columns.join(', ');
    const uniqueStr = options.unique ? 'UNIQUE' : '';
    const concurrentlyStr = options.concurrently ? 'CONCURRENTLY' : '';

    const query = `CREATE ${uniqueStr} INDEX ${concurrentlyStr} "${indexName}" ON "${tableName}" (${columnsStr});`;

    this.logger.log(`Creating index '${indexName}' on table '${tableName}' for columns [${columnsStr}]`);

    try {
      await this.prisma.$executeRawUnsafe(query);
      this.logger.log(`Index '${indexName}' created successfully.`);
    } catch (error) {
      this.logger.error(`Error creating index '${indexName}':`, error.stack);
      throw error;
    }
  }

  async dropIndex(indexName: string, options: { concurrently?: boolean } = {}): Promise<void> {
    const concurrentlyStr = options.concurrently ? 'CONCURRENTLY' : '';
    const query = `DROP INDEX ${concurrentlyStr} "${indexName}";`;

    this.logger.log(`Dropping index '${indexName}'`);

    try {
      await this.prisma.$executeRawUnsafe(query);
      this.logger.log(`Index '${indexName}' dropped successfully.`);
    } catch (error) {
      this.logger.error(`Error dropping index '${indexName}':`, error.stack);
      throw error;
    }
  }
}
