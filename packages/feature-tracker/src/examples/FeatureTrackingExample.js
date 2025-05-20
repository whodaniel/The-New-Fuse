import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect } from "react";
import { FeatureStage } from '../types.js';
import { useFeatureTracker } from '../hooks/useFeatureTracker.js';
import { FeatureProgress } from '../components/FeatureProgress.js';
export const FeatureTrackingExample = () => {
    const { feature, initializeFeature, updateStage, updateMetrics, updateQualitativeAssessment, } = useFeatureTracker('auth-001');
    useEffect(() => {
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
        return _jsx("div", { children: "Loading..." });
    }
    return (_jsxs("div", { className: "max-w-4xl mx-auto p-4", children: [_jsx(FeatureProgress, { feature: feature }), _jsxs("div", { className: "mt-8 space-y-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-semibold mb-2", children: "Update Stage" }), _jsx("select", { className: "border rounded p-2", value: feature.currentStage, onChange: (e) => handleStageUpdate(e.target.value), "aria-label": "Select feature stage", children: Object.values(FeatureStage).map((stage) => (_jsx("option", { value: stage, children: stage }, stage))) })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold mb-2", children: "Actions" }), _jsxs("div", { className: "space-x-4", children: [_jsx("button", { type: "button", className: "bg-blue-500 text-white px-4 py-2 rounded", onClick: handleMetricsUpdate, children: "Update Metrics" }), _jsx("button", { type: "button", className: "bg-green-500 text-white px-4 py-2 rounded", onClick: handleAssessmentUpdate, children: "Update Assessment" })] })] })] })] }));
};
//# sourceMappingURL=FeatureTrackingExample.js.map