import { useState, useCallback, useEffect } from 'react';
import { FeatureTracker } from '../FeatureTracker.js';
export const useFeatureTracker = (featureId) => {
    const [tracker] = useState(() => new FeatureTracker());
    const [feature, setFeature] = useState(null);
    useEffect(() => {
        try {
            const existingFeature = tracker.getFeature(featureId);
            setFeature(existingFeature);
        }
        catch (error) {
            setFeature(null);
        }
    }, [featureId, tracker]);
    const initializeFeature = useCallback((name, description, dependencies = []) => {
        const newFeature = tracker.createFeature(featureId, name, description, dependencies);
        setFeature(newFeature);
        return newFeature;
    }, [featureId, tracker]);
    const updateStage = useCallback((newStage) => {
        if (!feature)
            return;
        const updated = tracker.updateStage(featureId, newStage);
        setFeature(updated);
        return updated;
    }, [featureId, feature, tracker]);
    const updateMetrics = useCallback((metrics) => {
        if (!feature)
            return;
        const updated = tracker.updateMetrics(featureId, metrics);
        setFeature(updated);
        return updated;
    }, [featureId, feature, tracker]);
    const updateQualitativeAssessment = useCallback((assessment) => {
        if (!feature)
            return;
        const updated = tracker.updateQualitativeAssessment(featureId, assessment);
        setFeature(updated);
        return updated;
    }, [featureId, feature, tracker]);
    const getProgressSummary = useCallback(() => {
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
//# sourceMappingURL=useFeatureTracker.js.map