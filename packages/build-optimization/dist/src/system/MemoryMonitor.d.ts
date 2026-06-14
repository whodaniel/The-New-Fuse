/**
 * Real-time memory monitoring for build optimization
 */
import { IMemoryMonitor } from '../interfaces/index.js';
import { MemoryCallback, MemoryUsage } from '../types/index.js';
/**
 * Monitors system memory usage with configurable polling and threshold detection
 */
export declare class MemoryMonitor implements IMemoryMonitor {
    private static instance;
    private resourceDetector;
    private monitoringInterval;
    private pollingIntervalMs;
    private memoryThreshold;
    private thresholdCallbacks;
    private memoryHistory;
    private maxHistorySize;
    private peakMemoryUsage;
    private isMonitoring;
    private lastThresholdExceededTime;
    private thresholdCooldownMs;
    /**
     * Get singleton instance
     */
    static getInstance(): MemoryMonitor;
    private constructor();
    /**
     * Start monitoring memory usage
     */
    startMonitoring(interval?: number): void;
    /**
     * Stop monitoring memory usage
     */
    stopMonitoring(): void;
    /**
     * Get current memory usage
     */
    getCurrentUsage(): MemoryUsage;
    /**
     * Set memory threshold percentage
     */
    setThreshold(percentage: number): void;
    /**
     * Register callback for threshold exceeded events
     */
    onThresholdExceeded(callback: MemoryCallback): void;
    /**
     * Remove threshold exceeded callback
     */
    removeThresholdCallback(callback: MemoryCallback): void;
    /**
     * Clean up resources
     */
    cleanup(): void;
    /**
     * Get memory usage history
     */
    getMemoryHistory(): MemoryUsage[];
    /**
     * Get peak memory usage since monitoring started
     */
    getPeakMemoryUsage(): number;
    /**
     * Get average memory usage from history
     */
    getAverageMemoryUsage(): number;
    /**
     * Get memory usage statistics
     */
    getMemoryStatistics(): {
        current: number;
        peak: number;
        average: number;
        threshold: number;
        historyCount: number;
        isMonitoring: boolean;
    };
    /**
     * Check if memory usage is above threshold
     */
    isAboveThreshold(): boolean;
    /**
     * Get memory trend (increasing, decreasing, stable)
     */
    getMemoryTrend(): 'increasing' | 'decreasing' | 'stable' | 'unknown';
    /**
     * Force garbage collection if available
     */
    forceGarbageCollection(): boolean;
    /**
     * Get memory pressure level
     */
    getMemoryPressure(): 'low' | 'medium' | 'high' | 'critical';
    /**
     * Check memory usage and trigger callbacks if needed
     */
    private checkMemoryUsage;
    /**
     * Trigger threshold exceeded callbacks
     */
    private triggerThresholdCallbacks;
    /**
     * Set maximum history size
     */
    setMaxHistorySize(size: number): void;
    /**
     * Set threshold cooldown period
     */
    setThresholdCooldown(cooldownMs: number): void;
    /**
     * Reset monitoring state
     */
    reset(): void;
    /**
     * Get monitoring configuration
     */
    getConfiguration(): {
        pollingInterval: number;
        threshold: number;
        maxHistorySize: number;
        cooldownMs: number;
        callbackCount: number;
    };
}
//# sourceMappingURL=MemoryMonitor.d.ts.map