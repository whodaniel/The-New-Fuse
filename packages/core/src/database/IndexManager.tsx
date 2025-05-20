import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LoggerService } from '../logging/LoggerService.js';
import { MetricsService } from '../monitoring/MetricsService.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface IndexInfo {
  name: string;
  table: string;
  columns: string[];
  unique: boolean;
  type: string;
  size: number;
  usage: {
    scans: number;
    tuples: number;
    pages: number;
  };
}

interface IndexSuggestion {
  table: string;
  columns: string[];
  type: string;
  reason: string;
  estimatedBenefit: number;
}

@Injectable()
export class IndexManager {
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: LoggerService,
    private readonly metrics: MetricsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async analyzeIndexes(): Promise<{
    current: IndexInfo[];
    suggestions: IndexSuggestion[];
  }> {
    try {
      const [currentIndexes, suggestions] = await Promise.all([
        this.getCurrentIndexes(),
        this.generateIndexSuggestions(),
      ]);

      this.metrics.increment('database.index.analysis.success');
      return { current: currentIndexes, suggestions };
    } catch (error) {
      this.logger.error('Failed to analyze indexes:', error);
      this.metrics.increment('database.index.analysis.failed');
      throw error;
    }
  }

  private async getCurrentIndexes(): Promise<IndexInfo[]> {
    const indexStats = await this.dataSource.query(`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch,
        pg_relation_size(indexrelid) as index_size
      FROM pg_stat_user_indexes
      JOIN pg_indexes ON
        pg_stat_user_indexes.schemaname = pg_indexes.schemaname
        AND pg_stat_user_indexes.tablename = pg_indexes.tablename
        AND pg_stat_user_indexes.indexrelname = pg_indexes.indexname
      WHERE pg_stat_user_indexes.schemaname = 'public'
    `);

    return indexStats.map((stat: any) => ({
      name: stat.indexname,
      table: stat.tablename,
      columns: this.parseIndexColumns(stat.indexdef),
      unique: stat.indexdef.toLowerCase().includes('unique'),
      type: this.determineIndexType(stat.indexdef),
      size: parseInt(stat.index_size, 10),
      usage: {
        scans: parseInt(stat.idx_scan, 10),
        tuples: parseInt(stat.idx_tup_read, 10),
        pages: Math.ceil(parseInt(stat.index_size, 10) / 8192), // Assuming 8KB page size
      },
    }));
  }

  private async generateIndexSuggestions(): Promise<IndexSuggestion[]> {
    const suggestions: IndexSuggestion[] = [];

    // Analyze table statistics
    const tableStats = await this.dataSource.query(`
      SELECT
        schemaname,
        relname,
        seq_scan,
        seq_tup_read,
        idx_scan,
        n_live_tup,
        n_dead_tup
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
    `);

    for (const stat of tableStats) {
      // Suggest indexes for tables with high sequential scans
      if (stat.seq_scan > 1000 && stat.seq_scan > stat.idx_scan * 10) {
        const columns = await this.identifyFrequentlyQueriedColumns(stat.relname);
        
        if (columns.length > 0) {
          suggestions.push({
            table: stat.relname,
            columns,
            type: 'btree',
            reason: 'High number of sequential scans detected',
            estimatedBenefit: this.calculateBenefit(stat),
          });
        }
      }

      // Check for missing foreign key indexes
      const missingFKIndexes = await this.checkMissingForeignKeyIndexes(stat.relname);
      suggestions.push(...missingFKIndexes);
    }

    return suggestions;
  }

  private async identifyFrequentlyQueriedColumns(table: string): Promise<string[]> {
    const pgStatStatements = await this.dataSource.query(`
      SELECT query, calls
      FROM pg_stat_statements
      WHERE query ~* $1
      ORDER BY calls DESC
      LIMIT 10
    `, [`SELECT.*FROM.*${table}`]);

    const columns = new Set<string>();
    for (const statement of pgStatStatements) {
      const whereColumns = this.extractWhereColumns(statement.query);
      whereColumns.forEach(col => columns.add(col));
    }

    return Array.from(columns);
  }

  private async checkMissingForeignKeyIndexes(table: string): Promise<IndexSuggestion[]> {
    const foreignKeys = await this.dataSource.query(`
      SELECT
        tc.constraint_name,
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = $1
    `, [table]);

    const suggestions: IndexSuggestion[] = [];
    
    for (const fk of foreignKeys) {
      const hasIndex = await this.checkIndexExists(table, fk.column_name);
      if (!hasIndex) {
        suggestions.push({
          table,
          columns: [fk.column_name],
          type: 'btree',
          reason: 'Missing index on foreign key',
          estimatedBenefit: 0.8, // High benefit for FK indexes
        });
      }
    }

    return suggestions;
  }

  private async checkIndexExists(table: string, column: string): Promise<boolean> {
    const result = await this.dataSource.query(`
      SELECT 1
      FROM pg_indexes
      WHERE tablename = $1
        AND indexdef LIKE $2
    `, [table, `%${column}%`]);

    return result.length > 0;
  }

  async createIndex(
    table: string,
    columns: string[],
    options: {
      name?: string;
      type?: string;
      unique?: boolean;
      concurrent?: boolean;
    } = {}
  ): Promise<void> {
    const indexName = options.name || `idx_${table}_${columns.join('_')}`;
    const indexType = options.type || 'btree';
    const concurrent = options.concurrent ? 'CONCURRENTLY' : '';
    const unique = options.unique ? 'UNIQUE' : '';

    try {
      const startTime = Date.now();
      
      await this.dataSource.query(`
        CREATE ${unique} INDEX ${concurrent} ${indexName}
        ON ${table} USING ${indexType} (${columns.join(', ')})
      `);

      const duration = Date.now() - startTime;
      this.metrics.timing('database.index.creation', duration);
      this.metrics.increment('database.index.created');

      this.eventEmitter.emit('database.index.created', {
        table,
        columns,
        name: indexName,
        duration,
      });

      this.logger.info(`Created index ${indexName} on ${table}`, {
        columns,
        duration,
      });
    } catch (error) {
      this.metrics.increment('database.index.creation.failed');
      this.logger.error(`Failed to create index on ${table}:`, error);
      throw error;
    }
  }

  async dropUnusedIndexes(minScans: number = 100): Promise<void> {
    const unusedIndexes = await this.dataSource.query(`
      SELECT
        schemaname,
        tablename,
        indexname,
        idx_scan
      FROM pg_stat_user_indexes
      WHERE idx_scan < $1
        AND schemaname = 'public'
        AND NOT EXISTS (
          SELECT 1
          FROM pg_constraint c
          WHERE c.conname = indexname
        )
    `, [minScans]);

    for (const index of unusedIndexes) {
      try {
        await this.dataSource.query(`DROP INDEX CONCURRENTLY ${index.indexname}`);
        
        this.metrics.increment('database.index.dropped');
        this.logger.info(`Dropped unused index ${index.indexname}`);
        
        this.eventEmitter.emit('database.index.dropped', {
          name: index.indexname,
          table: index.tablename,
          scans: index.idx_scan,
        });
      } catch (error) {
        this.metrics.increment('database.index.drop.failed');
        this.logger.error(`Failed to drop index ${index.indexname}:`, error);
      }
    }
  }

  private parseIndexColumns(indexDef: string): string[] {
    const match = indexDef.match(/\((.*?)\)/);
    if (!match) return [];
    return match[1].split(',').map(col => col.trim());
  }

  private determineIndexType(indexDef: string): string {
    const match = indexDef.match(/USING (\w+)/);
    return match ? match[1].toLowerCase() : 'btree';
  }

  private calculateBenefit(tableStats: any): number {
    const seqScanCost = tableStats.seq_scan * tableStats.n_live_tup;
    const totalScans = tableStats.seq_scan + tableStats.idx_scan;
    if (totalScans === 0) return 0;
    
    return seqScanCost / (tableStats.n_live_tup * totalScans);
  }

  private extractWhereColumns(query: string): string[] {
    // Simple regex to extract column names from WHERE clauses
    const whereMatch = query.match(/WHERE\s+(.*?)(?:ORDER BY|GROUP BY|LIMIT|$)/i);
    if (!whereMatch) return [];

    const conditions = whereMatch[1];
    const columnMatches = conditions.match(/(\w+)\s*[=<>]/g);
    
    return columnMatches 
      ? columnMatches.map(match => match.replace(/[=<>]/g, '').trim())
      : [];
  }
}