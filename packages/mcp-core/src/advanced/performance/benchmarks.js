"use strict";
/**
 * Benchmark Utilities for Advanced MCP Performance Testing
 *
 * This module provides comprehensive benchmarking tools for measuring
 * and comparing the performance of different implementations and optimizations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegressionTester = exports.MCPBenchmarks = exports.BenchmarkRunner = void 0;
const perf_hooks_1 = require("perf_hooks");
const events_1 = require("events");
const index_1 = require("./index");
// ============================================================================
// Benchmark Runner
// ============================================================================
class BenchmarkRunner extends events_1.EventEmitter {
    monitor;
    results = new Map();
    constructor() {
        super();
        this.monitor = new index_1.PerformanceMonitor();
    }
    async runBenchmark(testFn, options) {
        const { name, iterations = 1000, warmupIterations = 100, timeout = 300000, // 5 minutes
        setup, teardown } = options;
        this.emit('benchmarkStarted', { name, iterations });
        try {
            // Setup
            if (setup) {
                await setup();
            }
            // Warmup
            if (warmupIterations > 0) {
                this.emit('warmupStarted', { name, iterations: warmupIterations });
                for (let i = 0; i < warmupIterations; i++) {
                    await testFn();
                }
                this.emit('warmupCompleted', { name });
            }
            // Force garbage collection before measurement
            if (typeof global.gc === 'function') {
                global.gc();
            }
            const memoryBefore = process.memoryUsage();
            const times = [];
            const startTime = perf_hooks_1.performance.now();
            // Run benchmark iterations
            for (let i = 0; i < iterations; i++) {
                const iterationStart = perf_hooks_1.performance.now();
                // Add timeout protection
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Benchmark iteration timeout')), timeout);
                });
                try {
                    await Promise.race([testFn(), timeoutPromise]);
                }
                catch (error) {
                    this.emit('benchmarkError', { name, iteration: i, error });
                    throw error;
                }
                const iterationTime = perf_hooks_1.performance.now() - iterationStart;
                times.push(iterationTime);
                // Emit progress every 10% of iterations
                if (i > 0 && i % Math.floor(iterations / 10) === 0) {
                    this.emit('benchmarkProgress', {
                        name,
                        completed: i,
                        total: iterations,
                        progress: (i / iterations) * 100
                    });
                }
            }
            const totalTime = perf_hooks_1.performance.now() - startTime;
            const memoryAfter = process.memoryUsage();
            // Calculate statistics
            const result = this.calculateStatistics(name, times, totalTime, memoryBefore, memoryAfter);
            // Teardown
            if (teardown) {
                await teardown();
            }
            this.results.set(name, result);
            this.emit('benchmarkCompleted', { name, result });
            return result;
        }
        catch (error) {
            this.emit('benchmarkFailed', { name, error });
            throw error;
        }
    }
    calculateStatistics(name, times, totalTime, memoryBefore, memoryAfter) {
        const sortedTimes = [...times].sort((a, b) => a - b);
        const iterations = times.length;
        const sum = times.reduce((acc, time) => acc + time, 0);
        const averageTime = sum / iterations;
        // Calculate standard deviation
        const variance = times.reduce((acc, time) => acc + Math.pow(time - averageTime, 2), 0) / iterations;
        const standardDeviation = Math.sqrt(variance);
        // Calculate percentiles
        const medianTime = sortedTimes[Math.floor(iterations / 2)];
        const p95Time = sortedTimes[Math.floor(iterations * 0.95)];
        const p99Time = sortedTimes[Math.floor(iterations * 0.99)];
        // Calculate memory delta
        const memoryDelta = {
            rss: memoryAfter.rss - memoryBefore.rss,
            heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
            heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
            external: memoryAfter.external - memoryBefore.external,
            arrayBuffers: memoryAfter.arrayBuffers - memoryBefore.arrayBuffers
        };
        return {
            name,
            iterations,
            totalTime,
            averageTime,
            minTime: sortedTimes[0],
            maxTime: sortedTimes[iterations - 1],
            medianTime,
            p95Time,
            p99Time,
            operationsPerSecond: 1000 / averageTime, // Convert ms to ops/sec
            standardDeviation,
            memoryUsage: {
                before: memoryBefore,
                after: memoryAfter,
                delta: memoryDelta
            }
        };
    }
    async compareBenchmarks(baselineName, comparisonName) {
        const baseline = this.results.get(baselineName);
        const comparison = this.results.get(comparisonName);
        if (!baseline || !comparison) {
            return null;
        }
        // Calculate improvements (positive = better performance)
        const averageTimeImprovement = ((baseline.averageTime - comparison.averageTime) / baseline.averageTime) * 100;
        const opsPerSecImprovement = ((comparison.operationsPerSecond - baseline.operationsPerSecond) / baseline.operationsPerSecond) * 100;
        const memoryImprovement = ((baseline.memoryUsage.delta.heapUsed - comparison.memoryUsage.delta.heapUsed) / Math.abs(baseline.memoryUsage.delta.heapUsed)) * 100;
        // Determine statistical significance (simplified)
        let significance;
        const timeImprovementAbs = Math.abs(averageTimeImprovement);
        if (timeImprovementAbs > 20) {
            significance = 'significant';
        }
        else if (timeImprovementAbs > 5) {
            significance = 'marginal';
        }
        else {
            significance = 'insignificant';
        }
        return {
            baseline,
            comparison,
            improvement: {
                averageTime: averageTimeImprovement,
                operationsPerSecond: opsPerSecImprovement,
                memoryUsage: memoryImprovement
            },
            significance
        };
    }
    getResult(name) {
        return this.results.get(name);
    }
    getAllResults() {
        return new Map(this.results);
    }
    generateReport() {
        const results = Array.from(this.results.values());
        if (results.length === 0) {
            return 'No benchmark results available.';
        }
        let report = '# Benchmark Results\n\n';
        // Summary table
        report += '## Summary\n\n';
        report += '| Benchmark | Avg Time (ms) | Ops/sec | Memory (MB) | Iterations |\n';
        report += '|-----------|---------------|---------|-------------|------------|\n';
        for (const result of results) {
            const memoryMB = (result.memoryUsage.delta.heapUsed / 1024 / 1024).toFixed(2);
            report += `| ${result.name} | ${result.averageTime.toFixed(2)} | ${result.operationsPerSecond.toFixed(0)} | ${memoryMB} | ${result.iterations} |\n`;
        }
        // Detailed results
        report += '\n## Detailed Results\n\n';
        for (const result of results) {
            report += `### ${result.name}\n\n`;
            report += `- **Iterations**: ${result.iterations}\n`;
            report += `- **Total Time**: ${result.totalTime.toFixed(2)} ms\n`;
            report += `- **Average Time**: ${result.averageTime.toFixed(2)} ms\n`;
            report += `- **Median Time**: ${result.medianTime.toFixed(2)} ms\n`;
            report += `- **Min Time**: ${result.minTime.toFixed(2)} ms\n`;
            report += `- **Max Time**: ${result.maxTime.toFixed(2)} ms\n`;
            report += `- **95th Percentile**: ${result.p95Time.toFixed(2)} ms\n`;
            report += `- **99th Percentile**: ${result.p99Time.toFixed(2)} ms\n`;
            report += `- **Operations/sec**: ${result.operationsPerSecond.toFixed(0)}\n`;
            report += `- **Standard Deviation**: ${result.standardDeviation.toFixed(2)} ms\n`;
            report += `- **Memory Delta**: ${(result.memoryUsage.delta.heapUsed / 1024 / 1024).toFixed(2)} MB\n\n`;
        }
        return report;
    }
    clear() {
        this.results.clear();
        this.emit('cleared');
    }
}
exports.BenchmarkRunner = BenchmarkRunner;
// ============================================================================
// Predefined Benchmarks for MCP Components
// ============================================================================
class MCPBenchmarks {
    runner;
    constructor() {
        this.runner = new BenchmarkRunner();
    }
    // Benchmark task distribution performance
    async benchmarkTaskDistribution(orchestrator, taskCount = 1000) {
        const tasks = Array.from({ length: taskCount }, (_, i) => ({
            id: `task-${i}`,
            type: 'test',
            data: { index: i }
        }));
        return this.runner.runBenchmark(async () => {
            const task = tasks[Math.floor(Math.random() * tasks.length)];
            await orchestrator.distributeTask(task);
        }, {
            name: 'Task Distribution',
            iterations: 1000,
            warmupIterations: 100
        });
    }
    // Benchmark browser automation performance
    async benchmarkBrowserAutomation(browserAutomation, urls) {
        return this.runner.runBenchmark(async () => {
            const url = urls[Math.floor(Math.random() * urls.length)];
            const page = await browserAutomation.createPage();
            await page.goto(url);
            await page.close();
        }, {
            name: 'Browser Automation',
            iterations: 50,
            warmupIterations: 5,
            timeout: 30000
        });
    }
    // Benchmark security operations
    async benchmarkSecurity(securityFramework, dataSize = 1024) {
        const testData = 'x'.repeat(dataSize);
        return this.runner.runBenchmark(async () => {
            const encrypted = await securityFramework.encrypt(testData);
            await securityFramework.decrypt(encrypted.data);
        }, {
            name: 'Security Operations',
            iterations: 1000,
            warmupIterations: 100
        });
    }
    // Benchmark communication hub performance
    async benchmarkCommunication(communicationHub, messageCount = 1000) {
        const messages = Array.from({ length: messageCount }, (_, i) => ({
            id: `msg-${i}`,
            type: 'test',
            data: { index: i }
        }));
        return this.runner.runBenchmark(async () => {
            const message = messages[Math.floor(Math.random() * messages.length)];
            await communicationHub.sendMessage('test-agent', message);
        }, {
            name: 'Communication Hub',
            iterations: 1000,
            warmupIterations: 100
        });
    }
    // Benchmark monitoring and analytics
    async benchmarkMonitoring(monitoringEngine, metricCount = 1000) {
        return this.runner.runBenchmark(async () => {
            await monitoringEngine.recordMetric({
                name: 'test.metric',
                value: Math.random() * 100,
                labels: { component: 'benchmark' },
                timestamp: Date.now()
            });
        }, {
            name: 'Monitoring Engine',
            iterations: 1000,
            warmupIterations: 100
        });
    }
    // Benchmark plugin ecosystem
    async benchmarkPluginEcosystem(pluginEcosystem, pluginCount = 100) {
        return this.runner.runBenchmark(async () => {
            const pluginId = `plugin-${Math.floor(Math.random() * pluginCount)}`;
            await pluginEcosystem.loadPlugin(pluginId);
        }, {
            name: 'Plugin Ecosystem',
            iterations: 500,
            warmupIterations: 50
        });
    }
    // Run comprehensive benchmark suite
    async runComprehensiveBenchmarks(components) {
        const results = new Map();
        if (components.orchestrator) {
            const result = await this.benchmarkTaskDistribution(components.orchestrator);
            results.set('orchestrator', result);
        }
        if (components.browserAutomation) {
            const result = await this.benchmarkBrowserAutomation(components.browserAutomation, ['https://example.com', 'https://httpbin.org/get']);
            results.set('browserAutomation', result);
        }
        if (components.securityFramework) {
            const result = await this.benchmarkSecurity(components.securityFramework);
            results.set('securityFramework', result);
        }
        if (components.communicationHub) {
            const result = await this.benchmarkCommunication(components.communicationHub);
            results.set('communicationHub', result);
        }
        if (components.monitoringEngine) {
            const result = await this.benchmarkMonitoring(components.monitoringEngine);
            results.set('monitoringEngine', result);
        }
        if (components.pluginEcosystem) {
            const result = await this.benchmarkPluginEcosystem(components.pluginEcosystem);
            results.set('pluginEcosystem', result);
        }
        return results;
    }
    getRunner() {
        return this.runner;
    }
}
exports.MCPBenchmarks = MCPBenchmarks;
class RegressionTester {
    options;
    constructor(options) {
        this.options = options;
    }
    async runRegressionTest(currentResults) {
        const regressions = [];
        for (const [name, currentResult] of currentResults.entries()) {
            const baselineResult = this.options.baselineResults.get(name);
            if (!baselineResult)
                continue;
            // Check average time regression
            const timeRegression = ((currentResult.averageTime - baselineResult.averageTime) / baselineResult.averageTime) * 100;
            if (timeRegression > this.options.thresholds.averageTimeRegression) {
                regressions.push({
                    benchmark: name,
                    metric: 'Average Time',
                    baseline: baselineResult.averageTime,
                    current: currentResult.averageTime,
                    regression: timeRegression,
                    threshold: this.options.thresholds.averageTimeRegression
                });
            }
            // Check operations per second regression
            const opsRegression = ((baselineResult.operationsPerSecond - currentResult.operationsPerSecond) / baselineResult.operationsPerSecond) * 100;
            if (opsRegression > this.options.thresholds.opsPerSecRegression) {
                regressions.push({
                    benchmark: name,
                    metric: 'Operations/sec',
                    baseline: baselineResult.operationsPerSecond,
                    current: currentResult.operationsPerSecond,
                    regression: opsRegression,
                    threshold: this.options.thresholds.opsPerSecRegression
                });
            }
            // Check memory regression
            const memoryRegression = ((currentResult.memoryUsage.delta.heapUsed - baselineResult.memoryUsage.delta.heapUsed) / Math.abs(baselineResult.memoryUsage.delta.heapUsed)) * 100;
            if (memoryRegression > this.options.thresholds.memoryRegression) {
                regressions.push({
                    benchmark: name,
                    metric: 'Memory Usage',
                    baseline: baselineResult.memoryUsage.delta.heapUsed,
                    current: currentResult.memoryUsage.delta.heapUsed,
                    regression: memoryRegression,
                    threshold: this.options.thresholds.memoryRegression
                });
            }
        }
        const passed = regressions.length === 0;
        const report = this.generateRegressionReport(regressions, passed);
        return { passed, regressions, report };
    }
    generateRegressionReport(regressions, passed) {
        let report = '# Performance Regression Test Report\n\n';
        if (passed) {
            report += '✅ **All tests passed!** No performance regressions detected.\n\n';
        }
        else {
            report += `❌ **${regressions.length} regression(s) detected:**\n\n`;
            report += '| Benchmark | Metric | Baseline | Current | Regression | Threshold |\n';
            report += '|-----------|--------|----------|---------|------------|----------|\n';
            for (const regression of regressions) {
                report += `| ${regression.benchmark} | ${regression.metric} | ${regression.baseline.toFixed(2)} | ${regression.current.toFixed(2)} | ${regression.regression.toFixed(1)}% | ${regression.threshold}% |\n`;
            }
        }
        return report;
    }
}
exports.RegressionTester = RegressionTester;
// ============================================================================
// Exports
// ============================================================================
// Export statements removed - classes are already exported in their declarations
//# sourceMappingURL=benchmarks.js.map