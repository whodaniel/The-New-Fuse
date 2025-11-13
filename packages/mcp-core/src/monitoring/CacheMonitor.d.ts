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
/**
 * Cache monitor implementation
 */
export declare class CacheMonitor implements ICacheMonitor {
    private readonly config;
    private readonly logger;
    private readonly accessHistory;
    private readonly evictionHistory;
    private readonly metricsHistory;
    private totalHits;
    private totalMisses;
    private totalEvictions;
    private totalAccessTime;
    private totalAccesses;
    private currentCacheSize;
    constructor(config: CacheMonitorConfig, logger?: Logger);
    /**
     * Record cache hit
     */
    recordCacheHit(key: string, accessTime: number): void;
    /**
     * Record cache miss
     */
    recordCacheMiss(key: string, accessTime: number): void;
    /**
     * Record cache eviction
     */
    recordCacheEviction(key: string, reason: string): void;
    /**
     * Get cache metrics
     */
    getCacheMetrics(): CacheMetrics;
    /**
     * Get cache statistics
     */
    getCacheStatistics(hours: number): CacheMetrics[];
    /**
     * Get cache access patterns
     */
    getCacheAccessPatterns(hours?: number): {
        topKeys: Array<{
            key: string;
            hits: number;
            misses: number;
            hitRate: number;
        }>;
        accessFrequency: Array<{
            hour: number;
            accesses: number;
            hitRate: number;
        }>;
        evictionReasons: Record<string, number>;
    };
    /**
     * Update cache size
     */
    updateCacheSize(size: number): void;
    /**
     * Generate cache report
     */
    generateCacheReport(hours?: number): string;
    /**
     * Clean up old records
     */
    private cleanup;
}
//# sourceMappingURL=CacheMonitor.d.ts.map