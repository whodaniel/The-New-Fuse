import { PerformanceThresholds } from './utils/measurePerformance';
import { LeakDetectionOptions, LeakDetectionResult } from './utils/memoryLeakDetector';
import { RegressionThresholds } from './regression/regressionDetector';
import { TestResult, ReportOptions } from './reporting/reportGenerator';
export interface PerformanceTestOptions {
    name: string;
    iterations?: number;
    warmupIterations?: number;
    performanceThresholds?: PerformanceThresholds;
    leakDetectionOptions?: LeakDetectionOptions;
    regressionThresholds?: RegressionThresholds;
}
export interface PerformanceTestResult extends TestResult {
    leakDetection?: LeakDetectionResult;
}
export declare class PerformanceSuite {
    private readonly options;
    private regressionDetector;
    private reportGenerator;
    private testResults;
    constructor(options?: {
        baselinePath?: string;
        reportOptions?: Partial<ReportOptions>;
        defaultThresholds?: {
            performance?: PerformanceThresholds;
            regression?: RegressionThresholds;
            leakDetection?: LeakDetectionOptions;
        };
    });
    /**
     * Run a performance test with the specified options
     */
    test(fn: () => Promise<any> | any, options: PerformanceTestOptions): Promise<PerformanceTestResult>;
    /**
     * Save current test results as the new baseline
     */
    saveBaseline(testName?: string): Promise<void>;
    /**
     * Generate a performance report for all completed tests
     */
    generateReport(options?: Partial<ReportOptions>): Promise<string>;
    /**
     * Clear all test results
     */
    clearResults(): void;
    /**
     * Get test result by name
     */
    getTestResult(name: string): PerformanceTestResult | undefined;
    /**
     * Get all test results
     */
    getAllTestResults(): PerformanceTestResult[];
}
//# sourceMappingURL=PerformanceSuite.d.ts.map