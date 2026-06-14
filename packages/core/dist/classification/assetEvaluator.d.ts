export interface EvaluationFactors {
    compatibility: number;
    complexity: number;
    risk: number;
    effort: number;
    value: number;
}
export interface RiskAssessment {
    type: 'security' | 'performance' | 'compatibility' | 'maintenance';
    description: string;
    severity: 'low' | 'medium' | 'high';
    mitigation?: string;
}
export interface EvaluationResult {
    score: number;
    recommendation: string;
    risks: RiskAssessment[];
    adaptations: string[];
    timeline: string;
    confidence: number;
}
export declare class AssetEvaluator {
    evaluate(factors: EvaluationFactors): EvaluationResult;
    private _calculateScore;
    private _generateRecommendation;
    private _identifyRisks;
    private _identifyAdaptations;
    private _estimateTimeline;
    private _calculateConfidenceLevel;
}
//# sourceMappingURL=assetEvaluator.d.ts.map