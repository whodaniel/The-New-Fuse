import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store';
export var FeatureTour = function () {
    var _a = useState(0), currentStep = _a[0], setCurrentStep = _a[1];
    var setTourComplete = useStore(function (state) { return state.onboarding; }).setTourComplete;
    var tourSteps = [
        {
            target: '#ai-assistant',
            title: 'AI Assistant',
            description: 'Get intelligent code suggestions and autocompletion',
            position: 'right'
        },
        {
            target: '#collaboration',
            title: 'Real-time Collaboration',
            description: 'Work together with your team in real-time',
            position: 'bottom'
        },
        {
            target: '#dev-tools',
            title: 'Developer Tools',
            description: 'Access powerful debugging and monitoring tools',
            position: 'left'
        }
    ];
    var handleStepComplete = function () {
        if (currentStep < tourSteps.length - 1) {
            setCurrentStep(function (curr) { return curr + 1; });
        }
        else {
            setTourComplete();
        }
    };
    return (_jsx(AnimatePresence, { children: tourSteps.map(function (step, index) { return (currentStep === index && (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, className: "tour-tooltip ".concat(step.position), style: { position: 'absolute' }, children: [_jsx("h3", { children: step.title }), _jsx("p", { children: step.description }), _jsx("button", { onClick: handleStepComplete, children: index === tourSteps.length - 1 ? 'Finish' : 'Next' })] }, step.target))); }) }));
};
