"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectMemoryLeak = detectMemoryLeak;
const perf_hooks_1 = require("perf_hooks");
/**
 * Monitors memory usage over time to detect potential memory leaks
 */
async function detectMemoryLeak(operation, options = {}) {
    const { duration = 10000, // 10 seconds default
    measureInterval = 100, // 100ms default
    iterations = 1, allowedGrowthRate = 1024, // 1KB per second
    minConfidence = 0.8 } = options;
    const snapshots = [];
    const startTime = perf_hooks_1.performance.now();
    // Run the operation multiple times
    for (let i = 0; i < iterations; i++) {
        await operation();
    }
    // Continue monitoring memory after operation completion
    while (perf_hooks_1.performance.now() - startTime < duration) {
        const memUsage = process.memoryUsage();
        snapshots.push({
            timestamp: perf_hooks_1.performance.now() - startTime,
            heapUsed: memUsage.heapUsed,
            heapTotal: memUsage.heapTotal,
            external: memUsage.external,
            arrayBuffers: memUsage.arrayBuffers
        });
        await new Promise(resolve => setTimeout(resolve, measureInterval));
    }
    // Analyze memory growth pattern
    const analysis = analyzeMemoryGrowth(snapshots);
    const totalDuration = perf_hooks_1.performance.now() - startTime;
    const memoryGrowth = snapshots[snapshots.length - 1].heapUsed - snapshots[0].heapUsed;
    const growthRate = memoryGrowth / (totalDuration / 1000); // bytes per second
    return {
        isLeaking: growthRate > allowedGrowthRate && analysis.confidence >= minConfidence,
        leakRate: growthRate,
        totalMemoryGrowth: memoryGrowth,
        duration: totalDuration,
        snapshots,
        analysisDetails: analysis
    };
}
function analyzeMemoryGrowth(snapshots) {
    const n = snapshots.length;
    const timestamps = snapshots.map(s => s.timestamp);
    const heapSizes = snapshots.map(s => s.heapUsed);
    // Calculate means
    const meanTime = timestamps.reduce((a, b) => a + b, 0) / n;
    const meanHeap = heapSizes.reduce((a, b) => a + b, 0) / n;
    // Calculate linear regression coefficients
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < n; i++) {
        const timeDeviation = timestamps[i] - meanTime;
        const heapDeviation = heapSizes[i] - meanHeap;
        numerator += timeDeviation * heapDeviation;
        denominator += timeDeviation * timeDeviation;
    }
    const slope = numerator / denominator;
    // Calculate R-squared
    const predicted = timestamps.map(t => meanHeap + slope * (t - meanTime));
    const residualSS = heapSizes.reduce((sum, heap, i) => {
        return sum + Math.pow(heap - predicted[i], 2);
    }, 0);
    const totalSS = heapSizes.reduce((sum, heap) => {
        return sum + Math.pow(heap - meanHeap, 2);
    }, 0);
    const rSquared = 1 - (residualSS / totalSS);
    // Calculate confidence based on R-squared and sample size
    const confidence = Math.min(rSquared * Math.log10(n) / 2, 1);
    return {
        linearRegressionSlope: slope,
        rSquared,
        confidence
    };
}
//# sourceMappingURL=memoryLeakDetector.js.map