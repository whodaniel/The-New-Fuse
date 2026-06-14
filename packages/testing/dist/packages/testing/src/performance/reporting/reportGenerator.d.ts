import { PerformanceResult, PerformanceStats } from '../utils/measurePerformance';
import { RegressionAnalysisResult } from '../regression/regressionDetector';
export interface TestResult {
    name: string;
    timestamp: number;
    environment: string;
    results: PerformanceResult[];
    stats: PerformanceStats;
    regressionAnalysis?: RegressionAnalysisResult;
}
export interface ReportOptions {
    format: 'json' | 'html' | 'markdown';
    outputDir: string;
    includeCharts?: boolean;
    includeRawData?: boolean;
}
export declare class PerformanceReportGenerator {
    private readonly defaultOptions;
    constructor(defaultOptions?: Partial<ReportOptions>);
    generateReport(testResults: TestResult[], options?: Partial<ReportOptions>): Promise<string>;
    private generateJsonReport;
    private generateMarkdownReport;
    private generateHtmlReport;
    private ensureOutputDirectory;
}
//# sourceMappingURL=reportGenerator.d.ts.map