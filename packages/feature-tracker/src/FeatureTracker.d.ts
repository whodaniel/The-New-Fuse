import { FeatureProgress, FeatureStage, CodeMetrics, QualitativeAssessment } from './types.js';
export declare class FeatureTracker {
    private features;
    constructor();
    createFeature(featureId: string, name: string, description: string, dependencies?: string[]): FeatureProgress;
    getFeature(featureId: string): FeatureProgress;
    updateStage(featureId: string, newStage: FeatureStage): FeatureProgress;
    private calculateCompletionPercentage;
    updateMetrics(featureId: string, metrics: Partial<CodeMetrics>): FeatureProgress;
    updateQualitativeAssessment(featureId: string, assessment: Partial<QualitativeAssessment>): FeatureProgress;
    getProgressSummary(featureId: string): string;
}
