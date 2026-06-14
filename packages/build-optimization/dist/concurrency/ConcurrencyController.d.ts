/**
 * ConcurrencyController - Manages build process concurrency based on system resources and memory usage
 */
import { IConcurrencyController } from '../interfaces/index.js';
import { MemoryUsage, SystemResources } from '../types/index.js';
export declare class ConcurrencyController implements IConcurrencyController {
    private currentConcurrency;
    private maxConcurrency;
    private minConcurrency;
    private defaultConcurrency;
    private memoryThreshold;
    private adjustmentFactor;
    constructor(initialConcurrency?: number, maxConcurrency?: number);
    /**
     * Get current concurrency level
     */
    getCurrentConcurrency(): number;
    /**
     * Set maximum concurrency
     */
    setMaxConcurrency(max: number): void;
    /**
     * Adjust concurrency based on memory usage
     */
    adjustConcurrency(memoryUsage: MemoryUsage): Promise<void>;
    /**
     * Calculate optimal initial concurrency based on system resources
     */
    calculateOptimalConcurrency(systemResources: SystemResources): number;
    /**
     * Reset concurrency to default
     */
    resetConcurrency(): void;
    /**
     * Set memory threshold for concurrency adjustments
     */
    setMemoryThreshold(threshold: number): void;
    /**
     * Set adjustment factor for concurrency changes
     */
    setAdjustmentFactor(factor: number): void;
    /**
     * Get concurrency statistics
     */
    getStats(): {
        current: number;
        max: number;
        min: number;
        default: number;
        memoryThreshold: number;
    };
    /**
     * Reduce concurrency by adjustment factor
     */
    private reduceConcurrency;
    /**
     * Increase concurrency by 1 (conservative approach)
     */
    private increaseConcurrency;
    /**
     * Force set concurrency (for testing or emergency situations)
     */
    forceConcurrency(concurrency: number): void;
    /**
     * Check if concurrency adjustment is needed based on memory usage
     */
    shouldAdjustConcurrency(memoryUsage: MemoryUsage): Promise<{
        shouldAdjust: boolean;
        direction: 'increase' | 'decrease' | 'none';
        reason: string;
    }>;
}
//# sourceMappingURL=ConcurrencyController.d.ts.map