/* eslint-disable no-unused-vars */
export enum FeatureStage {
  PLANNING = 'PLANNING',
  ANALYSIS = 'ANALYSIS',
  DEVELOPMENT = 'DEVELOPMENT',
  TESTING = 'TESTING',
  REVIEW = 'REVIEW',
  DEPLOYED = 'DEPLOYED',
}

export interface Feature {
  id: string;
  name: string;
  description?: string;
  status: FeatureStage;
  dependencies?: FeatureDependency[];
  dependents?: FeatureDependency[];
  stageTransitions?: StageTransition[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureDependency {
  id: string;
  dependentFeatureId: string;
  requiredFeatureId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StageTransition {
  id: string;
  featureId: string;
  fromStage: FeatureStage;
  toStage: FeatureStage;
  createdAt: Date;
  updatedAt: Date;
}

export interface CodeMetrics {
  linesOfCode?: number;
  testCoverage?: number;
  complexity?: number;
  maintainabilityIndex?: number;
}

export interface QualitativeAssessment {
  codeQuality?: number;
  documentation?: number;
  testQuality?: number;
  notes?: string;
}

export interface FeatureProgress extends Feature {
  stage: FeatureStage;
  metrics?: CodeMetrics;
  assessment?: QualitativeAssessment;
}
