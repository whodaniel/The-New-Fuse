import type { FeatureProgress, FeatureStage, CodeMetrics, QualitativeAssessment } from '../types.js';
interface UseFeatureTrackerResult {
    feature: FeatureProgress | null;
    initializeFeature: (name: string, description: string, dependencies?: string[]) => FeatureProgress;
    updateStage: (newStage: FeatureStage) => FeatureProgress | undefined;
    updateMetrics: (metrics: Partial<CodeMetrics>) => FeatureProgress | undefined;
    updateQualitativeAssessment: (assessment: Partial<QualitativeAssessment>) => FeatureProgress | undefined;
    getProgressSummary: () => string;
}
export declare const useFeatureTracker: (featureId: string) => UseFeatureTrackerResult;
export {};
//# sourceMappingURL=useFeatureTracker.d.ts.map