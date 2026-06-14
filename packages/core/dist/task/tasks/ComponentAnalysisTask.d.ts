export interface ComponentAnalysisData {
    componentId: string;
    componentType: string;
    sourceCode?: string;
    dependencies?: string[];
    metadata?: Record<string, any>;
}
export interface ComponentAnalysisResult {
    componentId: string;
    analysis: {
        complexity: number;
        maintainability: number;
        security: number;
        performance: number;
        issues: string[];
        recommendations: string[];
    };
    metrics: Record<string, any>;
    timestamp: string;
}
export declare class ComponentAnalysisTask {
    constructor();
    execute(data: ComponentAnalysisData): Promise<ComponentAnalysisResult>;
    analyzeComplexity(sourceCode: string | undefined): Promise<number>;
    analyzeMaintainability(sourceCode: string | undefined): Promise<number>;
    analyzePerformance(sourceCode: string | undefined): Promise<number>;
    generateIssues(sourceCode: string | undefined): Promise<string[]>;
    generateRecommendations(sourceCode: string | undefined): Promise<string[]>;
}
//# sourceMappingURL=ComponentAnalysisTask.d.ts.map