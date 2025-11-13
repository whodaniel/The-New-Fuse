/**
 * Test Runner for Advanced MCP Capabilities
 *
 * This script runs all test suites and provides comprehensive test coverage
 * reporting for the advanced MCP capabilities.
 */
interface TestResult {
    suite: string;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    coverage?: {
        lines: number;
        functions: number;
        branches: number;
        statements: number;
    };
}
interface TestSummary {
    totalSuites: number;
    totalTests: number;
    totalPassed: number;
    totalFailed: number;
    totalSkipped: number;
    totalDuration: number;
    overallCoverage?: {
        lines: number;
        functions: number;
        branches: number;
        statements: number;
    };
}
declare class TestRunner {
    private testSuites;
    private results;
    runAllTests(): Promise<TestSummary>;
    private runTestSuite;
    private mockTestExecution;
    private getSuiteComplexity;
    private printSuiteResult;
    private generateSummary;
    private printSummary;
    private generateReport;
    private generateHTMLReport;
    runContinuousIntegration(): Promise<boolean>;
}
export { TestRunner };
export type { TestResult, TestSummary };
//# sourceMappingURL=test-runner.d.ts.map