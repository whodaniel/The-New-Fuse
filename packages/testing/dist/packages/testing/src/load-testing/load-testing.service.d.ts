import { ConfigService } from '@nestjs/config';
export interface LoadTestConfig {
    url: string;
    method: string;
    duration: number;
    rate: number;
    connections: number;
    headers?: Record<string, string>;
    body?: any;
    variables?: Record<string, any>;
    assertions?: {
        responseTime?: number;
        statusCode?: number;
        failureRate?: number;
    };
}
export interface LoadTestResult {
    summary: {
        totalRequests: number;
        successfulRequests: number;
        failedRequests: number;
        requestsPerSecond: number;
        averageResponseTime: number;
        minResponseTime: number;
        maxResponseTime: number;
        p50ResponseTime: number;
        p90ResponseTime: number;
        p95ResponseTime: number;
        p99ResponseTime: number;
    };
    assertions: {
        passed: boolean;
        details: {
            responseTime?: {
                passed: boolean;
                actual: number;
                expected: number;
            };
            statusCode?: {
                passed: boolean;
                actual: number;
                expected: number;
            };
            failureRate?: {
                passed: boolean;
                actual: number;
                expected: number;
            };
        };
    };
    timestamp: Date;
    config: LoadTestConfig;
    rawOutput: string;
}
export declare class LoadTestingService {
    private readonly configService;
    private readonly outputDir;
    constructor(configService: ConfigService);
    /**
     * Run a load test using k6
     */
    runLoadTest(config: LoadTestConfig): Promise<LoadTestResult>;
    /**
     * Generate a k6 script from a configuration
     */
    private generateK6Script;
    /**
     * Parse k6 output into a structured result
     */
    private parseK6Output;
    /**
     * Extract a metric from k6 output
     */
    private extractMetric;
    /**
     * Save test results to a file
     */
    private saveResults;
}
//# sourceMappingURL=load-testing.service.d.ts.map