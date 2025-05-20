import { useState, useCallback, useEffect } from 'react';
import { FeatureTracker } from '../FeatureTracker.js';
import type { FeatureProgress, FeatureStage, CodeMetrics, QualitativeAssessment } from '../types.js';

interface UseFeatureTrackerResult {
  feature: FeatureProgress | null;
  initializeFeature: (name: string, description: string, dependencies?: string[]) => FeatureProgress;
  updateStage: (newStage: FeatureStage) => FeatureProgress | undefined;
  updateMetrics: (metrics: Partial<CodeMetrics>) => FeatureProgress | undefined;
  updateQualitativeAssessment: (assessment: Partial<QualitativeAssessment>) => FeatureProgress | undefined;
  getProgressSummary: () => string;
}

export const useFeatureTracker = (featureId: string): UseFeatureTrackerResult => {
  const [tracker] = useState(() => new FeatureTracker());
  const [feature, setFeature] = useState<FeatureProgress | null>(null);

  useEffect(() => {
    try {
      const existingFeature = tracker.getFeature(featureId);
      setFeature(existingFeature);
    } catch (error) {
      setFeature(null);
    }
  }, [featureId, tracker]);

  const initializeFeature = useCallback(
    (name: string, description: string, dependencies: string[] = []) => {
      const newFeature = tracker.createFeature(featureId, name, description, dependencies);
      setFeature(newFeature);
      return newFeature;
    },
    [featureId, tracker]
  );

  const updateStage = useCallback(
    (newStage: FeatureStage) => {
      if(!feature) return;
      const updated = tracker.updateStage(featureId, newStage);
      setFeature(updated);
      return updated;
    },
    [featureId, feature, tracker]
  );

  const updateMetrics = useCallback(
    (metrics: Partial<CodeMetrics>) => {
      if(!feature) return;
      const updated = tracker.updateMetrics(featureId, metrics);
      setFeature(updated);
      return updated;
    },
    [featureId, feature, tracker]
  );

  const updateQualitativeAssessment = useCallback(
    (assessment: Partial<QualitativeAssessment>) => {
      if (!feature) return;
      const updated = tracker.updateQualitativeAssessment(featureId, assessment);
      setFeature(updated);
      return updated;
    },
    [featureId, feature, tracker]
  );

  const getProgressSummary = useCallback(() => {
    if (!feature) return '';
    return tracker.getProgressSummary(featureId);
  }, [featureId, feature, tracker]);

  return {
    feature,
    initializeFeature,
    updateStage,
    updateMetrics,
    updateQualitativeAssessment,
    getProgressSummary,
  };
};
