import { ConfigService } from '@nestjs/config';
interface OptimizedQueueService {
    addJob(type: string, payload: any): Promise<any>;
    getQueueMetrics(): Promise<any>;
}
interface RedisCacheService {
    set(key: string, value: any, options?: any): Promise<void>;
    get(key: string): Promise<any>;
    delete(key: string): Promise<void>;
}
interface OptimizedWebSocketService {
}
interface OptimizedA2AService {
    registerAgent(agent: any): Promise<boolean>;
    unregisterAgent(id: string): Promise<void>;
    getMetrics(): Promise<any>;
    sendMessage(message: any): Promise<any>;
    broadcastMessage(message: any): Promise<any>;
}
export interface TestRunResult {
    id: string;
    name: string;
    status: 'running' | 'completed' | 'failed';
    startTime: number;
    endTime?: number;
    duration?: number;
    passed: number;
    failed: number;
    total: number;
    results: TestCaseResult[];
    summary?: string;
    error?: string;
}
export interface TestCaseResult {
    name: string;
    status: 'PASSED' | 'FAILED' | 'SKIPPED';
    duration: number;
    description: string;
    error?: string;
    metrics?: {
        assertions: number;
        performance: {
            memoryUsage: number;
            cpuTime: number;
            networkRequests: number;
        };
    };
}
export interface TestSchedule {
    id: string;
    name: string;
    cron: string;
    enabled: boolean;
    lastRun?: number;
    nextRun?: number;
    testSuites: string[];
}
export interface TestConfiguration {
    timeout: number;
    retryAttempts: number;
    parallel: boolean;
    maxConcurrentTests: number;
    environment: 'development' | 'staging' | 'production';
    cleanup: boolean;
    verbose: boolean;
}
export declare class TestRunnerService {
    private configService;
    private queueService?;
    private cacheService?;
    private websocketService?;
    private a2aService?;
    private readonly logger;
    private testRuns;
    private testSchedules;
    private currentlyRunning;
    private defaultConfig;
    constructor(configService: ConfigService, queueService?: OptimizedQueueService | undefined, cacheService?: RedisCacheService | undefined, websocketService?: OptimizedWebSocketService | undefined, a2aService?: OptimizedA2AService | undefined);
    runAgentWorkflowTests(config?: Partial<TestConfiguration>): Promise<TestRunResult>;
    runSingleTest(testName: string, config?: Partial<TestConfiguration>): Promise<TestCaseResult>;
    scheduleTests(schedule: Omit<TestSchedule, 'id'>): Promise<string>;
    updateSchedule(scheduleId: string, updates: Partial<TestSchedule>): Promise<boolean>;
    deleteSchedule(scheduleId: string): Promise<boolean>;
    getTestRun(runId: string): Promise<TestRunResult | null>;
    getAllTestRuns(limit?: number): Promise<TestRunResult[]>;
    getTestRunsByStatus(status: 'running' | 'completed' | 'failed'): Promise<TestRunResult[]>;
    getTestSchedules(): Promise<TestSchedule[]>;
    getTestAnalytics(days?: number): Promise<{
        totalRuns: number;
        successRate: number;
        averageDuration: number;
        trends: {
            daily: Array<{
                date: string;
                runs: number;
                passed: number;
                failed: number;
            }>;
            testCases: Array<{
                name: string;
                successRate: number;
                averageDuration: number;
            }>;
        };
        topFailures: Array<{
            testCase: string;
            failures: number;
            lastFailure: number;
        }>;
    }>;
    generateTestReport(runId: string): Promise<{
        summary: string;
        details: string;
        recommendations: string[];
    }>;
    private generateRunId;
    private generateScheduleId;
    private calculateNextRun;
    private generateTestSummary;
    private generateTestDetails;
    private generateRecommendations;
    private generateDailyTrends;
    private generateTestCaseAnalytics;
    private getTopFailures;
    private initializeDefaultSchedules;
    getHealthStatus(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        runningTests: number;
        totalRuns: number;
        lastSuccessfulRun?: number;
    }>;
}
export {};
//# sourceMappingURL=test-runner.service.d.ts.map