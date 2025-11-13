/**
 * CodeReviewService.ts
 *
 * Traycer-style code review and analysis capabilities.
 * Provides automatic/manual analysis, security scanning, and best practices checking.
 */
import { EventEmitter } from 'events';
export interface AnalysisRequest {
    id: string;
    type: 'file' | 'changes' | 'workspace' | 'plan_verification';
    trigger: 'manual' | 'automatic' | 'plan_step';
    scope: AnalysisScope;
    options: AnalysisOptions;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}
export interface AnalysisScope {
    workspace?: string;
    files: string[];
    changedFiles?: string[];
    planId?: string;
    stepId?: string;
    gitRef?: string;
    contextLines?: number;
}
export interface AnalysisOptions {
    depth: 'basic' | 'comprehensive' | 'detailed';
    categories: AnalysisCategory[];
    autoFix?: boolean;
    reportFormat?: 'json' | 'markdown' | 'html';
    excludePatterns?: string[];
    includePatterns?: string[];
    languageSpecific?: Record<string, any>;
}
export type AnalysisCategory = 'code_quality' | 'security' | 'performance' | 'maintainability' | 'testing' | 'documentation' | 'best_practices' | 'architecture' | 'dependencies';
export interface AnalysisResult {
    requestId: string;
    status: 'success' | 'error' | 'partial';
    summary: AnalysisSummary;
    findings: AnalysisFinding[];
    metrics: CodeMetrics;
    recommendations: Recommendation[];
    fixableIssues: FixableIssue[];
    executionTime: number;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface AnalysisSummary {
    totalFiles: number;
    analyzedFiles: number;
    totalFindings: number;
    criticalIssues: number;
    warningIssues: number;
    infoIssues: number;
    overallScore: number;
    categoryScores: Record<AnalysisCategory, number>;
    trendsFromPrevious?: AnalysisTrend;
}
export interface AnalysisFinding {
    id: string;
    category: AnalysisCategory;
    severity: 'critical' | 'major' | 'minor' | 'info';
    title: string;
    description: string;
    location: CodeLocation;
    rule?: string;
    ruleUrl?: string;
    suggestion?: string;
    examples?: string[];
    fixable: boolean;
    fix?: SuggestedFix;
    metadata?: Record<string, any>;
}
export interface CodeLocation {
    file: string;
    startLine: number;
    endLine: number;
    startColumn?: number;
    endColumn?: number;
    code?: string;
    context?: string[];
}
export interface SuggestedFix {
    description: string;
    changes: FileChange[];
    confidence: number;
    riskLevel: 'low' | 'medium' | 'high';
}
export interface FileChange {
    file: string;
    operation: 'replace' | 'insert' | 'delete';
    startLine: number;
    endLine: number;
    newContent: string;
    oldContent?: string;
}
export interface CodeMetrics {
    linesOfCode: number;
    complexity: ComplexityMetrics;
    maintainability: MaintainabilityMetrics;
    testCoverage?: TestCoverageMetrics;
    dependencies: DependencyMetrics;
    duplication: DuplicationMetrics;
}
export interface ComplexityMetrics {
    cyclomatic: number;
    cognitive: number;
    halstead: HalsteadMetrics;
    fileComplexity: Record<string, number>;
}
export interface HalsteadMetrics {
    vocabulary: number;
    length: number;
    difficulty: number;
    effort: number;
    bugs: number;
}
export interface MaintainabilityMetrics {
    index: number;
    techDebt: number;
    codeSmells: number;
    fileScores: Record<string, number>;
}
export interface TestCoverageMetrics {
    linesCovered: number;
    totalLines: number;
    percentage: number;
    branchesCovered: number;
    totalBranches: number;
    branchPercentage: number;
    filesCovered: number;
    totalFiles: number;
    filePercentage: number;
}
export interface DependencyMetrics {
    totalDependencies: number;
    directDependencies: number;
    outdatedDependencies: number;
    vulnerableDependencies: number;
    licenses: Record<string, number>;
}
export interface DuplicationMetrics {
    duplicatedLines: number;
    duplicatedBlocks: number;
    duplicationPercentage: number;
    duplicatedFiles: string[];
}
export interface Recommendation {
    id: string;
    category: AnalysisCategory;
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    impact: string;
    effort: 'low' | 'medium' | 'high';
    resources?: string[];
    implementationSteps?: string[];
}
export interface FixableIssue {
    findingId: string;
    fix: SuggestedFix;
    autoApplyable: boolean;
    requiresReview: boolean;
}
export interface AnalysisTrend {
    previousScore: number;
    scoreChange: number;
    newIssues: number;
    resolvedIssues: number;
    regressionIssues: number;
}
export interface ReviewComment {
    id: string;
    analysisId: string;
    findingId?: string;
    type: 'suggestion' | 'question' | 'issue' | 'approval' | 'general';
    location?: CodeLocation;
    content: string;
    author?: string;
    status: 'open' | 'addressed' | 'resolved' | 'dismissed';
    replies?: ReviewComment[];
    createdAt: Date;
    updatedAt: Date;
}
export interface AnalysisConfiguration {
    autoAnalysis: boolean;
    triggerEvents: ('file_save' | 'git_commit' | 'plan_step')[];
    categories: AnalysisCategory[];
    depth: 'basic' | 'comprehensive' | 'detailed';
    commentIndicator: 'hover' | 'codelens' | 'both';
    highlightComments: boolean;
    highlightColor: string;
    excludePatterns: string[];
}
export declare class CodeReviewService extends EventEmitter {
    private analysisRequests;
    private analysisResults;
    private comments;
    private configuration;
    constructor(config?: Partial<AnalysisConfiguration>);
    /**
     * Analyze a single file
     */
    analyzeFile(filePath: string, options?: Partial<AnalysisOptions>): Promise<AnalysisResult>;
    /**
     * Analyze changes in files
     */
    analyzeChanges(changedFiles: string[], workspace: string, options?: Partial<AnalysisOptions>): Promise<AnalysisResult>;
    /**
     * Analyze entire workspace
     */
    analyzeWorkspace(workspace: string, options?: Partial<AnalysisOptions>): Promise<AnalysisResult>;
    /**
     * Analyze for plan verification
     */
    analyzePlanVerification(planId: string, stepId: string | undefined, files: string[], workspace: string, verificationCriteria: string[], options?: Partial<AnalysisOptions>): Promise<AnalysisResult>;
    /**
     * Enable automatic analysis
     */
    enableAutoAnalysis(events?: ('file_save' | 'git_commit' | 'plan_step')[]): void;
    /**
     * Disable automatic analysis
     */
    disableAutoAnalysis(): void;
    /**
     * Enable comment highlighting
     */
    enableCommentsHighlighting(color?: string): void;
    /**
     * Disable comment highlighting
     */
    disableCommentsHighlighting(): void;
    /**
     * Trigger automatic analysis based on events
     */
    triggerAutoAnalysis(event: 'file_save' | 'git_commit' | 'plan_step', context: {
        files?: string[];
        workspace?: string;
        planId?: string;
        stepId?: string;
    }): Promise<AnalysisResult | null>;
    /**
     * Execute analysis request
     */
    private executeAnalysis;
    /**
     * Perform the actual analysis
     */
    private performAnalysis;
    lines: any;
    forEach(): any;
}
//# sourceMappingURL=CodeReviewService.d.ts.map