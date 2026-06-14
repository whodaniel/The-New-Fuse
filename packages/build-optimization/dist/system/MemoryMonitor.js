/**
 * Real-time memory monitoring for build optimization
 */
import { SystemResourceDetector } from './SystemResourceDetector.js';
/**
 * Monitors system memory usage with configurable polling and threshold detection
 */
export class MemoryMonitor {
    static instance;
    resourceDetector;
    monitoringInterval = null;
    pollingIntervalMs = 2000; // Default 2 seconds
    memoryThreshold = 80; // Default 80%
    thresholdCallbacks = [];
    memoryHistory = [];
    maxHistorySize = 100; // Keep last 100 readings
    peakMemoryUsage = 0;
    isMonitoring = false;
    lastThresholdExceededTime = 0;
    thresholdCooldownMs = 5000; // 5 second cooldown between threshold alerts
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!MemoryMonitor.instance) {
            MemoryMonitor.instance = new MemoryMonitor();
        }
        return MemoryMonitor.instance;
    }
    constructor() {
        this.resourceDetector = SystemResourceDetector.getInstance();
    }
    /**
     * Start monitoring memory usage
     */
    startMonitoring(interval = 2000) {
        if (this.isMonitoring) {
            return; // Already monitoring
        }
        this.pollingIntervalMs = interval;
        this.isMonitoring = true;
        this.peakMemoryUsage = 0;
        this.memoryHistory = [];
        this.monitoringInterval = setInterval(() => {
            this.checkMemoryUsage();
        }, this.pollingIntervalMs);
        // Take initial reading
        this.checkMemoryUsage();
    }
    /**
     * Stop monitoring memory usage
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.isMonitoring = false;
    }
    /**
     * Get current memory usage
     */
    getCurrentUsage() {
        return this.resourceDetector.getCurrentMemoryUsage();
    }
    /**
     * Set memory threshold percentage
     */
    setThreshold(percentage) {
        if (percentage < 0 || percentage > 100) {
            throw new Error('Memory threshold must be between 0 and 100');
        }
        this.memoryThreshold = percentage;
    }
    /**
     * Register callback for threshold exceeded events
     */
    onThresholdExceeded(callback) {
        this.thresholdCallbacks.push(callback);
    }
    /**
     * Remove threshold exceeded callback
     */
    removeThresholdCallback(callback) {
        const index = this.thresholdCallbacks.indexOf(callback);
        if (index > -1) {
            this.thresholdCallbacks.splice(index, 1);
        }
    }
    /**
     * Clean up resources
     */
    cleanup() {
        this.stopMonitoring();
        this.thresholdCallbacks = [];
        this.memoryHistory = [];
        this.peakMemoryUsage = 0;
    }
    /**
     * Get memory usage history
     */
    getMemoryHistory() {
        return [...this.memoryHistory];
    }
    /**
     * Get peak memory usage since monitoring started
     */
    getPeakMemoryUsage() {
        return this.peakMemoryUsage;
    }
    /**
     * Get average memory usage from history
     */
    getAverageMemoryUsage() {
        if (this.memoryHistory.length === 0) {
            return 0;
        }
        const sum = this.memoryHistory.reduce((acc, usage) => acc + usage.current, 0);
        return Math.round(sum / this.memoryHistory.length);
    }
    /**
     * Get memory usage statistics
     */
    getMemoryStatistics() {
        const current = this.getCurrentUsage();
        return {
            current: current.current,
            peak: this.peakMemoryUsage,
            average: this.getAverageMemoryUsage(),
            threshold: this.memoryThreshold,
            historyCount: this.memoryHistory.length,
            isMonitoring: this.isMonitoring,
        };
    }
    /**
     * Check if memory usage is above threshold
     */
    isAboveThreshold() {
        const current = this.getCurrentUsage();
        return current.percentage >= this.memoryThreshold;
    }
    /**
     * Get memory trend (increasing, decreasing, stable)
     */
    getMemoryTrend() {
        if (this.memoryHistory.length < 3) {
            return 'unknown';
        }
        const recent = this.memoryHistory.slice(-3);
        const first = recent[0].current;
        const last = recent[recent.length - 1].current;
        const diff = last - first;
        const threshold = first * 0.05; // 5% change threshold
        if (Math.abs(diff) < threshold) {
            return 'stable';
        }
        return diff > 0 ? 'increasing' : 'decreasing';
    }
    /**
     * Force garbage collection if available
     */
    forceGarbageCollection() {
        if (global.gc) {
            try {
                global.gc();
                return true;
            }
            catch (error) {
                console.warn('Failed to force garbage collection:', error);
                return false;
            }
        }
        return false;
    }
    /**
     * Get memory pressure level
     */
    getMemoryPressure() {
        const current = this.getCurrentUsage();
        const percentage = current.percentage;
        if (percentage >= 95)
            return 'critical';
        if (percentage >= 85)
            return 'high';
        if (percentage >= 70)
            return 'medium';
        return 'low';
    }
    /**
     * Check memory usage and trigger callbacks if needed
     */
    checkMemoryUsage() {
        const usage = this.getCurrentUsage();
        // Update peak memory usage
        if (usage.current > this.peakMemoryUsage) {
            this.peakMemoryUsage = usage.current;
        }
        // Add to history
        this.memoryHistory.push(usage);
        // Trim history if too large
        if (this.memoryHistory.length > this.maxHistorySize) {
            this.memoryHistory.shift();
        }
        // Check threshold with cooldown
        if (usage.percentage >= this.memoryThreshold) {
            const now = Date.now();
            if (now - this.lastThresholdExceededTime > this.thresholdCooldownMs) {
                this.lastThresholdExceededTime = now;
                this.triggerThresholdCallbacks(usage);
            }
        }
    }
    /**
     * Trigger threshold exceeded callbacks
     */
    triggerThresholdCallbacks(usage) {
        this.thresholdCallbacks.forEach((callback) => {
            try {
                callback(usage);
            }
            catch (error) {
                console.error('Error in memory threshold callback:', error);
            }
        });
    }
    /**
     * Set maximum history size
     */
    setMaxHistorySize(size) {
        if (size < 1) {
            throw new Error('Max history size must be at least 1');
        }
        this.maxHistorySize = size;
        // Trim current history if needed
        if (this.memoryHistory.length > size) {
            this.memoryHistory = this.memoryHistory.slice(-size);
        }
    }
    /**
     * Set threshold cooldown period
     */
    setThresholdCooldown(cooldownMs) {
        if (cooldownMs < 0) {
            throw new Error('Cooldown must be non-negative');
        }
        this.thresholdCooldownMs = cooldownMs;
    }
    /**
     * Reset monitoring state
     */
    reset() {
        this.stopMonitoring();
        this.memoryHistory = [];
        this.peakMemoryUsage = 0;
        this.lastThresholdExceededTime = 0;
    }
    /**
     * Get monitoring configuration
     */
    getConfiguration() {
        return {
            pollingInterval: this.pollingIntervalMs,
            threshold: this.memoryThreshold,
            maxHistorySize: this.maxHistorySize,
            cooldownMs: this.thresholdCooldownMs,
            callbackCount: this.thresholdCallbacks.length,
        };
    }
}
//# sourceMappingURL=MemoryMonitor.js.map