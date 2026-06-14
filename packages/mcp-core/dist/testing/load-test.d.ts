/**
 * Load Testing Utilities for MCP System
 *
 * These utilities provide comprehensive load testing capabilities
 * for MCP servers, clients, and the overall system performance
 * under various stress conditions.
 */
import { EventEmitter } from 'events';
import { MCPServer } from '../server/MCPServer.js';
import { MCPRequest } from '../types/message.js';
export interface LoadTestConfig {
    duration: number;
    concurrency: number;
    requestsPerSecond?: number;
    rampUpTime?: number;
    rampDownTime?: number;
    mixedLoad?: LoadTestScenario[];
    warmupRequests?: number;
}
export interface LoadTestScenario {
    name: string;
    weight: number;
    requestGenerator: () => MCPRequest;
}
export interface LoadTestMetrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalDuration: number;
    avgResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    p50ResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    requestsPerSecond: number;
    errorsPerSecond: number;
    memoryUsage: {
        initial: NodeJS.MemoryUsage;
        final: NodeJS.MemoryUsage;
        peak: NodeJS.MemoryUsage;
    };
    cpuUsage?: {
        initial: NodeJS.CpuUsage;
        final: NodeJS.CpuUsage;
    };
    errorBreakdown: Map<string, number>;
    latencyDistribution: number[];
}
export interface LoadTestResult {
    config: LoadTestConfig;
    metrics: LoadTestMetrics;
    success: boolean;
    errors: string[];
    recommendations: string[];
}
export declare class LoadTestRunner extends EventEmitter {
    private server;
    private activeClients;
    private metrics;
    private responseTimes;
    private errorCounts;
    private memorySnapshots;
    private isRunning;
    constructor(server: MCPServer);
    runLoadTest(config: LoadTestConfig): Promise<LoadTestResult>;
    private executeLoadTest;
    private runWarmup;
    private executeMainLoadTest;
    private createClients;
    private getDefaultScenarios;
    private rampUpClients;
    private rampDownClients;
    private waitForDuration;
    private startMemoryMonitoring;
    private recordResponse;
    private calculateFinalMetrics;
    private calculatePercentile;
    private getCurrentMetrics;
    private generateResult;
    private resetMetrics;
    private cleanup;
    private executeRequest;
}
export declare class LoadTestScenarios {
    static createResourceLoadScenarios(resourceUris: string[]): LoadTestScenario[];
    static createToolLoadScenarios(tools: Array<{
        name: string;
        testParams: any;
    }>): LoadTestScenario[];
    static createMixedLoadScenarios(resourceUris: string[], tools: Array<{
        name: string;
        testParams: any;
    }>): LoadTestScenario[];
}
export declare class LoadTestReporter {
    static generateReport(result: LoadTestResult): string;
    static generateCSVReport(result: LoadTestResult): string;
}
//# sourceMappingURL=load-test.d.ts.map