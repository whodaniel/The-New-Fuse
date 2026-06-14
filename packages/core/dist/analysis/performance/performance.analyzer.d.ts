export interface PerformanceMetric {
    name: string;
    value: number;
    unit: string;
    timestamp: Date;
    threshold?: number;
}
export interface PerformanceIssue {
    type: 'slow' | 'memory' | 'cpu' | 'network';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    metric: PerformanceMetric;
    suggestion?: string;
}
export interface PerformanceReport {
    fileName: string;
    metrics: PerformanceMetric[];
    issues: PerformanceIssue[];
    score: number;
    summary: {
        avgResponseTime: number;
        peakMemoryUsage: number;
        cpuUtilization: number;
    };
}
export declare class PerformanceAnalyzer {
    analyzePerformance(filePath: string): Promise<PerformanceReport>;
    private collectMetrics;
    private detectIssues;
    private mapMetricToIssueType;
    private calculateScore;
    private calculateSummary;
}
//# sourceMappingURL=performance.analyzer.d.ts.map