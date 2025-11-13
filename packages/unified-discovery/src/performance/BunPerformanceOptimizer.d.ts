/**
 * Node.js Performance Optimizer
 *
 * Leverages Node.js performance characteristics to optimize
 * The New Fuse discovery and processing operations.
 */
export interface PerformanceMetrics {
    cpuUsage: number;
    memoryUsage: number;
    eventLoopLag: number;
    gcPressure: number;
    nodeSpecificMetrics: NodeMetrics;
}
export interface NodeMetrics {
    bundlerTime: number;
    transpileTime: number;
    moduleResolutionTime: number;
    jitCompilationTime: number;
    nativeCallOverhead: number;
}
export interface OptimizationConfig {
    enableJITOptimization: boolean;
    enableBundlerOptimization: boolean;
    enableNativeOptimization: boolean;
    maxConcurrency: number;
    memoryThreshold: number;
    gcThreshold: number;
}
export declare class BunPerformanceOptimizer {
    private readonly logger;
    private metrics;
    private config;
    private optimizationInterval?;
    constructor();
    /**
     * Optimize discovery operations using Node.js performance characteristics
     */
    optimizeDiscoveryOperation<T>(operation: () => Promise<T>, operationName: string): Promise<T>;
}
//# sourceMappingURL=BunPerformanceOptimizer.d.ts.map