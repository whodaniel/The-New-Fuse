import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { UserTypeDetection } from '../../components/onboarding/UserTypeDetection';
import { OnboardingWizard } from '../../components/wizard/OnboardingWizard';
import { WizardProvider } from '../../components/wizard/WizardProvider';
import { useNavigate } from 'react-router-dom';
export var OnboardingFlow = function () {
    var navigate = useNavigate();
    var _a = useState(null), userType = _a[0], setUserType = _a[1];
    var handleDetectionComplete = function (detectedUserType) {
        setUserType(detectedUserType);
    };
    var handleOnboardingComplete = function (userData) {
        console.log("".concat(userType === 'ai_agent' ? 'AI agent' : 'Human', " onboarding complete:"), userData);
        // Navigate to the appropriate page based on user type
        if (userType === 'ai_agent') {
            navigate('/ai-portal');
        }
        else {
            navigate('/dashboard');
        }
    };
    return (_jsx("div", { className: "max-w-7xl mx-auto py-8", children: userType === null ? (_jsx("div", { className: "bg-white rounded-lg shadow-md p-6", children: _jsx(UserTypeDetection, { onDetectionComplete: handleDetectionComplete }) })) : (_jsx(WizardProvider, { children: _jsx(OnboardingWizard, { userType: userType, onComplete: handleOnboardingComplete }) })) }));
};
export default OnboardingFlow;
