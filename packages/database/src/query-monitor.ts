import { PrismaClient } from '../generated/prisma';

export interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: number;
  params?: any[];
  model?: string;
  operation?: string;
}

export interface ConnectionPoolMetrics {
  activeConnections: number;
  idleConnections: number;
  waitingQueries: number;
  totalConnections: number;
}

export interface DatabasePerformanceStats {
  slowQueries: QueryMetrics[];
  averageQueryTime: number;
  totalQueries: number;
  connectionPool: ConnectionPoolMetrics;
  recommendations: string[];
}

class QueryPerformanceMonitor {
  private queryMetrics: QueryMetrics[] = [];
  private readonly slowQueryThreshold = 1000; // 1 second
  private readonly maxMetricsHistory = 1000;
  private queryStats = new Map<string, { count: number; totalTime: number; avgTime: number }>();

  constructor(private prisma: PrismaClient) {
    this.initializeMonitoring();
  }

  private initializeMonitoring(): void {
    // Monitor Prisma queries
    (this.prisma as any).$on('query', (e: any) => {
      this.recordQuery({
        query: e.query,
        duration: e.duration,
        timestamp: Date.now(),
        params: e.params,
      });
    });

    // Log slow queries
    (this.prisma as any).$on('query', (e: any) => {
      if (e.duration > this.slowQueryThreshold) {
        
      }
    });
  }

  private recordQuery(metrics: QueryMetrics): void {
    // Add to metrics history
    this.queryMetrics.push(metrics);
    
    // Keep only recent metrics
    if (this.queryMetrics.length > this.maxMetricsHistory) {
      this.queryMetrics.shift();
    }

    // Update query statistics
    const queryKey = this.extractQueryPattern(metrics.query);
    const existing = this.queryStats.get(queryKey) || { count: 0, totalTime: 0, avgTime: 0 };
    
    existing.count++;
    existing.totalTime += metrics.duration;
    existing.avgTime = existing.totalTime / existing.count;
    
    this.queryStats.set(queryKey, existing);
  }

  private extractQueryPattern(query: string): string {
    // Normalize query to identify patterns
    return query
      .replace(/\$\d+/g, '?') // Replace parameter placeholders
      .replace(/'\w+'/g, '?') // Replace string literals
      .replace(/\d+/g, '?')   // Replace numbers
      .replace(/\s+/g, ' ')   // Normalize whitespace
      .trim();
  }

  // Get slow queries in the last period
  getSlowQueries(minutes: number = 60): QueryMetrics[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.queryMetrics
      .filter(q => q.timestamp > cutoff && q.duration > this.slowQueryThreshold)
      .sort((a, b) => b.duration - a.duration);
  }

  // Get query statistics
  getQueryStats(): Array<{ pattern: string; count: number; avgTime: number; totalTime: number }> {
    return Array.from(this.queryStats.entries())
      .map(([pattern, stats]) => ({ pattern, ...stats }))
      .sort((a, b) => b.avgTime - a.avgTime);
  }

  // Get performance recommendations
  getRecommendations(): string[] {
    const recommendations: string[] = [];
    const slowQueries = this.getSlowQueries(60);
    const stats = this.getQueryStats();

    // Check for missing indexes
    const selectQueries = stats.filter(s => 
      s.pattern.toLowerCase().includes('select') && s.avgTime > 500
    );
    
    if (selectQueries.length > 0) {
      recommendations.push(
        `Consider adding indexes for ${selectQueries.length} slow SELECT queries`
      );
    }

    // Check for N+1 queries
    const frequentQueries = stats.filter(s => s.count > 100 && s.avgTime > 100);
    if (frequentQueries.length > 0) {
      recommendations.push(
        `Potential N+1 queries detected: ${frequentQueries.length} patterns with high frequency`
      );
    }

    // Check for complex queries
    if (slowQueries.length > 10) {
      recommendations.push(
        `${slowQueries.length} queries exceeded ${this.slowQueryThreshold}ms - consider optimization`
      );
    }

    // Memory usage recommendations
    const avgQueryTime = this.getAverageQueryTime();
    if (avgQueryTime > 200) {
      recommendations.push(
        `Average query time is ${avgQueryTime.toFixed(2)}ms - review connection pool settings`
      );
    }

    return recommendations;
  }

  // Calculate average query time
  getAverageQueryTime(): number {
    if (this.queryMetrics.length === 0) return 0;
    
    const total = this.queryMetrics.reduce((sum, q) => sum + q.duration, 0);
    return total / this.queryMetrics.length;
  }

  // Get connection pool health (mock implementation - depends on database driver)
  async getConnectionPoolHealth(): Promise<ConnectionPoolMetrics> {
    // This would be implementation-specific to your database driver
    // For PostgreSQL with pg pool, you'd check pool.totalCount, pool.idleCount, etc.
    
    return {
      activeConnections: 5, // Mock data
      idleConnections: 3,
      waitingQueries: 0,
      totalConnections: 8,
    };
  }

  // Generate comprehensive performance report
  async generatePerformanceReport(): Promise<DatabasePerformanceStats> {
    const slowQueries = this.getSlowQueries(60);
    const averageQueryTime = this.getAverageQueryTime();
    const connectionPool = await this.getConnectionPoolHealth();
    const recommendations = this.getRecommendations();

    const report: DatabasePerformanceStats = {
      slowQueries: slowQueries.slice(0, 10), // Top 10 slowest
      averageQueryTime,
      totalQueries: this.queryMetrics.length,
      connectionPool,
      recommendations,
    };

    return report;
  }

  // Clear metrics history
  clearMetrics(): void {
    this.queryMetrics = [];
    this.queryStats.clear();
  }

  // Export metrics for external analysis
  exportMetrics(): {
    queries: QueryMetrics[];
    stats: Array<{ pattern: string; count: number; avgTime: number; totalTime: number }>;
  } {
    return {
      queries: this.queryMetrics,
      stats: this.getQueryStats(),
    };
  }
}

// Query optimization utilities
export class QueryOptimizer {
  static generateIndexSuggestions(slowQueries: QueryMetrics[]): string[] {
    const suggestions: string[] = [];
    
    slowQueries.forEach(query => {
      const sql = query.query.toLowerCase();
      
      // Detect common patterns that need indexes
      if (sql.includes('where') && sql.includes('order by')) {
        suggestions.push(`Consider composite index for WHERE + ORDER BY clauses in: ${query.query.substring(0, 100)}...`);
      }
      
      if (sql.includes('join') && query.duration > 2000) {
        suggestions.push(`Consider indexes on JOIN columns for: ${query.query.substring(0, 100)}...`);
      }
      
      if (sql.includes('group by') && query.duration > 1500) {
        suggestions.push(`Consider indexes on GROUP BY columns for: ${query.query.substring(0, 100)}...`);
      }
    });
    
    return suggestions;
  }

  static suggestQueryRefactoring(queryPattern: string, stats: { count: number; avgTime: number }): string[] {
    const suggestions: string[] = [];
    
    if (stats.count > 1000 && stats.avgTime > 100) {
      suggestions.push(`High-frequency query detected - consider caching: ${queryPattern}`);
    }
    
    if (queryPattern.includes('select *')) {
      suggestions.push(`Avoid SELECT * - specify only needed columns: ${queryPattern}`);
    }
    
    if (stats.avgTime > 1000) {
      suggestions.push(`Slow query detected - review indexes and query structure: ${queryPattern}`);
    }
    
    return suggestions;
  }
}

export { QueryPerformanceMonitor };