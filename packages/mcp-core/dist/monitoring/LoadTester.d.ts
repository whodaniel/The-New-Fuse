/**
 * Load Testing System
 */
import { ILoadTester } from '../interfaces/IMonitoring.js';
import { LoadTestConfig, LoadTestResult } from '../types/monitoring.js';
import { Logger } from '../utils/Logger.js';
/**
 * Load tester implementation
 */
export declare class LoadTester implements ILoadTester {
    private readonly logger;
    private readonly runningTests;
    private readonly testHistory;
    constructor(logger?: Logger);
    /**
     * Run a load test
     */
    runLoadTest(config: LoadTestConfig): Promise<LoadTestResult>;
    /**
     * Get running tests
     */
    getRunningTests(): LoadTestConfig[];
    /**
     * Stop a running test
     */
    stopTest(testName: string): Promise<void>;
    /**
     * Get test history
     */
    getTestHistory(): LoadTestResult[];
    /**
     * Generate load test report
     */
    generateTestReport(result: LoadTestResult): Promise<string>;
}
//# sourceMappingURL=LoadTester.d.ts.map