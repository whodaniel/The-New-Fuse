declare enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
interface QualityIssue {
    type: 'lint' | 'complexity' | 'maintainability' | 'security';
    severity: ErrorSeverity;
    rule: string;
    message: string;
    line?: number;
    column?: number;
    fix?: string;
}
interface QualityReport {
    fileName: string;
    issues: QualityIssue[];
    score: number;
    metrics: {
        complexity: number;
        maintainability: number;
        coverage?: number;
    };
}
export declare class CodeQualityAnalyzer {
    analyzeFile(filePath: string): Promise<QualityReport>;
    private analyzeLintIssues;
    private analyzeComplexity;
    private analyzeMaintainability;
    private calculateScore;
    private getMetrics;
    getSeverityLevel(score: number): ErrorSeverity;
}
export {};
//# sourceMappingURL=code.quality.analyzer.d.ts.map