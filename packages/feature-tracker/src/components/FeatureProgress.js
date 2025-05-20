import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { FeatureStage } from '../types.js';
const ProgressBar = ({ percentage }) => (_jsx("div", { className: "w-full h-2 bg-gray-200 rounded-full", children: _jsx("div", { className: `h-full bg-blue-500 rounded-full transition-all duration-300 w-[${percentage}%]` }) }));
const StageIndicator = ({ stage, isActive, isCompleted }) => (_jsxs("div", { className: `flex flex-col items-center ${isActive ? 'text-blue-500' : isCompleted ? 'text-green-500' : 'text-gray-400'}`, children: [_jsx("div", { className: `w-4 h-4 rounded-full ${isActive
                ? 'bg-blue-500'
                : isCompleted
                    ? 'bg-green-500'
                    : 'bg-gray-400'}` }), _jsx("span", { className: "text-sm mt-1", children: String(stage) }), " "] }));
// Export the component directly using ES Module syntax
export const FeatureProgress = ({ feature }) => {
    const stages = Object.values(FeatureStage); // Use FeatureStage directly
    const currentStageIndex = stages.indexOf(feature.currentStage);
    // Basic validation for feature object and nested properties
    if (!feature || !feature.metrics || !feature.qualitativeAssessment) {
        // Render a loading state or null if data isn't ready
        return _jsx("div", { className: "p-4 text-gray-500", children: "Loading feature data..." });
    }
    return (_jsxs("div", { className: "p-4 bg-white rounded-lg shadow", children: [_jsxs("div", { className: "mb-4", children: [_jsx("h2", { className: "text-xl font-semibold", children: feature.name }), _jsx("p", { className: "text-gray-600", children: feature.description })] }), _jsxs("div", { className: "mb-6", children: [_jsx("div", { className: "flex justify-between mb-2", children: stages.map((stage, index) => (_jsx(StageIndicator, { stage: stage, isActive: stage === feature.currentStage, isCompleted: index < currentStageIndex }, stage))) }), _jsx(ProgressBar, { percentage: feature.completionPercentage })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-semibold mb-2", children: "Code Metrics" }), _jsxs("ul", { className: "space-y-1 text-sm", children: [_jsxs("li", { children: ["Lines of Code: ", feature.metrics.linesOfCode ?? 'N/A'] }), _jsxs("li", { children: ["Files Modified: ", feature.metrics.filesModified?.length ?? 0] }), _jsxs("li", { children: ["New Files: ", feature.metrics.newFiles?.length ?? 0] }), _jsxs("li", { children: ["Test Coverage: ", feature.metrics.testCoverage ?? 'N/A', "%"] })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold mb-2", children: "Challenges & Risks" }), _jsxs("ul", { className: "space-y-1 text-sm", children: [feature.qualitativeAssessment.challenges?.map((challenge, index) => (_jsx("li", { className: "text-orange-600", children: challenge }, `challenge-${index}`))), feature.qualitativeAssessment.risks?.map((risk, index) => (_jsx("li", { className: "text-red-600", children: risk }, `risk-${index}`)))] })] })] }), feature.qualitativeAssessment.notes && (_jsxs("div", { className: "mt-4", children: [_jsx("h3", { className: "font-semibold mb-2", children: "Notes" }), _jsx("p", { className: "text-sm text-gray-600", children: feature.qualitativeAssessment.notes })] }))] }));
};
//# sourceMappingURL=FeatureProgress.js.map