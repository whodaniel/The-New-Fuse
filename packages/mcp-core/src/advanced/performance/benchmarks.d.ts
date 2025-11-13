/**
 * Benchmark Utilities for Advanced MCP Performance Testing
 *
 * This module provides comprehensive benchmarking tools for measuring
 * and comparing the performance of different implementations and optimizations.
 */
import { EventEmitter } from 'events';
export interface BenchmarkOptions {
    name: string;
    iterations?: number;
    warmupIterations?: number;
    timeout?: number;
    setup?: () => Promise<void>;
    teardown?: () => Promise<void>;
}
export interface BenchmarkResult {
    name: string;
    iterations: number;
    totalTime: number;
    averageTime: number;
    minTime: number;
    maxTime: number;
    medianTime: number;
    p95Time: number;
    p99Time: number;
    operationsPerSecond: number;
    standardDeviation: number;
    memoryUsage: {
        before: NodeJS.MemoryUsage;
        after: NodeJS.MemoryUsage;
        delta: NodeJS.MemoryUsage;
    };
}
export interface ComparisonResult {
    baseline: BenchmarkResult;
    comparison: BenchmarkResult;
    improvement: {
        averageTime: number;
        operationsPerSecond: number;
        memoryUsage: number;
    };
    significance: 'significant' | 'marginal' | 'insignificant';
}
export declare class BenchmarkRunner extends EventEmitter {
    private monitor;
    private results;
    constructor();
    runBenchmark(testFn: () => Promise<any> | any, options: BenchmarkOptions): Promise<BenchmarkResult>;
    private calculateStatistics;
    compareBenchmarks(baselineName: string, comparisonName: string): Promise<ComparisonResult | null>;
    getResult(name: string): BenchmarkResult | undefined;
    getAllResults(): Map<string, BenchmarkResult>;
    generateReport(): string;
    clear(): void;
}
export declare class MCPBenchmarks {
    private runner;
    constructor();
    benchmarkTaskDistribution(orchestrator: any, taskCount?: number): Promise<BenchmarkResult>;
    benchmarkBrowserAutomation(browserAutomation: any, urls: string[]): Promise<BenchmarkResult>;
    benchmarkSecurity(securityFramework: any, dataSize?: number): Promise<BenchmarkResult>;
    benchmarkCommunication(communicationHub: any, messageCount?: number): Promise<BenchmarkResult>;
    benchmarkMonitoring(monitoringEngine: any, metricCount?: number): Promise<BenchmarkResult>;
    benchmarkPluginEcosystem(pluginEcosystem: any, pluginCount?: number): Promise<BenchmarkResult>;
    runComprehensiveBenchmarks(components: {
        orchestrator?: any;
        browserAutomation?: any;
        securityFramework?: any;
        communicationHub?: any;
        monitoringEngine?: any;
        pluginEcosystem?: any;
    }): Promise<Map<string, BenchmarkResult>>;
    getRunner(): BenchmarkRunner;
}
export interface RegressionTestOptions {
    baselineResults: Map<string, BenchmarkResult>;
    thresholds: {
        averageTimeRegression: number;
        opsPerSecRegression: number;
        memoryRegression: number;
    };
}
export declare class RegressionTester {
    private options;
    constructor(options: RegressionTestOptions);
    runRegressionTest(currentResults: Map<string, BenchmarkResult>): Promise<{
        passed: boolean;
        regressions: Array<{
            benchmark: string;
            metric: string;
            baseline: number;
            current: number;
            regression: number;
            threshold: number;
        }>;
        report: string;
    }>;
    private generateRegressionReport;
}
//# sourceMappingURL=benchmarks.d.ts.map