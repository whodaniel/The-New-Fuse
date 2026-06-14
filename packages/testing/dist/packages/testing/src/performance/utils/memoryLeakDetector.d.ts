export interface MemorySnapshot {
    timestamp: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
}
export interface LeakDetectionResult {
    isLeaking: boolean;
    leakRate: number;
    totalMemoryGrowth: number;
    duration: number;
    snapshots: MemorySnapshot[];
    analysisDetails: {
        linearRegressionSlope: number;
        rSquared: number;
        confidence: number;
    };
}
export interface LeakDetectionOptions {
    duration?: number;
    measureInterval?: number;
    iterations?: number;
    allowedGrowthRate?: number;
    minConfidence?: number;
}
/**
 * Monitors memory usage over time to detect potential memory leaks
 */
export declare function detectMemoryLeak(operation: () => Promise<void> | void, options?: LeakDetectionOptions): Promise<LeakDetectionResult>;
//# sourceMappingURL=memoryLeakDetector.d.ts.map