"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useFeatureTracker = void 0;
const react_1 = require("react");
const FeatureTracker_js_1 = require("../FeatureTracker.js");
const useFeatureTracker = (featureId) => {
    const [tracker] = (0, react_1.useState)(() => new FeatureTracker_js_1.FeatureTracker());
    const [feature, setFeature] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        try {
            const existingFeature = tracker.getFeature(featureId);
            setFeature(existingFeature);
        }
        catch (error) {
            setFeature(null);
        }
    }, [featureId, tracker]);
    const initializeFeature = (0, react_1.useCallback)((name, description, dependencies = []) => {
        const newFeature = tracker.createFeature(featureId, name, description, dependencies);
        setFeature(newFeature);
        return newFeature;
    }, [featureId, tracker]);
    const updateStage = (0, react_1.useCallback)((newStage) => {
        if (!feature)
            return;
        const updated = tracker.updateStage(featureId, newStage);
        setFeature(updated);
        return updated;
    }, [featureId, feature, tracker]);
    const updateMetrics = (0, react_1.useCallback)((metrics) => {
        if (!feature)
            return;
        const updated = tracker.updateMetrics(featureId, metrics);
        setFeature(updated);
        return updated;
    }, [featureId, feature, tracker]);
    const updateQualitativeAssessment = (0, react_1.useCallback)((assessment) => {
        if (!feature)
            return;
        const updated = tracker.updateQualitativeAssessment(featureId, assessment);
        setFeature(updated);
        return updated;
    }, [featureId, feature, tracker]);
    const getProgressSummary = (0, react_1.useCallback)(() => {
        if (!feature)
            return '';
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
exports.useFeatureTracker = useFeatureTracker;
