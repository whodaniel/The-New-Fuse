interface TestResult {
    passed: boolean;
    duration: number;
    result: Record<string, unknown>;
}
interface TestSummary {
    total: number;
    passed: number;
}
interface TestCoverage {
    percentage: number;
    coveredSteps: string[];
}
interface PerformanceAnalysis {
    averageDuration: number;
    slowestTest: TestResult;
}
interface TestResults {
    summary: TestSummary;
    coverage: TestCoverage;
    performance: PerformanceAnalysis;
    recommendations: string[];
}
interface WorkflowTemplate {
    id: string;
    name: string;
}
interface WorkflowTestCase {
    id: string;
    name: string;
    input: Record<string, unknown>;
    expectedOutput: Record<string, unknown>;
}
interface TestRunner {
    run(testCase: WorkflowTestCase): Promise<TestResult>;
}
interface MockRegistry {
    register(mock: unknown): void;
}
interface TestCaseGenerator {
    generate(workflow: WorkflowTemplate): Promise<WorkflowTestCase[]>;
}
export declare class WorkflowTestFramework {
    private readonly testRunner;
    private readonly mockRegistry;
    private readonly testCaseGenerator;
    constructor(testRunner: TestRunner, mockRegistry: MockRegistry, testCaseGenerator: TestCaseGenerator);
    testWorkflow(workflow: WorkflowTemplate, testCases: WorkflowTestCase[]): Promise<TestResults>;
    generateTestCases(workflow: WorkflowTemplate): Promise<WorkflowTestCase[]>;
    private setupTestEnvironment;
    private runTestCase;
    private generateTestSummary;
    private calculateCoverage;
    private analyzePerformance;
    private generateTestRecommendations;
}
export {};
//# sourceMappingURL=testing.d.ts.map