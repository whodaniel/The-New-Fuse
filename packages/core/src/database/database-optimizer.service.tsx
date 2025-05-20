import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CentralizedLoggingService } from '../logging/centralized-logging.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PerformanceMonitoringService } from '../monitoring/performance-monitoring.service.js';

export interface QueryPerformanceData {
  query: string;
  duration: number;
  timestamp: Date;
  parameters?: any[];
  source?: string;
  correlationId?: string;
}

export interface TableStatistics {
  tableName: string;
  rowCount: number;
  sizeBytes: number;
  indexSizeBytes: number;
  deadTuples: number;
  lastVacuum?: Date;
  lastAnalyze?: Date;
}

export interface OptimizationRecommendation {
  type: 'index' | 'vacuum' | 'analyze' | 'rewrite' | 'partition';
  tableName: string;
  reason: string;
  sql?: string;
  priority: 'low' | 'medium' | 'high';
  estimatedImpact: string;
}

@Injectable()
export class DatabaseOptimizerService implements OnModuleInit {
  private readonly logger: any;
  private optimizationInterval: NodeJS.Timeout;
  private slowQueryThresholdMs: number;
  private vacuumThreshold: number;
  private analyzeThreshold: number;
  private enabled: boolean;
  private autoOptimize: boolean;
  private slowQueries: QueryPerformanceData[] = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly loggingService: CentralizedLoggingService,
    private readonly prisma: PrismaService,
    private readonly performanceMonitor: PerformanceMonitoringService,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.logger = this.loggingService.createLogger('DatabaseOptimizer');
  }

  async onModuleInit() {
    // Load configuration
    this.enabled = this.configService.get<boolean>('database.optimization.enabled', true);
    this.autoOptimize = this.configService.get<boolean>('database.optimization.autoOptimize', false);
    this.slowQueryThresholdMs = this.configService.get<number>('database.optimization.slowQueryThresholdMs', 1000);
    this.vacuumThreshold = this.configService.get<number>('database.optimization.vacuumThreshold', 1000);
    this.analyzeThreshold = this.configService.get<number>('database.optimization.analyzeThreshold', 10000);

    if (!this.enabled) {
      this.logger.info('Database optimization is disabled');
      return;
    }

    // Set up event listeners
    this.setupEventListeners();
    
    // Start optimization interval
    const intervalMs = this.configService.get<number>('database.optimization.checkIntervalHours', 24) * 60 * 60 * 1000;
    this.optimizationInterval = setInterval(() => this.checkAndOptimize(), intervalMs);
    
    // Run initial check
    await this.checkAndOptimize();
    
    this.logger.info('Database optimizer service initialized', {
      metadata: {
        autoOptimize: this.autoOptimize,
        slowQueryThresholdMs: this.slowQueryThresholdMs
      }
    });
  }

  /**
   * Record a query's performance data
   */
  recordQueryPerformance(data: QueryPerformanceData): void {
    // Record in performance monitoring
    this.performanceMonitor.recordResponseTime({
      operation: 'database.query',
      durationMs: data.duration,
      tags: {
        source: data.source || 'unknown',
        correlationId: data.correlationId || 'unknown'
      }
    });
    
    // Check if it's a slow query
    if (data.duration > this.slowQueryThresholdMs) {
      this.handleSlowQuery(data);
    }
  }

  /**
   * Get table statistics
   */
  async getTableStatistics(): Promise<TableStatistics[]> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT
          t.schemaname || '.' || t.relname AS table_name,
          c.reltuples AS row_count,
          pg_size_pretty(pg_total_relation_size('"' || t.schemaname || '"."' || t.relname || '"')) AS size,
          pg_size_pretty(pg_indexes_size('"' || t.schemaname || '"."' || t.relname || '"')) AS index_size,
          pg_size_pretty(pg_total_relation_size('"' || t.schemaname || '"."' || t.relname || '"') - pg_indexes_size('"' || t.schemaname || '"."' || t.relname || '"')) AS table_size,
          pg_stat_get_live_tuples(c.oid) AS live_tuples,
          pg_stat_get_dead_tuples(c.oid) AS dead_tuples,
          pg_total_relation_size('"' || t.schemaname || '"."' || t.relname || '"') AS size_bytes,
          pg_indexes_size('"' || t.schemaname || '"."' || t.relname || '"') AS index_size_bytes,
          s.last_vacuum,
          s.last_analyze
        FROM pg_tables t
        JOIN pg_class c ON t.tablename = c.relname
        LEFT JOIN pg_stat_user_tables s ON t.tablename = s.relname
        WHERE t.schemaname = 'public'
        ORDER BY pg_total_relation_size('"' || t.schemaname || '"."' || t.relname || '"') DESC;
      `;
      
      return (result as any[]).map(row => ({
        tableName: row.table_name,
        rowCount: parseInt(row.row_count, 10),
        sizeBytes: parseInt(row.size_bytes, 10),
        indexSizeBytes: parseInt(row.index_size_bytes, 10),
        deadTuples: parseInt(row.dead_tuples, 10),
        lastVacuum: row.last_vacuum,
        lastAnalyze: row.last_analyze
      }));
    } catch (error) {
      this.logger.error('Failed to get table statistics', { error });
      return [];
    }
  }

  /**
   * Get optimization recommendations
   */
  async getOptimizationRecommendations(): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    
    try {
      // Get table statistics
      const tableStats = await this.getTableStatistics();
      
      // Check for tables that need vacuuming
      for (const table of tableStats) {
        if (table.deadTuples > this.vacuumThreshold) {
          recommendations.push({
            type: 'vacuum',
            tableName: table.tableName,
            reason: `Table has ${table.deadTuples} dead tuples`,
            sql: `VACUUM (ANALYZE, VERBOSE) ${table.tableName};`,
            priority: table.deadTuples > this.vacuumThreshold * 10 ? 'high' : 'medium',
            estimatedImpact: 'Reclaim disk space and improve query performance'
          });
        }
        
        // Check for tables that need analyzing
        if (
          (!table.lastAnalyze || new Date().getTime() - table.lastAnalyze.getTime() > 7 * 24 * 60 * 60 * 1000) && 
          table.rowCount > this.analyzeThreshold
        ) {
          recommendations.push({
            type: 'analyze',
            tableName: table.tableName,
            reason: `Table statistics are outdated or missing`,
            sql: `ANALYZE VERBOSE ${table.tableName};`,
            priority: 'medium',
            estimatedImpact: 'Improve query planner accuracy'
          });
        }
      }
      
      // Check for missing indexes based on slow queries
      const missingIndexes = await this.identifyMissingIndexes();
      recommendations.push(...missingIndexes);
      
      return recommendations;
    } catch (error) {
      this.logger.error('Failed to get optimization recommendations', { error });
      return [];
    }
  }

  /**
   * Apply optimization recommendations
   */
  async applyOptimizations(recommendations: OptimizationRecommendation[]): Promise<{ success: boolean; results: any[] }> {
    if (!this.enabled) {
      return { success: false, results: [] };
    }
    
    const results = [];
    let success = true;
    
    for (const recommendation of recommendations) {
      if (!recommendation.sql) {
        continue;
      }
      
      try {
        this.logger.info(`Applying optimization: ${recommendation.type} on ${recommendation.tableName}`, {
          metadata: {
            sql: recommendation.sql,
            reason: recommendation.reason
          }
        });
        
        // Execute the SQL
        const result = await this.prisma.$executeRawUnsafe(recommendation.sql);
        
        results.push({
          type: recommendation.type,
          tableName: recommendation.tableName,
          success: true,
          result
        });
        
        // Emit event
        this.eventEmitter.emit('database.optimization', {
          type: recommendation.type,
          tableName: recommendation.tableName,
          sql: recommendation.sql,
          success: true
        });
      } catch (error) {
        this.logger.error(`Failed to apply optimization: ${recommendation.type} on ${recommendation.tableName}`, { error });
        
        results.push({
          type: recommendation.type,
          tableName: recommendation.tableName,
          success: false,
          error: error.message
        });
        
        success = false;
        
        // Emit event
        this.eventEmitter.emit('database.optimization', {
          type: recommendation.type,
          tableName: recommendation.tableName,
          sql: recommendation.sql,
          success: false,
          error: error.message
        });
      }
    }
    
    return { success, results };
  }

  /**
   * Get slow query statistics
   */
  getSlowQueryStats(): { count: number; avgDuration: number; topQueries: any[] } {
    const count = this.slowQueries.length;
    
    if (count === 0) {
      return { count: 0, avgDuration: 0, topQueries: [] };
    }
    
    const avgDuration = this.slowQueries.reduce((sum, q) => sum + q.duration, 0) / count;
    
    // Group by query pattern
    const queryGroups = new Map<string, { count: number; totalDuration: number; maxDuration: number; examples: QueryPerformanceData[] }>();
    
    for (const query of this.slowQueries) {
      // Normalize query by removing specific values
      const normalizedQuery = this.normalizeQuery(query.query);
      
      if (!queryGroups.has(normalizedQuery)) {
        queryGroups.set(normalizedQuery, {
          count: 0,
          totalDuration: 0,
          maxDuration: 0,
          examples: []
        });
      }
      
      const group = queryGroups.get(normalizedQuery)!;
      group.count++;
      group.totalDuration += query.duration;
      group.maxDuration = Math.max(group.maxDuration, query.duration);
      
      // Keep only a few examples
      if (group.examples.length < 3) {
        group.examples.push(query);
      }
    }
    
    // Convert to array and sort by total duration
    const topQueries = Array.from(queryGroups.entries())
      .map(([query, stats]) => ({
        query,
        count: stats.count,
        avgDuration: stats.totalDuration / stats.count,
        maxDuration: stats.maxDuration,
        examples: stats.examples
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 10);
    
    return { count, avgDuration, topQueries };
  }

  /**
   * Private methods
   */

  private async checkAndOptimize(): Promise<void> {
    try {
      // Get recommendations
      const recommendations = await this.getOptimizationRecommendations();
      
      if (recommendations.length === 0) {
        this.logger.info('No database optimizations needed');
        return;
      }
      
      this.logger.info(`Found ${recommendations.length} database optimization recommendations`);
      
      // Apply optimizations if auto-optimize is enabled
      if (this.autoOptimize) {
        // Only apply high and medium priority optimizations automatically
        const autoRecommendations = recommendations.filter(r => r.priority !== 'low');
        
        if (autoRecommendations.length > 0) {
          this.logger.info(`Automatically applying ${autoRecommendations.length} optimizations`);
          await this.applyOptimizations(autoRecommendations);
        }
      } else {
        // Just emit event with recommendations
        this.eventEmitter.emit('database.optimizationRecommendations', recommendations);
      }
    } catch (error) {
      this.logger.error('Error during database optimization check', { error });
    }
  }

  private handleSlowQuery(data: QueryPerformanceData): void {
    this.logger.warn(`Slow query detected: ${data.duration}ms`, {
      metadata: {
        query: data.query.substring(0, 200) + (data.query.length > 200 ? '...' : ''),
        duration: data.duration,
        source: data.source,
        correlationId: data.correlationId
      }
    });
    
    // Add to slow queries list
    this.slowQueries.push(data);
    
    // Keep only the last 1000 slow queries
    if (this.slowQueries.length > 1000) {
      this.slowQueries.shift();
    }
    
    // Emit event
    this.eventEmitter.emit('database.slowQuery', data);
  }

  private async identifyMissingIndexes(): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    
    try {
      // Get tables with sequential scans
      const seqScans = await this.prisma.$queryRaw`
        SELECT
          schemaname || '.' || relname AS table_name,
          seq_scan,
          seq_tup_read,
          idx_scan,
          n_live_tup
        FROM pg_stat_user_tables
        WHERE seq_scan > 10
        AND n_live_tup > 1000
        AND seq_tup_read / GREATEST(seq_scan, 1) > 100
        ORDER BY seq_tup_read DESC
        LIMIT 10;
      `;
      
      for (const table of seqScans as any[]) {
        // Check if we have slow queries for this table
        const tableQueries = this.slowQueries.filter(q => 
          q.query.toLowerCase().includes(table.table_name.toLowerCase())
        );
        
        if (tableQueries.length > 0) {
          // Analyze queries to find common WHERE clauses
          const whereColumns = this.extractWhereColumns(tableQueries);
          
          if (whereColumns.length > 0) {
            // Create index recommendation
            const indexName = `idx_${table.table_name.split('.')[1]}_${whereColumns.join('_')}`;
            const indexColumns = whereColumns.join(', ');
            
            recommendations.push({
              type: 'index',
              tableName: table.table_name,
              reason: `Table has ${table.seq_scan} sequential scans with ${table.seq_tup_read} rows read`,
              sql: `CREATE INDEX ${indexName} ON ${table.table_name} (${indexColumns});`,
              priority: 'high',
              estimatedImpact: 'Potentially significant query performance improvement'
            });
          }
        }
      }
      
      return recommendations;
    } catch (error) {
      this.logger.error('Failed to identify missing indexes', { error });
      return [];
    }
  }

  private extractWhereColumns(queries: QueryPerformanceData[]): string[] {
    const columnCounts = new Map<string, number>();
    
    for (const query of queries) {
      // Simple regex to extract column names from WHERE clauses
      const whereClauseMatch = query.query.match(/WHERE\s+(.+?)(?:ORDER BY|GROUP BY|LIMIT|$)/i);
      
      if (whereClauseMatch) {
        const whereClause = whereClauseMatch[1];
        
        // Extract column names (this is a simplified approach)
        const columnMatches = whereClause.match(/(\w+)\s*(?:=|>|<|>=|<=|LIKE|IN)/g);
        
        if (columnMatches) {
          for (const match of columnMatches) {
            const column = match.trim().split(/\s+/)[0];
            columnCounts.set(column, (columnCounts.get(column) || 0) + 1);
          }
        }
      }
    }
    
    // Sort by frequency and take top 3
    return Array.from(columnCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([column]) => column);
  }

  private normalizeQuery(query: string): string {
    // Replace specific values with placeholders
    return query
      .replace(/\d+/g, '?')
      .replace(/'[^']*'/g, '?')
      .replace(/"[^"]*"/g, '?')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private setupEventListeners(): void {
    // Listen for query performance events
    this.eventEmitter.on('database.query', (data: QueryPerformanceData) => {
      this.recordQueryPerformance(data);
    });
  }
}
