import React, { FC, useEffect } from "react";
import { FeatureStage } from '../types.js';
import { useFeatureTracker } from '../hooks/useFeatureTracker.js';
import { FeatureProgress } from '../components/FeatureProgress.js';

export const FeatureTrackingExample: FC = () => {
  const {
    feature,
    initializeFeature,
    updateStage,
    updateMetrics,
    updateQualitativeAssessment,
  } = useFeatureTracker('auth-001');

  useEffect(() => {
    if (!feature) {
      initializeFeature(
        'User Authentication',
        'Implement secure user authentication with JWT',
        ['database-001']
      );
    }
  }, [feature, initializeFeature]);

  const handleStageUpdate = (stage: FeatureStage) => {
    updateStage(stage);
  };

  const handleMetricsUpdate = () => {
    updateMetrics({
      linesOfCode: 150,
      filesModified: ['auth.controller.ts', 'auth.module.ts'],
      tokensUsed: 1500,
      testCoverage: 80,
    });
  };

  const handleAssessmentUpdate = () => {
    updateQualitativeAssessment({
      challenges: ['Implementing secure password reset flow'],
      risks: ['Need to ensure proper JWT secret rotation'],
      notes: 'Considering adding 2FA in future iteration',
    });
  };

  if (!feature) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <FeatureProgress feature={feature} />

      <div className="mt-8 space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Update Stage</h3>
          <select
            className="border rounded p-2"
            value={feature.currentStage}
            onChange={(e) => handleStageUpdate(e.target.value as FeatureStage)}
            aria-label="Select feature stage"
          >
            {Object.values(FeatureStage).map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Actions</h3>
          <div className="space-x-4">
            <button
              type="button"
              className="bg-blue-500 text-white px-4 py-2 rounded"
              onClick={handleMetricsUpdate}
            >
              Update Metrics
            </button>
            <button
              type="button"
              className="bg-green-500 text-white px-4 py-2 rounded"
              onClick={handleAssessmentUpdate}
            >
              Update Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
