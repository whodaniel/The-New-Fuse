'use strict';
/**
 * Database Query Performance Monitoring
 * Tracks slow queries, connection pool metrics, and query patterns
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.DatabaseMonitor = void 0;
exports.createDatabaseMonitorFromEnv = createDatabaseMonitorFromEnv;
class DatabaseMonitor {
  config;
  queries = [];
  poolMetrics = [];
  queryPatterns = new Map();
  cleanupInterval = null;
  constructor(config = {}) {
    this.config = {
      enabled: true,
      slowQueryThreshold: 100,
      captureStackTrace: true,
      maxQueryLength: 1000,
      sampleRate: 1.0,
      retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
      ...config,
    };
  }
  /**
   * Initialize database monitoring
   */
  async initialize() {
    if (!this.config.enabled) {
      return;
    }
    // Set up periodic cleanup
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      60 * 60 * 1000
    ); // Every hour
  }
  /**
   * Track a database query
   */
  trackQuery(database, query, duration, options = {}) {
    if (!this.config.enabled || !this.shouldSample()) {
      return;
    }
    const queryMetric = {
      id: this.generateId(),
      query: this.truncateQuery(query),
      duration,
      timestamp: Date.now(),
      database,
      operation: options.operation || this.detectOperation(query),
      table: options.table,
      rowsAffected: options.rowsAffected,
      success: options.success !== false,
      error: options.error,
    };
    // Capture stack trace for slow queries
    if (this.config.captureStackTrace && duration >= this.config.slowQueryThreshold) {
      queryMetric.stackTrace = this.captureStackTrace();
    }
    this.queries.push(queryMetric);
    this.updateQueryPattern(query, duration);
    // Log slow queries
    if (duration >= this.config.slowQueryThreshold) {
      console.warn(`Slow query detected (${duration}ms):`, {
        database,
        query: queryMetric.query,
        duration,
        operation: queryMetric.operation,
      });
    }
    // Keep only recent queries
    if (this.queries.length > 10000) {
      this.queries = this.queries.slice(-5000);
    }
  }
  /**
   * Track a query execution
   */
  async trackQueryExecution(database, query, executor, options = {}) {
    const startTime = Date.now();
    let rowsAffected;
    let success = true;
    let error;
    try {
      const result = await executor();
      // Try to extract rows affected from result
      if (result && typeof result === 'object') {
        if ('rowCount' in result) {
          rowsAffected = result.rowCount;
        } else if ('affectedRows' in result) {
          rowsAffected = result.affectedRows;
        } else if (Array.isArray(result)) {
          rowsAffected = result.length;
        }
      }
      return result;
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : String(err);
      throw err;
    } finally {
      const duration = Date.now() - startTime;
      this.trackQuery(database, query, duration, {
        ...options,
        rowsAffected,
        success,
        error,
      });
    }
  }
  /**
   * Record connection pool metrics
   */
  recordPoolMetrics(database, metrics) {
    if (!this.config.enabled) {
      return;
    }
    const utilization = (metrics.active / metrics.total) * 100;
    this.poolMetrics.push({
      database,
      timestamp: Date.now(),
      ...metrics,
      utilization,
    });
    // Warn on high utilization
    if (utilization > 80) {
      console.warn(`High database connection pool utilization: ${utilization.toFixed(1)}%`, {
        database,
        ...metrics,
      });
    }
    // Keep only recent metrics
    if (this.poolMetrics.length > 1000) {
      this.poolMetrics = this.poolMetrics.slice(-500);
    }
  }
  /**
   * Get slow queries
   */
  getSlowQueries(limit = 100) {
    return this.queries
      .filter((q) => q.duration >= this.config.slowQueryThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }
  /**
   * Get query patterns
   */
  getQueryPatterns(limit = 50) {
    return Array.from(this.queryPatterns.values())
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, limit);
  }
  /**
   * Get recent pool metrics
   */
  getPoolMetrics(database, limit = 100) {
    let metrics = this.poolMetrics;
    if (database) {
      metrics = metrics.filter((m) => m.database === database);
    }
    return metrics.slice(-limit);
  }
  /**
   * Get statistics
   */
  getStatistics(database) {
    let queries = this.queries;
    if (database) {
      queries = queries.filter((q) => q.database === database);
    }
    const totalQueries = queries.length;
    const slowQueries = queries.filter((q) => q.duration >= this.config.slowQueryThreshold).length;
    const errors = queries.filter((q) => !q.success).length;
    const avgDuration =
      totalQueries > 0 ? queries.reduce((sum, q) => sum + q.duration, 0) / totalQueries : 0;
    const maxDuration = totalQueries > 0 ? Math.max(...queries.map((q) => q.duration)) : 0;
    const operationCounts = {};
    for (const query of queries) {
      operationCounts[query.operation] = (operationCounts[query.operation] || 0) + 1;
    }
    return {
      totalQueries,
      slowQueries,
      avgDuration: Math.round(avgDuration * 100) / 100,
      maxDuration,
      errorRate: totalQueries > 0 ? errors / totalQueries : 0,
      operationCounts,
    };
  }
  /**
   * Update query pattern
   */
  updateQueryPattern(query, duration) {
    const pattern = this.normalizeQuery(query);
    const existing = this.queryPatterns.get(pattern);
    if (existing) {
      existing.count++;
      existing.totalDuration += duration;
      existing.avgDuration = existing.totalDuration / existing.count;
      existing.minDuration = Math.min(existing.minDuration, duration);
      existing.maxDuration = Math.max(existing.maxDuration, duration);
      existing.lastSeen = Date.now();
    } else {
      this.queryPatterns.set(pattern, {
        pattern,
        count: 1,
        totalDuration: duration,
        avgDuration: duration,
        minDuration: duration,
        maxDuration: duration,
        lastSeen: Date.now(),
      });
    }
    // Keep only top 1000 patterns
    if (this.queryPatterns.size > 1000) {
      const sorted = Array.from(this.queryPatterns.entries()).sort(
        ([, a], [, b]) => b.count - a.count
      );
      this.queryPatterns = new Map(sorted.slice(0, 500));
    }
  }
  /**
   * Normalize query for pattern matching
   */
  normalizeQuery(query) {
    return query
      .replace(/\s+/g, ' ')
      .replace(/\b\d+\b/g, '?')
      .replace(/'[^']*'/g, '?')
      .replace(/"[^"]*"/g, '?')
      .replace(/\([^)]*\)/g, '(?)')
      .trim();
  }
  /**
   * Detect operation from query
   */
  detectOperation(query) {
    const normalized = query.trim().toUpperCase();
    if (normalized.startsWith('SELECT')) return 'SELECT';
    if (normalized.startsWith('INSERT')) return 'INSERT';
    if (normalized.startsWith('UPDATE')) return 'UPDATE';
    if (normalized.startsWith('DELETE')) return 'DELETE';
    return 'OTHER';
  }
  /**
   * Truncate query to max length
   */
  truncateQuery(query) {
    if (query.length <= this.config.maxQueryLength) {
      return query;
    }
    return query.substring(0, this.config.maxQueryLength) + '...';
  }
  /**
   * Capture stack trace
   */
  captureStackTrace() {
    const stack = new Error().stack;
    if (!stack) return [];
    return stack
      .split('\n')
      .slice(3) // Skip this function and trackQuery
      .map((line) => line.trim())
      .filter((line) => line.startsWith('at '))
      .slice(0, 10);
  }
  /**
   * Should sample this query
   */
  shouldSample() {
    return Math.random() < this.config.sampleRate;
  }
  /**
   * Generate unique ID
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  /**
   * Cleanup old data
   */
  cleanup() {
    const now = Date.now();
    const cutoff = now - this.config.retentionPeriod;
    this.queries = this.queries.filter((q) => q.timestamp > cutoff);
    this.poolMetrics = this.poolMetrics.filter((m) => m.timestamp > cutoff);
    // Remove old query patterns
    for (const [pattern, data] of this.queryPatterns.entries()) {
      if (data.lastSeen < cutoff) {
        this.queryPatterns.delete(pattern);
      }
    }
  }
  /**
   * Cleanup on destroy
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}
exports.DatabaseMonitor = DatabaseMonitor;
/**
 * Create database monitor from environment variables
 */
function createDatabaseMonitorFromEnv() {
  return new DatabaseMonitor({
    enabled: process.env.DB_MONITORING_ENABLED !== 'false',
    slowQueryThreshold: parseInt(process.env.DB_SLOW_QUERY_THRESHOLD || '100'),
    captureStackTrace: process.env.DB_CAPTURE_STACK_TRACE !== 'false',
    maxQueryLength: parseInt(process.env.DB_MAX_QUERY_LENGTH || '1000'),
    sampleRate: parseFloat(process.env.DB_SAMPLE_RATE || '1.0'),
  });
}
//# sourceMappingURL=db-monitoring.js.map
