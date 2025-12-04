import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useOnboarding } from '@/hooks/useOnboarding';
import { FeatureTour } from './FeatureTour';
import { GettingStartedGuide } from './GettingStartedGuide';
export var UserOnboarding = function () {
    var _a = useOnboarding(), step = _a.step, progress = _a.progress, complete = _a.complete;
    return (_jsxs(_Fragment, { children: [_jsx(FeatureTour, { currentStep: step, onComplete: complete }), _jsx(GettingStartedGuide, { progress: progress, interactive: true })] }));
};
