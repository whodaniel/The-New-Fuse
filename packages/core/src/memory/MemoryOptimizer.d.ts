import { MemoryItem, Cluster, OptimizationResult } from './MemoryTypes';
export declare class MemoryOptimizer {
    private readonly logger;
    private readonly maxMemoryUsage;
    private readonly cleanupThreshold;
    private readonly config;
    constructor();
    optimizeMemory(items: MemoryItem[], clusters: Cluster[]): Promise<OptimizationResult>;
    private getMemoryStats;
    private pruneItems;
    private consolidateClusters;
    private calculateClusterSimilarity;
    private calculateMergedCentroid;
    private calculateClusterQuality;
    private calculateCosineSimilarity;
    private estimateMemoryUsage;
    private calculateMemoryReduction;
    private calculateQualityScore;
    getMemoryUsage(): Promise<{
        estimatedUsage: number;
        maxUsage: number;
        threshold: number;
    }>;
    shouldOptimize(items: MemoryItem[], clusters: Cluster[]): Promise<boolean>;
}
//# sourceMappingURL=MemoryOptimizer.d.ts.map