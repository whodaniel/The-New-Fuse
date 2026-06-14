interface TestRunResult {
    id: string;
    name: string;
    status: string;
    startTime: number;
    duration?: number;
}
interface TestCaseResult {
    name: string;
    status: string;
    duration?: number;
    error?: string;
}
interface TestSchedule {
    id: string;
    name: string;
    cron: string;
    enabled: boolean;
    testSuites: string[];
    description?: string;
}
interface TestConfiguration {
    timeout?: number;
    retryAttempts?: number;
    parallel?: boolean;
    maxConcurrentTests?: number;
    environment?: string;
    cleanup?: boolean;
    verbose?: boolean;
}
declare class TestRunnerService {
    runAgentWorkflowTests(config?: Partial<TestConfiguration>): Promise<TestRunResult>;
    runSingleTest(name: string, config?: Partial<TestConfiguration>): Promise<TestCaseResult>;
    getAllTestRuns(limit?: number): Promise<TestRunResult[]>;
    getTestRunsByStatus(status: string): Promise<TestRunResult[]>;
    getTestRun(id: string): Promise<TestRunResult | null>;
    generateTestReport(id: string): Promise<{
        summary: string;
        details: string;
        recommendations: string[];
    }>;
    scheduleTests(request: any): Promise<string>;
    getTestSchedules(): Promise<TestSchedule[]>;
    updateSchedule(id: string, request: any): Promise<boolean>;
    deleteSchedule(id: string): Promise<boolean>;
    getTestAnalytics(days: number): Promise<any>;
    getHealthStatus(): Promise<any>;
}
interface RunTestsRequest {
    config?: Partial<TestConfiguration>;
    testNames?: string[];
    schedule?: boolean;
}
interface CreateScheduleRequest {
    name: string;
    cron: string;
    enabled: boolean;
    testSuites: string[];
    description?: string;
}
interface UpdateScheduleRequest {
    name?: string;
    cron?: string;
    enabled?: boolean;
    testSuites?: string[];
    description?: string;
}
export declare class TestRunnerController {
    private readonly testRunnerService;
    constructor(testRunnerService: TestRunnerService);
    runAgentWorkflowTests(request: RunTestsRequest): Promise<{
        runId: string;
        status: string;
        message: string;
    }>;
    runSingleTest(testName: string, request: {
        config?: Partial<TestConfiguration>;
    }): Promise<TestCaseResult>;
    getTestRuns(limit?: number, status?: 'running' | 'completed' | 'failed'): Promise<TestRunResult[]>;
    getTestRun(runId: string): Promise<TestRunResult>;
    getTestReport(runId: string): Promise<{
        summary: string;
        details: string;
        recommendations: string[];
    }>;
    createSchedule(request: CreateScheduleRequest): Promise<{
        scheduleId: string;
        message: string;
    }>;
    getSchedules(): Promise<TestSchedule[]>;
    updateSchedule(scheduleId: string, request: UpdateScheduleRequest): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteSchedule(scheduleId: string): Promise<{
        success: boolean;
        message: string;
    }>;
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
    getHealth(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        runningTests: number;
        totalRuns: number;
        lastSuccessfulRun?: number;
    }>;
    getAvailableTests(): Promise<{
        testSuites: Array<{
            name: string;
            description: string;
            testCases: Array<{
                name: string;
                description: string;
                estimatedDuration: number;
                tags: string[];
            }>;
        }>;
    }>;
    validateConfig(request: {
        config: Partial<TestConfiguration>;
    }): Promise<{
        valid: boolean;
        errors: string[];
        warnings: string[];
        recommendations: string[];
    }>;
    getCurrentStatus(): Promise<{
        runningTests: Array<{
            runId: string;
            name: string;
            startTime: number;
            estimatedTimeRemaining?: number;
        }>;
        queuedTests: number;
        systemLoad: {
            cpu: number;
            memory: number;
            activeConnections: number;
        };
    }>;
}
export {};
//# sourceMappingURL=test-runner.controller.d.ts.map