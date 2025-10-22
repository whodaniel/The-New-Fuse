import type { PackageInfo } from '../scanner/FileSystemScanner';
export interface TestFile {
    path: string;
    name: string;
    type: 'unit' | 'integration' | 'e2e' | 'spec' | 'unknown';
    framework: 'jest' | 'vitest' | 'mocha' | 'unknown';
    sourceFile?: string;
    testCount: number;
    hasDescribe: boolean;
    hasIt: boolean;
    hasMocks: boolean;
    imports: string[];
    coverage: {
        lines: number;
        functions: number;
        branches: number;
        statements: number;
    } | null;
}
export interface ComponentTestMapping {
    sourceFile: string;
    testFiles: TestFile[];
    hasCoverage: boolean;
    coverageGap: 'none' | 'partial' | 'missing';
    testQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'none';
}
export interface TestCoverageReport {
    totalSourceFiles: number;
    totalTestFiles: number;
    testedComponents: number;
    untestedComponents: number;
    coveragePercentage: number;
    testQualityDistribution: {
        excellent: number;
        good: number;
        fair: number;
        poor: number;
        none: number;
    };
    testsByFramework: {
        jest: number;
        vitest: number;
        mocha: number;
        unknown: number;
    };
    testsByType: {
        unit: number;
        integration: number;
        e2e: number;
        spec: number;
        unknown: number;
    };
    componentMappings: ComponentTestMapping[];
    testFiles: TestFile[];
    coverageGaps: {
        missingTests: string[];
        inadequateTests: string[];
        orphanedTests: string[];
    };
    recommendations: string[];
}
export declare class TestCoverageAnalyzer {
    private rootPath;
    private packages;
    constructor(packages: PackageInfo[], rootPath?: string);
    analyzeTestCoverage(): Promise<TestCoverageReport>;
    private discoverTestFiles;
    private analyzeTestFile;
    private determineTestType;
    private determineTestFramework;
    private findSourceFile;
    private countTests;
    private extractImports;
    private discoverSourceFiles;
    private mapTestsToComponents;
    private determineCoverageGap;
    private determineTestQuality;
    private analyzeTestQuality;
    private identifyCoverageGaps;
    private generateRecommendations;
    private generateReport;
}
//# sourceMappingURL=TestCoverageAnalyzer.d.ts.map