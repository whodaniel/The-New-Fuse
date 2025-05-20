import { VectorMemoryItem } from '../types/MemoryTypes.js';
export interface OptimizationStrategy {
    name: string;
    description: string;
    optimize(items: VectorMemoryItem[]): Promise<VectorMemoryItem[]>;
    calculateScore(item: VectorMemoryItem): number;
}
export interface OptimizationResult {
    removedCount: number;
    updatedCount: number;
    memoryUsageBefore: number;
    memoryUsageAfter: number;
    strategyName: string;
}
export declare class MemoryOptimizer {
    private strategies;
    Logger: any;
    constructor();
}
