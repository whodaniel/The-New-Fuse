import { Logger } from 'winston';
import { EventEmitter } from 'events';
/**
 * Test execution result interface
 */
export interface TestResult {
    id: string;
    type: TestType;
    status: TestStatus;
    startTime: Date;
    endTime: Date;
    duration: number;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    coverage?: CoverageReport;
    failures: TestFailure[];
    logs: string[];
    artifacts: TestArtifact[];
    metadata: Record<string, any>;
}
export interface TestFailure {
    testName: string;
    testFile: string;
    error: string;
    stackTrace?: string;
    line?: number;
    column?: number;
}
export interface CoverageReport {
    lines: CoverageMetric;
    functions: CoverageMetric;
    branches: CoverageMetric;
    statements: CoverageMetric;
    files: FileCoverage[];
    summary: {
        total: number;
        covered: number;
        percentage: number;
    };
}
export interface CoverageMetric {
    total: number;
    covered: number;
    percentage: number;
}
export interface FileCoverage {
    path: string;
    lines: CoverageMetric;
    functions: CoverageMetric;
    branches: CoverageMetric;
    statements: CoverageMetric;
}
export interface TestArtifact {
    name: string;
    path: string;
    type: 'report' | 'screenshot' | 'video' | 'log' | 'coverage';
    size: number;
    mimeType?: string;
}
export declare enum TestType {
    UNIT = "unit",
    INTEGRATION = "integration",
    E2E = "e2e",
    PERFORMANCE = "performance",
    SECURITY = "security",
    ACCESSIBILITY = "accessibility"
}
export declare enum TestStatus {
    PENDING = "pending",
    RUNNING = "running",
    PASSED = "passed",
    FAILED = "failed",
    SKIPPED = "skipped",
    CANCELLED = "cancelled"
}
export interface TestConfiguration {
    type: TestType;
    framework: TestFramework;
    command: string;
    workingDirectory: string;
    environment: Record<string, string>;
    timeout: number;
    retries: number;
    parallel: boolean;
    coverage: boolean;
    coverageThreshold?: CoverageThreshold;
    reportFormats: ReportFormat[];
    artifacts: ArtifactConfig[];
    filters?: TestFilter[];
}
export interface CoverageThreshold {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
}
export interface TestFilter {
    type: 'include' | 'exclude';
    pattern: string;
    field: 'name' | 'file' | 'tag';
}
export interface ArtifactConfig {
    name: string;
    path: string;
    type: 'report' | 'screenshot' | 'video' | 'log' | 'coverage';
    enabled: boolean;
}
export declare enum TestFramework {
    JEST = "jest",
    VITEST = "vitest",
    MOCHA = "mocha",
    PLAYWRIGHT = "playwright",
    CYPRESS = "cypress",
    PUPPETEER = "puppeteer",
    SELENIUM = "selenium"
}
export declare enum ReportFormat {
    JUNIT = "junit",
    JSON = "json",
    HTML = "html",
    LCOV = "lcov",
    COBERTURA = "cobertura",
    ALLURE = "allure"
}
/**
 * TestRunner handles execution of different types of tests with comprehensive reporting
 */
export declare class TestRunner extends EventEmitter {
    private logger;
    private runningTests;
    private testResults;
    constructor(logger: Logger);
    /**
     * Execute tests based on configuration
     */
    executeTests(config: TestConfiguration): Promise<TestResult>;
    /**
     * Cancel running tests
     */
    cancelTests(testId: string): Promise<boolean>;
    /**
     * Get test result by ID
     */
    getTestResult(testId: string): TestResult | null;
    /**
     * Get all test results
     */
    getAllTestResults(): TestResult[];
    /**
     * Generate test summary report
     */
    generateTestSummary(results: TestResult[]): TestSummaryReport;
    private prepareTestEnvironment;
    private runTestFramework;
    private runJestTests;
    private runVitestTests;
    private runPlaywrightTests;
    private runCypressTests;
    private runGenericTests;
    private processTestResults;
    private generateCoverageReport;
    private collectArtifacts;
    private parseJestResults;
    private parseVitestResults;
    private parsePlaywrightResults;
    private parseCoverageData;
    private calculateTestTrends;
    private aggregateCoverage;
    private getMimeType;
}
export interface TestSummaryReport {
    totalSuites: number;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    totalDuration: number;
    successRate: number;
    coverage: CoverageReport | null;
    byType: Record<string, TestTypeStats>;
    trends: TestTrends;
}
export interface TestTypeStats {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    duration: number;
    successRate: number;
}
export interface TestTrends {
    successRate: 'improving' | 'declining' | 'stable';
    duration: 'improving' | 'declining' | 'stable';
    coverage: 'improving' | 'declining' | 'stable';
}
//# sourceMappingURL=TestRunner.d.ts.map