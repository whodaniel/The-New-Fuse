"use strict";
/**
 * Performance Optimization Utilities for Advanced MCP
 *
 * This module provides comprehensive performance optimization tools including:
 * - Performance monitoring and profiling
 * - Memory management and leak detection
 * - Object pooling for resource efficiency
 * - Multi-level caching strategies
 * - Load testing and stress testing utilities
 * - Async operation optimization
 * - Resource management with automatic cleanup
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalResourceManager = exports.globalMemoryProfiler = exports.AsyncOptimizer = exports.ResourceManager = exports.LoadTester = exports.LRUCache = exports.ObjectPool = exports.MemoryProfiler = exports.globalPerformanceMonitor = exports.PerformanceMonitor = void 0;
const events_1 = require("events");
const perf_hooks_1 = require("perf_hooks");
class PerformanceMonitor extends events_1.EventEmitter {
    metrics = new Map();
    timers = new Map();
    counters = new Map();
    maxSamples = 10000;
    startTimer(label) {
        this.timers.set(label, perf_hooks_1.performance.now());
    }
    endTimer(label) {
        const start = this.timers.get(label);
        if (!start)
            return 0;
        const duration = perf_hooks_1.performance.now() - start;
        this.timers.delete(label);
        this.recordMetric(label, duration);
        return duration;
    }
    recordMetric(label, value) {
        if (!this.metrics.has(label)) {
            this.metrics.set(label, []);
        }
        const values = this.metrics.get(label);
        values.push(value);
        // Keep only recent samples
        if (values.length > this.maxSamples) {
            values.shift();
        }
        this.emit('metric', { label, value, timestamp: Date.now() });
    }
    incrementCounter(label, value = 1) {
        const current = this.counters.get(label) || 0;
        this.counters.set(label, current + value);
        this.emit('counter', { label, value: current + value, timestamp: Date.now() });
    }
    getStats(label) {
        const values = this.metrics.get(label);
        if (!values || values.length === 0)
            return null;
        const sorted = [...values].sort((a, b) => a - b);
        const count = sorted.length;
        const sum = sorted.reduce((acc, val) => acc + val, 0);
        return {
            avg: sum / count,
            min: sorted[0],
            max: sorted[count - 1],
            p50: sorted[Math.floor(count * 0.5)],
            p95: sorted[Math.floor(count * 0.95)],
            p99: sorted[Math.floor(count * 0.99)],
            count
        };
    }
    getCounter(label) {
        return this.counters.get(label) || 0;
    }
    getAllStats() {
        const stats = {};
        for (const label of this.metrics.keys()) {
            const stat = this.getStats(label);
            if (stat) {
                stats[label] = stat;
            }
        }
        return stats;
    }
    reset(label) {
        if (label) {
            this.metrics.delete(label);
            this.counters.delete(label);
        }
        else {
            this.metrics.clear();
            this.counters.clear();
            this.timers.clear();
        }
    }
    // Decorator for automatic timing
    static timed(label) {
        return function (target, propertyName, descriptor) {
            const method = descriptor.value;
            const timerLabel = label || `${target.constructor.name}.${propertyName}`;
            descriptor.value = async function (...args) {
                const monitor = this.performanceMonitor || exports.globalPerformanceMonitor;
                monitor.startTimer(timerLabel);
                try {
                    const result = await method.apply(this, args);
                    return result;
                }
                finally {
                    monitor.endTimer(timerLabel);
                }
            };
            return descriptor;
        };
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
// Global performance monitor instance
exports.globalPerformanceMonitor = new PerformanceMonitor();
class MemoryProfiler extends events_1.EventEmitter {
    snapshots = [];
    maxSnapshots = 1000;
    gcThreshold = 1024 * 1024 * 1024; // 1GB
    lastGC = Date.now();
    leakDetectionEnabled = true;
    snapshotInterval;
    leakCheckInterval;
    constructor() {
        super();
        this.startMonitoring();
    }
    startMonitoring() {
        // Ensure previous intervals are cleared to avoid duplicates
        this.stopMonitoring();
        // Take snapshots every 30 seconds
        this.snapshotInterval = setInterval(() => {
            this.takeSnapshot();
        }, 30000);
        // Check for memory leaks every 5 minutes
        this.leakCheckInterval = setInterval(() => {
            if (this.leakDetectionEnabled) {
                this.checkForLeaks();
            }
        }, 300000);
    }
    takeSnapshot() {
        const usage = process.memoryUsage();
        const snapshot = {
            timestamp: Date.now(),
            usage
        };
        // Add V8 heap statistics if available
        if (typeof global.gc === 'function') {
            try {
                const v8 = require('v8');
                snapshot.heapStats = v8.getHeapStatistics();
            }
            catch (error) {
                // V8 module not available
            }
        }
        this.snapshots.push(snapshot);
        // Keep only recent snapshots
        if (this.snapshots.length > this.maxSnapshots) {
            this.snapshots.shift();
        }
        this.emit('snapshot', snapshot);
        return snapshot;
    }
    getMemoryTrend(windowSize = 10) {
        if (this.snapshots.length < 2) {
            return { trend: 'stable', rate: 0, confidence: 0 };
        }
        const recentSnapshots = this.snapshots.slice(-Math.min(windowSize, this.snapshots.length));
        if (recentSnapshots.length < 2) {
            return { trend: 'stable', rate: 0, confidence: 0 };
        }
        const first = recentSnapshots[0];
        const last = recentSnapshots[recentSnapshots.length - 1];
        const timeDiff = (last.timestamp - first.timestamp) / 1000; // seconds
        const memoryDiff = last.usage.heapUsed - first.usage.heapUsed;
        const rate = memoryDiff / timeDiff; // bytes per second
        // Calculate confidence based on consistency of trend
        let consistentTrend = 0;
        for (let i = 1; i < recentSnapshots.length; i++) {
            const prevDiff = recentSnapshots[i].usage.heapUsed - recentSnapshots[i - 1].usage.heapUsed;
            if ((rate > 0 && prevDiff > 0) || (rate < 0 && prevDiff < 0) || (rate === 0 && Math.abs(prevDiff) < 1000)) {
                consistentTrend++;
            }
        }
        const confidence = consistentTrend / (recentSnapshots.length - 1);
        let trend;
        if (Math.abs(rate) < 1000) { // Less than 1KB/s
            trend = 'stable';
        }
        else {
            trend = rate > 0 ? 'increasing' : 'decreasing';
        }
        return { trend, rate, confidence };
    }
    detectMemoryLeaks() {
        const trend = this.getMemoryTrend(20);
        // Consider it a leak if:
        // 1. Memory is consistently increasing
        // 2. Rate is > 100KB/s
        // 3. Confidence is > 0.7
        const isLeak = trend.trend === 'increasing' &&
            trend.rate > 100 * 1024 &&
            trend.confidence > 0.7;
        if (isLeak) {
            this.emit('memoryLeak', { trend, snapshots: this.snapshots.slice(-10) });
        }
        return isLeak;
    }
    checkForLeaks() {
        const isLeak = this.detectMemoryLeaks();
        if (isLeak) {
            console.warn('Potential memory leak detected!');
            this.triggerGC();
        }
    }
    stopMonitoring() {
        if (this.snapshotInterval) {
            clearInterval(this.snapshotInterval);
            this.snapshotInterval = undefined;
        }
        if (this.leakCheckInterval) {
            clearInterval(this.leakCheckInterval);
            this.leakCheckInterval = undefined;
        }
    }
    shouldTriggerGC() {
        const currentUsage = process.memoryUsage();
        const timeSinceLastGC = Date.now() - this.lastGC;
        return currentUsage.heapUsed > this.gcThreshold && timeSinceLastGC > 30000;
    }
    triggerGC() {
        if (typeof global.gc === 'function') {
            global.gc();
            this.lastGC = Date.now();
            this.emit('gc', { timestamp: this.lastGC });
            return true;
        }
        return false;
    }
    destroy() {
        this.stopMonitoring();
        this.removeAllListeners();
    }
    getLatestSnapshot() {
        return this.snapshots.length > 0 ? this.snapshots[this.snapshots.length - 1] : null;
    }
    getMemoryUsageSummary() {
        return {
            current: process.memoryUsage(),
            trend: this.getMemoryTrend(),
            leakDetected: this.detectMemoryLeaks()
        };
    }
}
exports.MemoryProfiler = MemoryProfiler;
class ObjectPool {
    pool = [];
    createFn;
    resetFn;
    destroyFn;
    maxSize;
    created = 0;
    acquired = 0;
    released = 0;
    constructor(createFn, options = {}) {
        this.createFn = createFn;
        this.maxSize = options.maxSize || 100;
        this.resetFn = options.resetFn;
        this.destroyFn = options.destroyFn;
    }
    acquire() {
        this.acquired++;
        if (this.pool.length > 0) {
            return this.pool.pop();
        }
        this.created++;
        return this.createFn();
    }
    release(obj) {
        this.released++;
        if (this.pool.length >= this.maxSize) {
            // Pool is full, destroy the object
            if (this.destroyFn) {
                this.destroyFn(obj);
            }
            else if (obj.destroy) {
                obj.destroy();
            }
            return;
        }
        // Reset the object before returning to pool
        if (this.resetFn) {
            this.resetFn(obj);
        }
        else if (obj.reset) {
            obj.reset();
        }
        this.pool.push(obj);
    }
    getStats() {
        return {
            poolSize: this.pool.length,
            maxSize: this.maxSize,
            created: this.created,
            acquired: this.acquired,
            released: this.released,
            utilization: this.acquired > 0 ? (this.acquired - this.pool.length) / this.acquired : 0
        };
    }
    clear() {
        // Destroy all pooled objects
        for (const obj of this.pool) {
            if (this.destroyFn) {
                this.destroyFn(obj);
            }
            else if (obj.destroy) {
                obj.destroy();
            }
        }
        this.pool.length = 0;
    }
}
exports.ObjectPool = ObjectPool;
class LRUCache extends events_1.EventEmitter {
    cache = new Map();
    maxSize;
    defaultTTL;
    stats = {
        hits: 0,
        misses: 0,
        evictions: 0
    };
    constructor(maxSize = 1000, defaultTTL = 300000) {
        super();
        this.maxSize = maxSize;
        this.defaultTTL = defaultTTL;
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            this.stats.misses++;
            this.emit('miss', key);
            return null;
        }
        if (entry.expiry < Date.now()) {
            this.cache.delete(key);
            this.stats.misses++;
            this.emit('expired', key);
            return null;
        }
        // Update access statistics
        entry.hits++;
        entry.lastAccess = Date.now();
        this.stats.hits++;
        // Move to end (most recently used)
        this.cache.delete(key);
        this.cache.set(key, entry);
        this.emit('hit', key);
        return entry.value;
    }
    set(key, value, ttl) {
        const expiry = Date.now() + (ttl || this.defaultTTL);
        const entry = {
            value,
            expiry,
            hits: 0,
            lastAccess: Date.now()
        };
        // Remove existing entry if present
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }
        // Evict least recently used items if at capacity
        while (this.cache.size >= this.maxSize) {
            const iterator = this.cache.keys().next();
            if (iterator.done) {
                // No keys available to evict; exit to avoid an infinite loop
                break;
            }
            const firstKey = iterator.value;
            this.cache.delete(firstKey);
            this.stats.evictions++;
            this.emit('evicted', firstKey);
        }
        this.cache.set(key, entry);
        this.emit('set', key, value);
    }
    has(key) {
        const entry = this.cache.get(key);
        return entry !== undefined && entry.expiry >= Date.now();
    }
    delete(key) {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.emit('deleted', key);
        }
        return deleted;
    }
    clear() {
        const size = this.cache.size;
        this.cache.clear();
        this.emit('cleared', size);
    }
    getStats() {
        const totalRequests = this.stats.hits + this.stats.misses;
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hits: this.stats.hits,
            misses: this.stats.misses,
            hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
            evictions: this.stats.evictions
        };
    }
    // Clean up expired entries
    cleanup() {
        const now = Date.now();
        let cleaned = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (entry.expiry < now) {
                this.cache.delete(key);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            this.emit('cleanup', cleaned);
        }
        return cleaned;
    }
}
exports.LRUCache = LRUCache;
class LoadTester extends events_1.EventEmitter {
    options;
    constructor(options = {}) {
        super();
        this.options = {
            concurrency: 10,
            duration: 60000, // 1 minute
            rampUpTime: 10000, // 10 seconds
            requestDelay: 100, // 100ms
            timeout: 30000, // 30 seconds
            ...options
        };
    }
    async runLoadTest(testFn) {
        const results = [];
        const startTime = Date.now();
        const endTime = startTime + this.options.duration;
        this.emit('started', { options: this.options });
        // Create workers with gradual ramp-up
        const workers = [];
        const workerDelay = this.options.rampUpTime / this.options.concurrency;
        for (let i = 0; i < this.options.concurrency; i++) {
            workers.push(this.createWorker(testFn, results, endTime, i * workerDelay));
        }
        await Promise.all(workers);
        const actualDuration = Date.now() - startTime;
        const result = this.analyzeResults(results, actualDuration);
        this.emit('completed', result);
        return result;
    }
    async createWorker(testFn, results, endTime, delay) {
        // Wait for ramp-up delay
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        let requestCount = 0;
        while (Date.now() < endTime) {
            const start = perf_hooks_1.performance.now();
            try {
                // Add timeout to test function
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Request timeout')), this.options.timeout);
                });
                await Promise.race([testFn(), timeoutPromise]);
                results.push({
                    success: true,
                    duration: perf_hooks_1.performance.now() - start
                });
            }
            catch (error) {
                results.push({
                    success: false,
                    duration: perf_hooks_1.performance.now() - start,
                    error: error.message
                });
            }
            requestCount++;
            this.emit('request', { success: results[results.length - 1].success, requestCount });
            // Delay between requests
            if (this.options.requestDelay > 0) {
                await new Promise(resolve => setTimeout(resolve, this.options.requestDelay));
            }
        }
    }
    analyzeResults(results, totalTime) {
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        const durations = successful.map(r => r.duration);
        durations.sort((a, b) => a - b);
        // Count error types
        const errorCounts = new Map();
        failed.forEach(f => {
            const errorMessage = f.error || 'Unknown error';
            errorCounts.set(errorMessage, (errorCounts.get(errorMessage) || 0) + 1);
        });
        const errors = Array.from(errorCounts.entries()).map(([message, count]) => ({
            message,
            count
        }));
        return {
            totalRequests: results.length,
            successfulRequests: successful.length,
            failedRequests: failed.length,
            successRate: results.length > 0 ? successful.length / results.length : 0,
            requestsPerSecond: results.length / (totalTime / 1000),
            averageResponseTime: durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0,
            medianResponseTime: durations.length > 0 ? durations[Math.floor(durations.length / 2)] : 0,
            p95ResponseTime: durations.length > 0 ? durations[Math.floor(durations.length * 0.95)] : 0,
            p99ResponseTime: durations.length > 0 ? durations[Math.floor(durations.length * 0.99)] : 0,
            minResponseTime: durations.length > 0 ? durations[0] : 0,
            maxResponseTime: durations.length > 0 ? durations[durations.length - 1] : 0,
            errors,
            duration: totalTime
        };
    }
}
exports.LoadTester = LoadTester;
class ResourceManager extends events_1.EventEmitter {
    resources = [];
    cleanupInProgress = false;
    addResource(id, resource) {
        this.resources.push({
            id,
            resource,
            created: Date.now()
        });
        this.emit('resourceAdded', id);
    }
    async removeResource(id) {
        const index = this.resources.findIndex(r => r.id === id);
        if (index === -1)
            return false;
        const { resource } = this.resources[index];
        this.resources.splice(index, 1);
        try {
            await resource.cleanup();
            this.emit('resourceRemoved', id);
            return true;
        }
        catch (error) {
            this.emit('resourceCleanupError', { id, error });
            return false;
        }
    }
    async cleanup() {
        if (this.cleanupInProgress)
            return;
        this.cleanupInProgress = true;
        this.emit('cleanupStarted', this.resources.length);
        const cleanupPromises = this.resources.map(async ({ id, resource }) => {
            try {
                await resource.cleanup();
                this.emit('resourceCleaned', id);
            }
            catch (error) {
                this.emit('resourceCleanupError', { id, error });
            }
        });
        await Promise.all(cleanupPromises);
        this.resources.length = 0;
        this.cleanupInProgress = false;
        this.emit('cleanupCompleted');
    }
    async withResource(id, createResource, operation) {
        const { resource, cleanup } = await createResource();
        const managedResource = { cleanup };
        this.addResource(id, managedResource);
        try {
            return await operation(resource);
        }
        finally {
            await this.removeResource(id);
        }
    }
    getResourceCount() {
        return this.resources.length;
    }
    getResourceAge(id) {
        const resource = this.resources.find(r => r.id === id);
        return resource ? Date.now() - resource.created : null;
    }
    // Cleanup resources older than specified age
    async cleanupOldResources(maxAge) {
        const now = Date.now();
        const oldResources = this.resources.filter(r => now - r.created > maxAge);
        let cleaned = 0;
        for (const { id } of oldResources) {
            if (await this.removeResource(id)) {
                cleaned++;
            }
        }
        return cleaned;
    }
}
exports.ResourceManager = ResourceManager;
// ============================================================================
// Async Optimization Utilities
// ============================================================================
class AsyncOptimizer {
    // Execute promises with concurrency limit
    static async withConcurrencyLimit(promises, limit) {
        const results = [];
        const executing = [];
        for (const promiseFactory of promises) {
            const promise = promiseFactory().then(result => {
                results.push(result);
            });
            executing.push(promise);
            if (executing.length >= limit) {
                await Promise.race(executing);
                executing.splice(executing.findIndex(p => p === promise), 1);
            }
        }
        await Promise.all(executing);
        return results;
    }
    // Retry with exponential backoff
    static async withRetry(operation, options = {}) {
        const { maxRetries = 3, baseDelay = 1000, maxDelay = 30000, backoffFactor = 2 } = options;
        let lastError;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                if (attempt === maxRetries) {
                    throw lastError;
                }
                const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw lastError;
    }
    // Circuit breaker pattern
    static createCircuitBreaker(operation, options = {}) {
        const { failureThreshold = 5, resetTimeout = 60000, monitoringPeriod = 10000 } = options;
        let state = 'closed';
        let failures = 0;
        let lastFailureTime = 0;
        let successes = 0;
        return async () => {
            const now = Date.now();
            // Reset failure count after monitoring period
            if (now - lastFailureTime > monitoringPeriod) {
                failures = 0;
            }
            // Check if circuit should be half-open
            if (state === 'open' && now - lastFailureTime > resetTimeout) {
                state = 'half-open';
                successes = 0;
            }
            // Reject if circuit is open
            if (state === 'open') {
                throw new Error('Circuit breaker is open');
            }
            try {
                const result = await operation();
                // Reset on success
                if (state === 'half-open') {
                    successes++;
                    if (successes >= 3) { // Require 3 successes to close
                        state = 'closed';
                        failures = 0;
                    }
                }
                else {
                    failures = 0;
                }
                return result;
            }
            catch (error) {
                failures++;
                lastFailureTime = now;
                // Open circuit if threshold exceeded
                if (failures >= failureThreshold) {
                    state = 'open';
                }
                throw error;
            }
        };
    }
}
exports.AsyncOptimizer = AsyncOptimizer;
// ============================================================================
// Exports
// ============================================================================
exports.globalMemoryProfiler = new MemoryProfiler();
exports.globalResourceManager = new ResourceManager();
// Export benchmark and profiler utilities
__exportStar(require("./benchmarks"), exports);
__exportStar(require("./profiler"), exports);
__exportStar(require("./optimization-guide"), exports);
__exportStar(require("./monitoring"), exports);
// Cleanup on process exit
process.once('exit', () => {
    exports.globalMemoryProfiler.destroy();
    exports.globalResourceManager.cleanup();
});
process.once('SIGINT', async () => {
    await exports.globalResourceManager.cleanup();
    exports.globalMemoryProfiler.destroy();
    process.exit(0);
});
process.once('SIGTERM', async () => {
    await exports.globalResourceManager.cleanup();
    exports.globalMemoryProfiler.destroy();
    process.exit(0);
});
//# sourceMappingURL=index.js.map