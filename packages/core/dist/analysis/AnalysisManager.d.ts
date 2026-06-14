export interface AnalysisResult {
    id: string;
    type: 'code_quality' | 'security' | 'performance' | 'dependency' | 'complexity';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    file?: string;
    line?: number;
    column?: number;
    suggestions?: string[];
    metadata?: Record<string, any>;
    timestamp: Date;
}
export interface AnalysisConfig {
    includeCodeQuality: boolean;
    includeSecurity: boolean;
    includePerformance: boolean;
    includeDependency: boolean;
    includeComplexity: boolean;
    severityThreshold: 'low' | 'medium' | 'high' | 'critical';
    excludePatterns?: string[];
    customRules?: AnalysisRule[];
}
export interface AnalysisRule {
    id: string;
    name: string;
    description: string;
    type: AnalysisResult['type'];
    severity: AnalysisResult['severity'];
    pattern: string | RegExp;
    suggestions: string[];
}
export interface AnalysisReport {
    id: string;
    timestamp: Date;
    config: AnalysisConfig;
    results: AnalysisResult[];
    summary: {
        totalIssues: number;
        critical: number;
        high: number;
        medium: number;
        low: number;
        byType: Record<AnalysisResult['type'], number>;
    };
    executionTime: number;
}
export declare class AnalysisManager {
    private readonly logger;
    private analysisQueue;
    analyzeCode(files: string[], config: AnalysisConfig): Promise<AnalysisReport>;
    private analyzeCodeQuality;
    private analyzeSecurity;
    private analyzePerformance;
    private analyzeDependencies;
    private analyzeComplexity;
    private applyCustomRules;
    private filterBySeverity;
    private generateSummary;
    getAnalysisReport(id: string): Promise<AnalysisReport | null>;
    listAnalysisReports(): Promise<AnalysisReport[]>;
    getDefaultConfig(): AnalysisConfig;
}
//# sourceMappingURL=AnalysisManager.d.ts.map