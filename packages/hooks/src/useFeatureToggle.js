import { useContext } from 'react';
import { FeatureToggleContext } from './types/index';
export const useFeatureToggle = () => {
    const context = useContext(FeatureToggleContext);
    if (!context) {
        throw new Error('useFeatureToggle must be used within a FeatureToggleProvider');
    }
    return context;
};
//# sourceMappingURL=useFeatureToggle.js.map