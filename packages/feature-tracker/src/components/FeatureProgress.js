"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureProgress = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const types_js_1 = require("../types.js");
const ProgressBar = ({ percentage }) => ((0, jsx_runtime_1.jsx)("div", { className: "w-full h-2 bg-gray-200 rounded-full", children: (0, jsx_runtime_1.jsx)("div", { className: `h-full bg-blue-500 rounded-full transition-all duration-300 w-[${percentage}%]` }) }));
const StageIndicator = ({ stage, isActive, isCompleted }) => ((0, jsx_runtime_1.jsxs)("div", { className: `flex flex-col items-center ${isActive ? 'text-blue-500' : isCompleted ? 'text-green-500' : 'text-gray-400'}`, children: [(0, jsx_runtime_1.jsx)("div", { className: `w-4 h-4 rounded-full ${isActive
                ? 'bg-blue-500'
                : isCompleted
                    ? 'bg-green-500'
                    : 'bg-gray-400'}` }), (0, jsx_runtime_1.jsx)("span", { className: "text-sm mt-1", children: String(stage) }), " "] }));
// Export the component directly using ES Module syntax
const FeatureProgress = ({ feature }) => {
    const stages = Object.values(types_js_1.FeatureStage); // Use FeatureStage directly
    const currentStageIndex = stages.indexOf(feature.currentStage);
    // Basic validation for feature object and nested properties
    if (!feature || !feature.metrics || !feature.qualitativeAssessment) {
        // Render a loading state or null if data isn't ready
        return (0, jsx_runtime_1.jsx)("div", { className: "p-4 text-gray-500", children: "Loading feature data..." });
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "p-4 bg-white rounded-lg shadow", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-4", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-semibold", children: feature.name }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600", children: feature.description })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mb-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex justify-between mb-2", children: stages.map((stage, index) => ((0, jsx_runtime_1.jsx)(StageIndicator, { stage: stage, isActive: stage === feature.currentStage, isCompleted: index < currentStageIndex }, stage))) }), (0, jsx_runtime_1.jsx)(ProgressBar, { percentage: feature.completionPercentage })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-semibold mb-2", children: "Code Metrics" }), (0, jsx_runtime_1.jsxs)("ul", { className: "space-y-1 text-sm", children: [(0, jsx_runtime_1.jsxs)("li", { children: ["Lines of Code: ", feature.metrics.linesOfCode ?? 'N/A'] }), (0, jsx_runtime_1.jsxs)("li", { children: ["Files Modified: ", feature.metrics.filesModified?.length ?? 0] }), (0, jsx_runtime_1.jsxs)("li", { children: ["New Files: ", feature.metrics.newFiles?.length ?? 0] }), (0, jsx_runtime_1.jsxs)("li", { children: ["Test Coverage: ", feature.metrics.testCoverage ?? 'N/A', "%"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-semibold mb-2", children: "Challenges & Risks" }), (0, jsx_runtime_1.jsxs)("ul", { className: "space-y-1 text-sm", children: [feature.qualitativeAssessment.challenges?.map((challenge, index) => ((0, jsx_runtime_1.jsx)("li", { className: "text-orange-600", children: challenge }, `challenge-${index}`))), feature.qualitativeAssessment.risks?.map((risk, index) => ((0, jsx_runtime_1.jsx)("li", { className: "text-red-600", children: risk }, `risk-${index}`)))] })] })] }), feature.qualitativeAssessment.notes && ((0, jsx_runtime_1.jsxs)("div", { className: "mt-4", children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-semibold mb-2", children: "Notes" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-600", children: feature.qualitativeAssessment.notes })] }))] }));
};
exports.FeatureProgress = FeatureProgress;
//# sourceMappingURL=FeatureProgress.js.map