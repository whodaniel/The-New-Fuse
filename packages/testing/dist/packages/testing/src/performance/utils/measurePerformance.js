"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.measurePerformance = measurePerformance;
const perf_hooks_1 = require("perf_hooks");
/**
 * Measures execution time and memory usage of a function
 */
async function measurePerformance(fn, options = {}) {
    const { iterations = 1, warmupIterations = 0, thresholds = {}, label = 'Unnamed Operation' } = options;
    // Warmup runs
    for (let i = 0; i < warmupIterations; i++) {
        await fn();
    }
    const results = [];
    let lastValue; // Initialize lastValue to allow for undefined
    // Actual measurement runs
    for (let i = 0; i < iterations; i++) {
        const startMemory = process.memoryUsage().heapUsed;
        const startTime = perf_hooks_1.performance.now();
        // Execute function and store result
        lastValue = await fn();
        const endTime = perf_hooks_1.performance.now();
        const endMemory = process.memoryUsage().heapUsed;
        results.push({
            duration: endTime - startTime,
            memoryBefore: startMemory,
            memoryAfter: endMemory,
            memoryDiff: endMemory - startMemory
        });
        // Check thresholds
        if (thresholds.maxDuration && results[i].duration > thresholds.maxDuration) {
            throw new Error(`${label}: Performance threshold exceeded - Duration ${results[i].duration}ms exceeds limit of ${thresholds.maxDuration}ms`);
        }
        if (thresholds.maxMemoryUsage && results[i].memoryDiff > thresholds.maxMemoryUsage) {
            throw new Error(`${label}: Performance threshold exceeded - Memory usage ${results[i].memoryDiff} bytes exceeds limit of ${thresholds.maxMemoryUsage} bytes`);
        }
    }
    // Calculate statistics
    const durations = results.map(r => r.duration);
    const stats = calculateStats(durations);
    // Ensure lastValue is assigned before returning, handle case where iterations = 0
    if (iterations === 0 && warmupIterations === 0) {
        // Optionally run fn() once if no iterations were performed, or handle error/default
        // For now, we assume if iterations is 0, returning undefined for value is acceptable
        // Or throw an error if iterations must be > 0
    }
    return { results, stats, value: lastValue }; // Cast back to T, assuming it was assigned if iterations > 0
}
function calculateStats(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    // Calculate standard deviation
    const squareDiffs = values.map(value => {
        const diff = value - mean;
        return diff * diff;
    });
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    const standardDeviation = Math.sqrt(avgSquareDiff);
    return {
        mean,
        median: sorted[Math.floor(sorted.length / 2)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
        min: sorted[0],
        max: sorted[sorted.length - 1],
        standardDeviation
    };
}
//# sourceMappingURL=measurePerformance.js.map