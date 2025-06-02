"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureTrackingExample = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const types_js_1 = require("../types.js");
const useFeatureTracker_js_1 = require("../hooks/useFeatureTracker.js");
const FeatureProgress_js_1 = require("../components/FeatureProgress.js");
const FeatureTrackingExample = () => {
    const { feature, initializeFeature, updateStage, updateMetrics, updateQualitativeAssessment, } = (0, useFeatureTracker_js_1.useFeatureTracker)('auth-001');
    (0, react_1.useEffect)(() => {
        if (!feature) {
            initializeFeature('User Authentication', 'Implement secure user authentication with JWT', ['database-001']);
        }
    }, [feature, initializeFeature]);
    const handleStageUpdate = (stage) => {
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
        return (0, jsx_runtime_1.jsx)("div", { children: "Loading..." });
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "max-w-4xl mx-auto p-4", children: [(0, jsx_runtime_1.jsx)(FeatureProgress_js_1.FeatureProgress, { feature: feature }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-8 space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-semibold mb-2", children: "Update Stage" }), (0, jsx_runtime_1.jsx)("select", { className: "border rounded p-2", value: feature.currentStage, onChange: (e) => handleStageUpdate(e.target.value), "aria-label": "Select feature stage", children: Object.values(types_js_1.FeatureStage).map((stage) => ((0, jsx_runtime_1.jsx)("option", { value: stage, children: stage }, stage))) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-semibold mb-2", children: "Actions" }), (0, jsx_runtime_1.jsxs)("div", { className: "space-x-4", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", className: "bg-blue-500 text-white px-4 py-2 rounded", onClick: handleMetricsUpdate, children: "Update Metrics" }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "bg-green-500 text-white px-4 py-2 rounded", onClick: handleAssessmentUpdate, children: "Update Assessment" })] })] })] })] }));
};
exports.FeatureTrackingExample = FeatureTrackingExample;
