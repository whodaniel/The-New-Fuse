import React, { FC } from 'react';
import { FeatureStage, FeatureProgress as FeatureProgressType } from '../types.js';

// Define interfaces for props for better type safety
interface ProgressBarProps {
  percentage: number;
}

const ProgressBar: FC<ProgressBarProps> = ({ percentage }) => (
  <div className="w-full h-2 bg-gray-200 rounded-full">
      <div
        className={`h-full bg-blue-500 rounded-full transition-all duration-300 w-[${percentage}%]`}
      />
  </div>
);

interface StageIndicatorProps {
  stage: FeatureStage; // Use the imported enum
  isActive: boolean;
  isCompleted: boolean;
}

const StageIndicator: FC<StageIndicatorProps> = ({ stage, isActive, isCompleted }) => (
  <div className={`flex flex-col items-center ${isActive ? 'text-blue-500' : isCompleted ? 'text-green-500' : 'text-gray-400'}`}>
    <div className={`w-4 h-4 rounded-full ${
      isActive
        ? 'bg-blue-500'
        : isCompleted
          ? 'bg-green-500'
          : 'bg-gray-400'
    }`}/>
    <span className="text-sm mt-1">{String(stage)}</span> {/* Ensure stage is string if it's an enum */}
  </div>
);

interface FeatureProgressProps {
  feature: FeatureProgressType;
}

// Export the component directly using ES Module syntax
export const FeatureProgress: FC<FeatureProgressProps> = ({ feature }) => {
  const stages = Object.values(FeatureStage); // Use FeatureStage directly
  const currentStageIndex = stages.indexOf(feature.currentStage);

  // Basic validation for feature object and nested properties
  if (!feature || !feature.metrics || !feature.qualitativeAssessment) {
    // Render a loading state or null if data isn't ready
    return <div className="p-4 text-gray-500">Loading feature data...</div>;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{feature.name}</h2>
        <p className="text-gray-600">{feature.description}</p>
      </div>

      <div className="mb-6">
        <div className="flex justify-between mb-2">
          {/* Map over stages to render indicators */}
          {stages.map((stage, index) => (
            <StageIndicator
              key={stage}
              stage={stage}
              isActive={stage === feature.currentStage}
              isCompleted={index < currentStageIndex}
            />
          ))}
        </div>
        {/* Render progress bar */}
        <ProgressBar percentage={feature.completionPercentage}/>
      </div>

      {/* Grid for metrics and challenges/risks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-2">Code Metrics</h3>
          <ul className="space-y-1 text-sm">
            <li>Lines of Code: {feature.metrics.linesOfCode ?? 'N/A'}</li>
            <li>Files Modified: {feature.metrics.filesModified?.length ?? 0}</li>
            <li>New Files: {feature.metrics.newFiles?.length ?? 0}</li>
            <li>Test Coverage: {feature.metrics.testCoverage ?? 'N/A'}%</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Challenges & Risks</h3>
          <ul className="space-y-1 text-sm">
            {/* Map over challenges, checking if the array exists */}
            {feature.qualitativeAssessment.challenges?.map((challenge, index) => (
              <li key={`challenge-${index}`} className="text-orange-600">
                {challenge}
              </li>
            ))}
            {/* Map over risks, checking if the array exists */}
            {feature.qualitativeAssessment.risks?.map((risk, index) => (
              <li key={`risk-${index}`} className="text-red-600">
                {risk}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Display notes if they exist */}
      {feature.qualitativeAssessment.notes && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Notes</h3>
          <p className="text-sm text-gray-600">
            {feature.qualitativeAssessment.notes}
          </p>
        </div>
      )}
    </div>
  );
};

// Note: The old CommonJS export and corrupted source map line are removed.
// Note: The duplicate/default exports from the previous .tsx file are also removed.
