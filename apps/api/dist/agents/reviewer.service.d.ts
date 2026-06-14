import { DrizzleService } from '@the-new-fuse/database';
interface CodeReview {
    implementationId: string;
    approved: boolean;
    score: number;
    findings: ReviewFinding[];
    securityIssues: SecurityIssue[];
    testCoverage: {
        percentage: number;
        missingTests: string[];
    };
    qualityMetrics: {
        complexity: number;
        maintainability: number;
        readability: number;
        testability: number;
    };
    suggestions: string[];
    decision: 'approve' | 'reject' | 'request_changes';
    feedback: string;
}
interface ReviewFinding {
    file: string;
    line: number;
    severity: 'info' | 'warning' | 'error';
    category: 'bug' | 'security' | 'performance' | 'style' | 'best-practice';
    description: string;
    suggestion: string;
}
interface SecurityIssue {
    file: string;
    line: number;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation: string;
    cwe?: string;
}
export declare class ReviewerAgentService {
    private readonly drizzle;
    private readonly logger;
    private readonly codebaseRoot;
    constructor(drizzle: DrizzleService);
    reviewImplementation(implementation: {
        taskId: string;
        filesModified: string[];
        testsCreated: string[];
    }): Promise<CodeReview>;
    private reviewFile;
    private extractFunctionBody;
    private checkTestCoverage;
    private calculateQualityMetrics;
    private calculateReviewScore;
    private makeDecision;
    private generateFeedback;
    private generateSuggestions;
    private storeReview;
    runSecurityScan(files: string[]): Promise<SecurityIssue[]>;
}
export {};
//# sourceMappingURL=reviewer.service.d.ts.map