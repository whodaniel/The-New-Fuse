export interface PerformanceResult {
    duration: number;
    memoryBefore: number;
    memoryAfter: number;
    memoryDiff: number;
    gcCollections?: number;
}
export interface PerformanceThresholds {
    maxDuration?: number;
    maxMemoryUsage?: number;
    maxMemoryLeak?: number;
}
export interface PerformanceStats {
    mean: number;
    median: number;
    p95: number;
    p99: number;
    min: number;
    max: number;
    standardDeviation: number;
}
/**
 * Measures execution time and memory usage of a function
 */
export declare function measurePerformance<T>(fn: () => Promise<T> | T, options?: {
    iterations?: number;
    warmupIterations?: number;
    thresholds?: PerformanceThresholds;
    label?: string;
}): Promise<{
    results: PerformanceResult[];
    stats: PerformanceStats;
    value: T;
}>;
//# sourceMappingURL=measurePerformance.d.ts.map