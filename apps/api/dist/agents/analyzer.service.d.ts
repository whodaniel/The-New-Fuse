import { DrizzleService } from '@the-new-fuse/database';
export interface CodeIssue {
    id: string;
    file: string;
    line: number;
    type: 'bug' | 'performance' | 'security' | 'quality' | 'anti-pattern';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    suggestion: string;
    impact: number;
    estimatedEffort: 'low' | 'medium' | 'high';
}
export interface AnalysisReport {
    timestamp: Date;
    issues: CodeIssue[];
    prioritizedIssues: CodeIssue[];
    bottlenecks: Array<{
        location: string;
        description: string;
        impact: number;
    }>;
    antiPatterns: Array<{
        pattern: string;
        occurrences: number;
        locations: string[];
    }>;
    metrics: {
        totalFiles: number;
        totalIssues: number;
        criticalIssues: number;
        highIssues: number;
        mediumIssues: number;
        lowIssues: number;
        technicalDebtScore: number;
    };
}
export declare class AnalyzerAgentService {
    private readonly drizzle;
    private readonly logger;
    private readonly codebaseRoot;
    constructor(drizzle: DrizzleService);
    scanCodebase(): Promise<AnalysisReport>;
    private analyzeFile;
    private identifyBottlenecks;
    private findAntiPatterns;
    private calculateMetrics;
    private prioritizeIssues;
    private storeReport;
    getSuggestions(): Promise<CodeIssue[]>;
}
//# sourceMappingURL=analyzer.service.d.ts.map