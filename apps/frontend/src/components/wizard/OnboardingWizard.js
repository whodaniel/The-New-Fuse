var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Button, Card } from '@the-new-fuse/ui-consolidated';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useWizard } from './WizardProvider';
import { WelcomeStep } from './steps/WelcomeStep';
import { UserProfileStep } from './steps/UserProfileStep';
import { AIPreferencesStep } from './steps/AIPreferencesStep';
import { WorkspaceSetupStep } from './steps/WorkspaceSetupStep';
import { ToolsSelectionStep } from './steps/ToolsSelectionStep';
import { GreeterAgentStep } from './steps/GreeterAgentStep';
import { CompletionStep } from './steps/CompletionStep';
export var OnboardingWizard = function (_a) {
    var _b;
    var userType = _a.userType, onComplete = _a.onComplete;
    var _c = useWizard(), state = _c.state, dispatch = _c.dispatch;
    var _d = useState(false), loading = _d[0], setLoading = _d[1];
    var _e = useState(0), activeStep = _e[0], setActiveStep = _e[1];
    // Define steps based on user type
    var humanSteps = [
        { label: 'Welcome', component: WelcomeStep },
        { label: 'Your Profile', component: UserProfileStep },
        { label: 'AI Preferences', component: AIPreferencesStep },
        { label: 'Workspace Setup', component: WorkspaceSetupStep },
        { label: 'Tools & Integrations', component: ToolsSelectionStep },
        { label: 'Meet Your Assistant', component: GreeterAgentStep },
        { label: 'Complete', component: CompletionStep }
    ];
    var aiAgentSteps = [
        { label: 'Welcome', component: WelcomeStep },
        { label: 'Agent Profile', component: UserProfileStep },
        { label: 'Capabilities', component: AIPreferencesStep },
        { label: 'Integration Setup', component: WorkspaceSetupStep },
        { label: 'Complete', component: CompletionStep }
    ];
    // Select steps based on user type
    var steps = userType === 'ai_agent' ? aiAgentSteps : humanSteps;
    useEffect(function () {
        setActiveStep(state.currentStep);
    }, [state.currentStep]);
    useEffect(function () {
        // Initialize wizard session
        var initSession = function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                setLoading(true);
                try {
                    dispatch({
                        type: 'INITIALIZE_SESSION',
                        payload: {
                            userType: userType,
                            startTime: new Date(),
                            data: {}
                        }
                    });
                }
                catch (error) {
                    console.error('Failed to initialize wizard:', error);
                    dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize onboarding wizard' });
                }
                finally {
                    setLoading(false);
                }
                return [2 /*return*/];
            });
        }); };
        if (!state.isInitialized) {
            initSession();
        }
    }, [dispatch, state.isInitialized, userType]);
    var handleNext = function () {
        if (activeStep < steps.length - 1) {
            dispatch({ type: 'SET_STEP', payload: activeStep + 1 });
        }
    };
    var handleBack = function () {
        if (activeStep > 0) {
            dispatch({ type: 'SET_STEP', payload: activeStep - 1 });
        }
    };
    var handleComplete = function () {
        var _a;
        // Collect all data from the wizard state
        var userData = __assign(__assign({}, (_a = state.session) === null || _a === void 0 ? void 0 : _a.data), { completedAt: new Date() });
        // Call the onComplete callback
        onComplete(userData);
    };
    if (loading) {
        return (_jsx("div", { className: "flex justify-center items-center min-h-96", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" }) }));
    }
    var CurrentStepComponent = ((_b = steps[activeStep]) === null || _b === void 0 ? void 0 : _b.component) || WelcomeStep;
    var isFirstStep = activeStep === 0;
    var isLastStep = activeStep === steps.length - 1;
    return (_jsx("div", { className: "max-w-4xl mx-auto py-8", children: _jsxs(Card, { className: "rounded-lg shadow-md p-6", children: [_jsx("h4", { className: "text-2xl font-bold mb-6 text-center", children: userType === 'ai_agent' ? 'AI Agent Onboarding' : 'Welcome to The New Fuse' }), _jsx("div", { className: "mb-8", children: _jsx("div", { className: "flex items-center justify-between", children: steps.map(function (step, index) { return (_jsxs("div", { className: "flex items-center", children: [_jsxs("div", { className: "flex flex-col items-center", children: [_jsx("div", { className: "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ".concat(index < activeStep
                                                ? 'bg-blue-500 text-white'
                                                : index === activeStep
                                                    ? 'bg-blue-100 text-blue-600 border-2 border-blue-500'
                                                    : 'bg-gray-200 text-gray-500'), children: index < activeStep ? (_jsx(Check, { className: "w-4 h-4" })) : (_jsx("span", { children: index + 1 })) }), _jsx("span", { className: "text-xs mt-1 text-center max-w-20", children: step.label })] }), index < steps.length - 1 && (_jsx("div", { className: "flex-1 h-0.5 mx-2 ".concat(index < activeStep ? 'bg-blue-500' : 'bg-gray-200') }))] }, step.label)); }) }) }), _jsx("div", { className: "mb-6", children: _jsx(CurrentStepComponent, {}) }), _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsx("div", { children: !isFirstStep && (_jsxs(Button, { onClick: handleBack, variant: "outline", className: "flex items-center space-x-2", children: [_jsx(ChevronLeft, { className: "w-4 h-4" }), _jsx("span", { children: "Back" })] })) }), _jsx("div", { className: "text-center", children: _jsxs("p", { className: "text-sm text-gray-500", children: ["Step ", activeStep + 1, " of ", steps.length] }) }), _jsx("div", { className: "text-right", children: isLastStep ? (_jsx(Button, { onClick: handleComplete, children: "Complete" })) : (_jsxs(Button, { onClick: handleNext, className: "flex items-center space-x-2", children: [_jsx("span", { children: "Next" }), _jsx(ChevronRight, { className: "w-4 h-4" })] })) })] })] }) }));
};
