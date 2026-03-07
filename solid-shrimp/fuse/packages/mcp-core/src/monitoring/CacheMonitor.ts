/**
 * Cache Monitoring System
 */

import { ICacheMonitor } from '../interfaces/IMonitoring';
import { CacheMetrics } from '../types/monitoring';
import { Logger } from '../utils/Logger';

export interface CacheMonitorConfig {
  /** Metrics retention period (ms) */
  retentionPeriod: number;
}

interface CacheAccessRecord {
  key: string;
  timestamp: Date;
  accessTime: number;
  hit: boolean;
}

interface CacheEvictionRecord {
  key: string;
  timestamp: Date;
  reason: string;
}

/**
 * Cache monitor implementation
 */
export class CacheMonitor implements ICacheMonitor {
  private readonly config: CacheMonitorConfig;
  private readonly logger: Logger;
  private readonly accessHistory: CacheAccessRecord[] = [];
  private readonly evictionHistory: CacheEvictionRecord[] = [];
  private readonly metricsHistory: Array<{ metrics: CacheMetrics; timestamp: Date }> = [];

  // Current metrics
  private totalHits = 0;
  private totalMisses = 0;
  private totalEvictions = 0;
  private totalAccessTime = 0;
  private totalAccesses = 0;
  private currentCacheSize = 0;

  constructor(config: CacheMonitorConfig, logger?: Logger) {
    this.config = config;
    this.logger = logger || new Logger('CacheMonitor');
    
    // Start periodic cleanup
    setInterval(() => this.cleanup(), 60000); // Every minute
  }

  /**
   * Record cache hit
   */
  recordCacheHit(key: string, accessTime: number): void {
    const record: CacheAccessRecord = {
      key,
      timestamp: new Date(),
      accessTime,
      hit: true
    };

    this.accessHistory.push(record);
    this.totalHits++;
    this.totalAccessTime += accessTime;
    this.totalAccesses++;

    this.logger.debug(`Cache hit recorded: ${key}`, { accessTime });
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(key: string, accessTime: number): void {
    const record: CacheAccessRecord = {
      key,
      timestamp: new Date(),
      accessTime,
      hit: false
    };

    this.accessHistory.push(record);
    this.totalMisses++;
    this.totalAccessTime += accessTime;
    this.totalAccesses++;

    this.logger.debug(`Cache miss recorded: ${key}`, { accessTime });
  }

  /**
   * Record cache eviction
   */
  recordCacheEviction(key: string, reason: string): void {
    const record: CacheEvictionRecord = {
      key,
      timestamp: new Date(),
      reason
    };

    this.evictionHistory.push(record);
    this.totalEvictions++;
    this.currentCacheSize = Math.max(0, this.currentCacheSize - 1);

    this.logger.debug(`Cache eviction recorded: ${key}`, { reason });
  }

  /**
   * Get cache metrics
   */
  getCacheMetrics(): CacheMetrics {
    const hitRate = this.totalAccesses > 0 ? this.totalHits / this.totalAccesses : 0;
    const avgAccessTime = this.totalAccesses > 0 ? this.totalAccessTime / this.totalAccesses : 0;

    return {
      size: this.currentCacheSize,
      hits: this.totalHits,
      misses: this.totalMisses,
      hitRate,
      evictions: this.totalEvictions,
      avgAccessTime
    };
  }

  /**
   * Get cache statistics
   */
  getCacheStatistics(hours: number): CacheMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metricsHistory
      .filter(entry => entry.timestamp >= cutoff)
      .map(entry => entry.metrics);
  }

  /**
   * Get cache access patterns
   */
  getCacheAccessPatterns(hours: number = 1): {
    topKeys: Array<{ key: string; hits: number; misses: number; hitRate: number }>;
    accessFrequency: Array<{ hour: number; accesses: number; hitRate: number }>;
    evictionReasons: Record<string, number>;
  } {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const recentAccesses = this.accessHistory.filter(record => record.timestamp >= cutoff);
    const recentEvictions = this.evictionHistory.filter(record => record.timestamp >= cutoff);

    // Calculate top keys
    const keyStats = new Map<string, { hits: number; misses: number }>();
    recentAccesses.forEach(record => {
      if (!keyStats.has(record.key)) {
        keyStats.set(record.key, { hits: 0, misses: 0 });
      }
      const stats = keyStats.get(record.key)!;
      if (record.hit) {
        stats.hits++;
      } else {
        stats.misses++;
      }
    });

    const topKeys = Array.from(keyStats.entries())
      .map(([key, stats]) => ({
        key,
        hits: stats.hits,
        misses: stats.misses,
        hitRate: (stats.hits + stats.misses) > 0 ? stats.hits / (stats.hits + stats.misses) : 0
      }))
      .sort((a, b) => (b.hits + b.misses) - (a.hits + a.misses))
      .slice(0, 10);

    // Calculate access frequency by hour
    const hourlyStats = new Map<number, { accesses: number; hits: number }>();
    recentAccesses.forEach(record => {
      const hour = record.timestamp.getHours();
      if (!hourlyStats.has(hour)) {
        hourlyStats.set(hour, { accesses: 0, hits: 0 });
      }
      const stats = hourlyStats.get(hour)!;
      stats.accesses++;
      if (record.hit) {
        stats.hits++;
      }
    });

    const accessFrequency = Array.from(hourlyStats.entries())
      .map(([hour, stats]) => ({
        hour,
        accesses: stats.accesses,
        hitRate: stats.accesses > 0 ? stats.hits / stats.accesses : 0
      }))
      .sort((a, b) => a.hour - b.hour);

    // Calculate eviction reasons
    const evictionReasons: Record<string, number> = {};
    recentEvictions.forEach(record => {
      evictionReasons[record.reason] = (evictionReasons[record.reason] || 0) + 1;
    });

    return {
      topKeys,
      accessFrequency,
      evictionReasons
    };
  }

  /**
   * Update cache size
   */
  updateCacheSize(size: number): void {
    this.currentCacheSize = size;
  }

  /**
   * Generate cache report
   */
  generateCacheReport(hours: number = 24): string {
    const metrics = this.getCacheMetrics();
    const patterns = this.getCacheAccessPatterns(hours);
    
    const report = [
      `# Cache Performance Report`,
      '',
      `## Current Metrics`,
      `- **Cache Size**: ${metrics.size} items`,
      `- **Total Hits**: ${metrics.hits}`,
      `- **Total Misses**: ${metrics.misses}`,
      `- **Hit Rate**: ${(metrics.hitRate * 100).toFixed(2)}%`,
      `- **Total Evictions**: ${metrics.evictions}`,
      `- **Average Access Time**: ${metrics.avgAccessTime.toFixed(2)}ms`,
      '',
      `## Top Accessed Keys (Last ${hours}h)`,
      '| Key | Hits | Misses | Hit Rate |',
      '|-----|------|--------|----------|'
    ];

    patterns.topKeys.forEach(key => {
      report.push(`| ${key.key} | ${key.hits} | ${key.misses} | ${(key.hitRate * 100).toFixed(2)}% |`);
    });

    report.push('');
    report.push(`## Access Frequency by Hour`);
    report.push('| Hour | Accesses | Hit Rate |');
    report.push('|------|----------|----------|');

    patterns.accessFrequency.forEach(freq => {
      report.push(`| ${freq.hour}:00 | ${freq.accesses} | ${(freq.hitRate * 100).toFixed(2)}% |`);
    });

    if (Object.keys(patterns.evictionReasons).length > 0) {
      report.push('');
      report.push(`## Eviction Reasons`);
      Object.entries(patterns.evictionReasons).forEach(([reason, count]) => {
        report.push(`- **${reason}**: ${count}`);
      });
    }

    return report.join('\n');
  }

  /**
   * Clean up old records
   */
  private cleanup(): void {
    const cutoff = new Date(Date.now() - this.config.retentionPeriod);
    
    // Clean up access history
    const initialAccessLength = this.accessHistory.length;
    this.accessHistory.splice(0, this.accessHistory.findIndex(
      record => record.timestamp >= cutoff
    ));

    // Clean up eviction history
    const initialEvictionLength = this.evictionHistory.length;
    this.evictionHistory.splice(0, this.evictionHistory.findIndex(
      record => record.timestamp >= cutoff
    ));

    // Clean up metrics history
    const initialMetricsLength = this.metricsHistory.length;
    this.metricsHistory.splice(0, this.metricsHistory.findIndex(
      entry => entry.timestamp >= cutoff
    ));

    const cleanedRecords = 
      (initialAccessLength - this.accessHistory.length) +
      (initialEvictionLength - this.evictionHistory.length) +
      (initialMetricsLength - this.metricsHistory.length);

    if (cleanedRecords > 0) {
      this.logger.debug(`Cleaned up ${cleanedRecords} old cache records`);
    }

    // Store current metrics in history
    this.metricsHistory.push({
      metrics: this.getCacheMetrics(),
      timestamp: new Date()
    });
  }
}