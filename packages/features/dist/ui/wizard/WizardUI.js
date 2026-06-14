"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WizardList = exports.Wizard = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Wizard UI Components
 *
 * React components for rendering wizard flows
 */
const react_1 = require("react");
/**
 * Main Wizard Component
 */
const Wizard = ({ wizard, userId, userRole, stateManager, onComplete, onCancel, }) => {
    const [progress, setProgress] = (0, react_1.useState)(null);
    const [currentStep, setCurrentStep] = (0, react_1.useState)(null);
    const [isValidating, setIsValidating] = (0, react_1.useState)(false);
    const [validationErrors, setValidationErrors] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        // Initialize or resume wizard
        let wizardProgress = stateManager.getProgress(userId, wizard.id);
        if (!wizardProgress) {
            wizardProgress = stateManager.startWizard(wizard.id, userId, userRole);
        }
        setProgress(wizardProgress);
        updateCurrentStep(wizardProgress);
    }, [wizard.id, userId, userRole]);
    const updateCurrentStep = (wizardProgress) => {
        const step = stateManager.getCurrentStep(userId, wizard.id);
        setCurrentStep(step);
    };
    const handleNext = async () => {
        if (!progress)
            return;
        setIsValidating(true);
        setValidationErrors([]);
        try {
            // Validate current step
            const validation = await stateManager.validateCurrentStep(userId, wizard.id);
            if (!validation.valid) {
                setValidationErrors(validation.errors || ['Validation failed']);
                setIsValidating(false);
                return;
            }
            // Move to next step
            const newProgress = await stateManager.next(userId, wizard.id);
            setProgress(newProgress);
            updateCurrentStep(newProgress);
            // Check if wizard is complete
            if (newProgress.completionPercentage === 100) {
                onComplete?.(newProgress);
            }
        }
        catch (error) {
            setValidationErrors([error instanceof Error ? error.message : 'Unknown error']);
        }
        finally {
            setIsValidating(false);
        }
    };
    const handlePrevious = () => {
        if (!progress)
            return;
        try {
            const newProgress = stateManager.previous(userId, wizard.id);
            setProgress(newProgress);
            updateCurrentStep(newProgress);
        }
        catch (error) {
            console.error('Cannot go to previous step:', error);
        }
    };
    const handleSkip = async () => {
        if (!progress)
            return;
        try {
            const newProgress = await stateManager.skip(userId, wizard.id);
            setProgress(newProgress);
            updateCurrentStep(newProgress);
        }
        catch (error) {
            setValidationErrors([error instanceof Error ? error.message : 'Cannot skip this step']);
        }
    };
    const handleCancel = () => {
        if (confirm('Are you sure you want to exit this wizard? Your progress will be saved.')) {
            onCancel?.();
        }
    };
    const updateContext = (data) => {
        stateManager.updateContext(userId, wizard.id, data);
    };
    if (!progress || !currentStep) {
        return (0, jsx_runtime_1.jsx)("div", { className: "wizard-loading", children: "Loading wizard..." });
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "wizard-container", children: [(0, jsx_runtime_1.jsx)(WizardHeader, { wizard: wizard, progress: progress, onCancel: handleCancel }), (0, jsx_runtime_1.jsx)(WizardProgress, { current: progress.completedSteps.length + 1, total: wizard.steps.length, percentage: progress.completionPercentage }), (0, jsx_runtime_1.jsx)(WizardStepContent, { step: currentStep, context: progress.context, onDataChange: updateContext, validationErrors: validationErrors }), (0, jsx_runtime_1.jsx)(WizardNavigation, { canGoPrevious: !!currentStep.previousStep, canSkip: currentStep.canSkip || false, isValidating: isValidating, isLastStep: !currentStep.nextStep, onPrevious: handlePrevious, onNext: handleNext, onSkip: handleSkip })] }));
};
exports.Wizard = Wizard;
const WizardHeader = ({ wizard, progress, onCancel }) => {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "wizard-header", children: [(0, jsx_runtime_1.jsxs)("div", { className: "wizard-header-content", children: [(0, jsx_runtime_1.jsx)("h1", { className: "wizard-title", children: wizard.name }), (0, jsx_runtime_1.jsx)("p", { className: "wizard-description", children: wizard.description }), wizard.estimatedTotalTime && ((0, jsx_runtime_1.jsxs)("div", { className: "wizard-time-estimate", children: [(0, jsx_runtime_1.jsx)("span", { className: "icon", children: "\u23F1\uFE0F" }), (0, jsx_runtime_1.jsxs)("span", { children: ["Estimated time: ", Math.ceil(wizard.estimatedTotalTime / 60), " minutes"] }), progress.estimatedTimeRemaining && ((0, jsx_runtime_1.jsxs)("span", { className: "time-remaining", children: [' ', "(", Math.ceil(progress.estimatedTimeRemaining / 60), " min remaining)"] }))] }))] }), (0, jsx_runtime_1.jsx)("button", { className: "wizard-cancel-btn", onClick: onCancel, title: "Exit wizard", children: "\u2715" })] }));
};
const WizardProgress = ({ current, total, percentage }) => {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "wizard-progress", children: [(0, jsx_runtime_1.jsx)("div", { className: "wizard-progress-bar", children: (0, jsx_runtime_1.jsx)("div", { className: "wizard-progress-fill", style: { width: `${percentage}%` } }) }), (0, jsx_runtime_1.jsxs)("div", { className: "wizard-progress-text", children: ["Step ", current, " of ", total, " (", percentage, "%)"] })] }));
};
const WizardStepContent = ({ step, context, onDataChange, validationErrors, }) => {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "wizard-step-content", children: [(0, jsx_runtime_1.jsxs)("div", { className: "wizard-step-header", children: [(0, jsx_runtime_1.jsx)("h2", { className: "wizard-step-title", children: step.title }), (0, jsx_runtime_1.jsx)("p", { className: "wizard-step-description", children: step.description }), step.estimatedTime && ((0, jsx_runtime_1.jsxs)("div", { className: "wizard-step-time", children: [(0, jsx_runtime_1.jsx)("span", { className: "icon", children: "\u23F1\uFE0F" }), (0, jsx_runtime_1.jsxs)("span", { children: [Math.ceil(step.estimatedTime / 60), " min"] })] }))] }), validationErrors.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "wizard-validation-errors", children: [(0, jsx_runtime_1.jsx)("div", { className: "error-icon", children: "\u26A0\uFE0F" }), (0, jsx_runtime_1.jsx)("div", { className: "error-messages", children: validationErrors.map((error, index) => ((0, jsx_runtime_1.jsx)("div", { className: "error-message", children: error }, index))) })] })), step.helpText && ((0, jsx_runtime_1.jsxs)("div", { className: "wizard-help-text", children: [(0, jsx_runtime_1.jsx)("span", { className: "help-icon", children: "\uD83D\uDCA1" }), (0, jsx_runtime_1.jsx)("span", { children: step.helpText })] })), step.tips && step.tips.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "wizard-tips", children: [(0, jsx_runtime_1.jsx)("div", { className: "tips-header", children: "Tips:" }), (0, jsx_runtime_1.jsx)("ul", { className: "tips-list", children: step.tips.map((tip, index) => ((0, jsx_runtime_1.jsx)("li", { children: tip }, index))) })] })), step.requirements && step.requirements.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "wizard-requirements", children: [(0, jsx_runtime_1.jsx)("div", { className: "requirements-header", children: "Requirements:" }), (0, jsx_runtime_1.jsx)("ul", { className: "requirements-list", children: step.requirements.map((req, index) => ((0, jsx_runtime_1.jsx)("li", { children: req }, index))) })] })), (0, jsx_runtime_1.jsx)("div", { className: "wizard-step-component", children: (0, jsx_runtime_1.jsx)(DynamicStepComponent, { componentName: step.component, context: context, onDataChange: onDataChange }) })] }));
};
const DynamicStepComponent = ({ componentName, context, onDataChange, }) => {
    if (!componentName) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "default-step-component", children: [(0, jsx_runtime_1.jsx)("p", { children: "Complete this step to continue." }), (0, jsx_runtime_1.jsx)("button", { onClick: () => onDataChange({ stepCompleted: true }), children: "Mark as Complete" })] }));
    }
    // In a real implementation, this would dynamically import the component
    // For now, we'll show a placeholder
    return ((0, jsx_runtime_1.jsxs)("div", { className: "step-component-placeholder", children: [(0, jsx_runtime_1.jsxs)("p", { children: ["Component: ", componentName] }), (0, jsx_runtime_1.jsxs)("p", { children: ["This is where the ", componentName, " component would be rendered."] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => onDataChange({ componentData: 'sample' }), children: "Update Step Data" })] }));
};
const WizardNavigation = ({ canGoPrevious, canSkip, isValidating, isLastStep, onPrevious, onNext, onSkip, }) => {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "wizard-navigation", children: [(0, jsx_runtime_1.jsx)("div", { className: "wizard-nav-left", children: canGoPrevious && ((0, jsx_runtime_1.jsx)("button", { className: "wizard-btn wizard-btn-secondary", onClick: onPrevious, children: "\u2190 Previous" })) }), (0, jsx_runtime_1.jsxs)("div", { className: "wizard-nav-right", children: [canSkip && ((0, jsx_runtime_1.jsx)("button", { className: "wizard-btn wizard-btn-text", onClick: onSkip, disabled: isValidating, children: "Skip" })), (0, jsx_runtime_1.jsx)("button", { className: "wizard-btn wizard-btn-primary", onClick: onNext, disabled: isValidating, children: isValidating ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("span", { className: "spinner", children: "\u23F3" }), " Validating..."] })) : isLastStep ? ('Complete') : ('Next →') })] })] }));
};
const WizardList = ({ wizards, onSelectWizard, userProgress = [], }) => {
    const getWizardProgress = (wizardId) => {
        return userProgress.find((p) => p.wizardId === wizardId);
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "wizard-list", children: [(0, jsx_runtime_1.jsx)("h2", { className: "wizard-list-title", children: "Available Guides" }), (0, jsx_runtime_1.jsx)("div", { className: "wizard-cards", children: wizards.map((wizard) => {
                    const progress = getWizardProgress(wizard.id);
                    return ((0, jsx_runtime_1.jsxs)("div", { className: "wizard-card", onClick: () => onSelectWizard(wizard), children: [(0, jsx_runtime_1.jsxs)("div", { className: "wizard-card-header", children: [(0, jsx_runtime_1.jsx)("h3", { className: "wizard-card-title", children: wizard.name }), (0, jsx_runtime_1.jsx)("span", { className: "wizard-card-category", children: wizard.category })] }), (0, jsx_runtime_1.jsx)("p", { className: "wizard-card-description", children: wizard.description }), wizard.estimatedTotalTime && ((0, jsx_runtime_1.jsxs)("div", { className: "wizard-card-meta", children: [(0, jsx_runtime_1.jsx)("span", { className: "icon", children: "\u23F1\uFE0F" }), (0, jsx_runtime_1.jsxs)("span", { children: [Math.ceil(wizard.estimatedTotalTime / 60), " min"] })] })), wizard.tags && ((0, jsx_runtime_1.jsx)("div", { className: "wizard-card-tags", children: wizard.tags.slice(0, 3).map((tag) => ((0, jsx_runtime_1.jsx)("span", { className: "wizard-tag", children: tag }, tag))) })), progress && ((0, jsx_runtime_1.jsxs)("div", { className: "wizard-card-progress", children: [(0, jsx_runtime_1.jsx)("div", { className: "progress-bar", children: (0, jsx_runtime_1.jsx)("div", { className: "progress-fill", style: { width: `${progress.completionPercentage}%` } }) }), (0, jsx_runtime_1.jsxs)("span", { className: "progress-text", children: [progress.completionPercentage, "% complete"] })] })), (0, jsx_runtime_1.jsxs)("button", { className: "wizard-card-btn", children: [progress ? 'Continue' : 'Start', " \u2192"] })] }, wizard.id));
                }) })] }));
};
exports.WizardList = WizardList;
exports.default = exports.Wizard;
//# sourceMappingURL=WizardUI.js.map