export declare enum FeatureStage {
    ANALYSIS = "ANALYSIS",
    DESIGN = "DESIGN",
    DEVELOPMENT = "DEVELOPMENT",
    TESTING = "TESTING",
    REVIEW = "REVIEW",
    DEPLOYMENT = "DEPLOYMENT",
    COMPLETED = "COMPLETED"
}
export interface QualitativeAssessment {
    challenges: string[];
    risks: string[];
    notes: string;
    lastUpdated: Date;
}
export interface CodeMetrics {
    linesOfCode: number;
    filesModified: string[];
    newFiles: string[];
    tokensUsed: number;
    testCoverage?: number;
}
export interface StageTransition {
    from: FeatureStage;
    to: FeatureStage;
    timestamp: Date;
    duration: number;
}
export interface FeatureProgress {
    featureId: string;
    name: string;
    description: string;
    currentStage: FeatureStage;
    metrics: CodeMetrics;
    qualitativeAssessment: QualitativeAssessment;
    stageHistory: StageTransition[];
    dependencies: string[];
    startTime: Date;
    lastUpdated: Date;
    estimatedCompletion?: Date;
    completionPercentage: number;
}
