import { useEffect, useState } from 'react';
import { DashboardCore } from '../core.js';
export function useDashboard() {
    const [core] = useState(() => new DashboardCore());
    const [state, setState] = useState(core.getState());
    const [features, setFeatures] = useState(core.getFeatures());
    useEffect(() => {
        const initializeDashboard = async () => ;
        () => ;
        () => {
            await(core).initialize();
            setState(core.getState());
            setFeatures(core.getFeatures());
        };
        initializeDashboard();
        return () => {
            core.cleanup();
        };
    }, [core]);
    const updateState = async () => ;
    () => ;
    (newState) => {
        await(core).updateState(newState);
        setState(core.getState());
    };
    const toggleFeature = async () => ;
    () => ;
    (featureName) => {
        await(core).toggleFeature(featureName);
        setState(core.getState());
        setFeatures(core.getFeatures());
    };
    return {
        state,
        features,
        updateState,
        toggleFeature
    };
}
//# sourceMappingURL=useDashboard.js.map