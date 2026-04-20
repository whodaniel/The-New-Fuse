import { Injectable } from '@nestjs/common';
import { FeatureProgress, FeatureStage, CodeMetrics, QualitativeAssessment } from './types.js';

@Injectable()
export class FeatureTracker {
  private features: Map<string, FeatureProgress> = new Map<string, FeatureProgress>();

  constructor() {}

  createFeature(featureId: string, name: string, description: string, dependencies: string[] = []): FeatureProgress {
    const newFeature: FeatureProgress = {
      featureId,
      name,
      description,
      currentStage: FeatureStage.ANALYSIS,
      metrics: {
        linesOfCode: 0,
        filesModified: [],
        newFiles: [],
        tokensUsed: 0,
        testCoverage: 0
      },
      qualitativeAssessment: {
        challenges: [],
        risks: [],
        notes: '',
        lastUpdated: new Date()
      },
      stageHistory: [],
      dependencies,
      startTime: new Date(),
      lastUpdated: new Date(),
      completionPercentage: 0
    };

    this.features.set(featureId, newFeature);
    return newFeature;
  }

  getFeature(featureId: string): FeatureProgress {
    const feature = this.features.get(featureId);
    if (!feature) {
      throw new Error(`Feature ${featureId} not found`);
    }
    return feature;
  }

  updateStage(featureId: string, newStage: FeatureStage): FeatureProgress {
    const feature = this.getFeature(featureId);

    const stageTransition = {
      from: feature.currentStage,
      to: newStage,
      timestamp: new Date(),
      duration: new Date().getTime() - feature.lastUpdated.getTime()
    };

    const updatedFeature = {
      ...feature,
      currentStage: newStage,
      stageHistory: [...feature.stageHistory, stageTransition],
      lastUpdated: new Date(),
      completionPercentage: this.calculateCompletionPercentage(newStage)
    };

    this.features.set(featureId, updatedFeature);
    return updatedFeature;
  }

  private calculateCompletionPercentage(stage: FeatureStage): number {
    const stages = Object.values(FeatureStage);
    const currentIndex = stages.indexOf(stage);
    return Math.round((currentIndex / (stages.length - 1)) * 100);
  }

  updateMetrics(featureId: string, metrics: Partial<CodeMetrics>): FeatureProgress {
    const feature = this.getFeature(featureId);

    const updatedFeature = {
      ...feature,
      metrics: {
        ...feature.metrics,
        ...metrics
      },
      lastUpdated: new Date()
    };

    this.features.set(featureId, updatedFeature);
    return updatedFeature;
  }

  updateQualitativeAssessment(featureId: string, assessment: Partial<QualitativeAssessment>): FeatureProgress {
    const feature = this.getFeature(featureId);

    const updatedFeature = {
      ...feature,
      qualitativeAssessment: {
        ...feature.qualitativeAssessment,
        ...assessment,
        lastUpdated: new Date()
      },
      lastUpdated: new Date()
    };

    this.features.set(featureId, updatedFeature);
    return updatedFeature;
  }

  getProgressSummary(featureId: string): string {
    const feature = this.getFeature(featureId);
    return `Feature ${feature.name} is in ${feature.currentStage} stage with ${feature.completionPercentage}% completion.`;
  }
}
