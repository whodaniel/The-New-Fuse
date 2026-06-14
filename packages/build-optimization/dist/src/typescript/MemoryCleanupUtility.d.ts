/**
 * Memory Cleanup Utility
 *
 * Provides utilities for cleaning up memory between TypeScript compilation stages:
 * - Garbage collection hints
 * - TypeScript compiler memory release
 * - Memory usage monitoring and verification
 * - Module cache cleanup
 */
import { MemoryUsage } from '../types/index.js';
/**
 * Memory cleanup configuration
 */
export interface MemoryCleanupConfig {
    /** Enable aggressive garbage collection */
    aggressiveGC?: boolean;
    /** Clear Node.js module cache */
    clearModuleCache?: boolean;
    /** Clear TypeScript-specific caches */
    clearTypeScriptCache?: boolean;
    /** Wait time after cleanup in milliseconds */
    cleanupDelay?: number;
    /** Maximum cleanup attempts */
    maxCleanupAttempts?: number;
    /** Memory threshold for cleanup verification (MB) */
    memoryThreshold?: number;
}
/**
 * Memory cleanup result
 */
export interface MemoryCleanupResult {
    /** Whether cleanup was successful */
    success: boolean;
    /** Memory usage before cleanup */
    memoryBefore: MemoryUsage;
    /** Memory usage after cleanup */
    memoryAfter: MemoryUsage;
    /** Amount of memory freed in MB */
    memoryFreed: number;
    /** Cleanup duration in milliseconds */
    duration: number;
    /** Any errors encountered during cleanup */
    errors: string[];
}
/**
 * Memory cleanup utility implementation
 */
export declare class MemoryCleanupUtility {
    private config;
    private cleanupHistory;
    constructor(config?: MemoryCleanupConfig);
    /**
     * Perform comprehensive memory cleanup
     */
    performCleanup(): Promise<MemoryCleanupResult>;
    /**
     * Force garbage collection with multiple strategies
     */
    forceGarbageCollection(): Promise<void>;
    /**
     * Clear Node.js module cache
     */
    clearModuleCache(): void;
    /**
     * Clear TypeScript compiler-specific memory
     */
    clearTypeScriptCompilerMemory(): Promise<void>;
    /**
     * Monitor memory usage and verify cleanup effectiveness
     */
    verifyMemoryCleanup(beforeMemory: MemoryUsage, afterMemory: MemoryUsage): boolean;
    /**
     * Get cleanup history
     */
    getCleanupHistory(): MemoryCleanupResult[];
    /**
     * Get cleanup statistics
     */
    getCleanupStatistics(): {
        totalCleanups: number;
        successfulCleanups: number;
        averageMemoryFreed: number;
        averageDuration: number;
        totalMemoryFreed: number;
    };
    /**
     * Reset cleanup history
     */
    resetHistory(): void;
    /**
     * Execute a single cleanup step
     */
    private executeCleanupStep;
    /**
     * Get current memory usage
     */
    private getCurrentMemoryUsage;
    /**
     * Create memory pressure to encourage garbage collection
     */
    private createMemoryPressure;
    /**
     * Check if a module key is TypeScript-related
     */
    private isTypeScriptRelated;
    /**
     * Check if a module is safe to delete from cache
     */
    private isSafeToDelete;
    /**
     * Clear TypeScript program cache
     */
    private clearTypeScriptProgramCache;
    /**
     * Clear TypeScript service cache
     */
    private clearTypeScriptServiceCache;
    /**
     * Clear TypeScript diagnostic cache
     */
    private clearTypeScriptDiagnosticCache;
    /**
     * Utility delay function
     */
    private delay;
}
//# sourceMappingURL=MemoryCleanupUtility.d.ts.map