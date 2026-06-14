export interface VectorMemoryItem {
    id: string;
    vector: number[];
    metadata: {
        accessCount: number;
        lastAccessed: number;
        importance: number;
        type?: string;
        createdAt?: number;
    };
}
export interface OptimizationConfig {
    maxItems: number;
    importanceThreshold: number;
    accessCountThreshold: number;
    ageThresholdDays: number;
    compressionRatio: number;
}
export declare class MemoryOptimizer {
    optimize(items: VectorMemoryItem[]): Promise<VectorMemoryItem[]>;
    analyzeMemoryUsage(items: VectorMemoryItem[]): Promise<any>;
    identifyPruningCandidates(items: VectorMemoryItem[]): Promise<VectorMemoryItem[]>;
    compressMemory(items: VectorMemoryItem[]): Promise<VectorMemoryItem[]>;
    getOptimizationStats(): any;
}
//# sourceMappingURL=MemoryOptimizer.d.ts.map