export interface FeatureTracker {
    id: string;
    name: string;
    description: string;
    stage: FeatureStage;
    completionPercentage: number;
    metrics: CodeMetrics;
    assessment: QualitativeAssessment;
}
export interface CodeMetrics {
    linesOfCode: number;
    filesModified: string[];
    newFiles: string[];
    testCoverage: number;
}
export interface QualitativeAssessment {
    challenges: string[];
    risks: string[];
    notes: string;
}
export interface FeatureProgress {
    feature: FeatureTracker;
}
export declare enum FeatureStage {
    PLANNING = "PLANNING",
    DEVELOPMENT = "DEVELOPMENT",
    TESTING = "TESTING",
    REVIEW = "REVIEW",
    DEPLOYED = "DEPLOYED"
}
//# sourceMappingURL=index.d.ts.map