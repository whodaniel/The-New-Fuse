"use strict";
/**
 * useWizard Hook
 *
 * React hook for managing wizard state and interactions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWizard = useWizard;
exports.useWizardList = useWizardList;
const react_1 = require("react");
function useWizard(options) {
    const { wizardId, userId, userRole, stateManager, onComplete, autoSave = true } = options;
    const [wizard, setWizard] = (0, react_1.useState)(null);
    const [progress, setProgress] = (0, react_1.useState)(null);
    const [currentStep, setCurrentStep] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [isValidating, setIsValidating] = (0, react_1.useState)(false);
    const [validationErrors, setValidationErrors] = (0, react_1.useState)([]);
    // Initialize wizard
    (0, react_1.useEffect)(() => {
        const wizardDef = stateManager['definitions'].get(wizardId);
        if (!wizardDef) {
            console.error(`Wizard not found: ${wizardId}`);
            setIsLoading(false);
            return;
        }
        setWizard(wizardDef);
        // Check for existing progress
        const existingProgress = stateManager.getProgress(userId, wizardId);
        if (existingProgress) {
            setProgress(existingProgress);
            const step = stateManager.getCurrentStep(userId, wizardId);
            setCurrentStep(step);
        }
        setIsLoading(false);
    }, [wizardId, userId, stateManager]);
    // Start wizard
    const start = (0, react_1.useCallback)(() => {
        if (!wizard)
            return;
        const newProgress = stateManager.startWizard(wizardId, userId, userRole);
        setProgress(newProgress);
        const step = stateManager.getCurrentStep(userId, wizardId);
        setCurrentStep(step);
    }, [wizard, wizardId, userId, userRole, stateManager]);
    // Update current step when progress changes
    (0, react_1.useEffect)(() => {
        if (!progress)
            return;
        const step = stateManager.getCurrentStep(userId, wizardId);
        setCurrentStep(step);
    }, [progress?.currentStepId, userId, wizardId, stateManager]);
    // Next step
    const next = (0, react_1.useCallback)(async () => {
        if (!progress || !wizard)
            return;
        setIsValidating(true);
        setValidationErrors([]);
        try {
            // Validate current step
            const validation = await stateManager.validateCurrentStep(userId, wizardId);
            if (!validation.valid) {
                setValidationErrors(validation.errors || ['Validation failed']);
                setIsValidating(false);
                return;
            }
            // Move to next step
            const newProgress = await stateManager.next(userId, wizardId);
            setProgress(newProgress);
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
    }, [progress, wizard, userId, wizardId, stateManager, onComplete]);
    // Previous step
    const previous = (0, react_1.useCallback)(() => {
        if (!progress || !currentStep?.previousStep)
            return;
        try {
            const newProgress = stateManager.previous(userId, wizardId);
            setProgress(newProgress);
            setValidationErrors([]);
        }
        catch (error) {
            console.error('Cannot go to previous step:', error);
        }
    }, [progress, currentStep, userId, wizardId, stateManager]);
    // Skip step
    const skip = (0, react_1.useCallback)(async () => {
        if (!progress || !currentStep?.canSkip)
            return;
        try {
            const newProgress = await stateManager.skip(userId, wizardId);
            setProgress(newProgress);
            setValidationErrors([]);
        }
        catch (error) {
            setValidationErrors([error instanceof Error ? error.message : 'Cannot skip this step']);
        }
    }, [progress, currentStep, userId, wizardId, stateManager]);
    // Reset wizard
    const reset = (0, react_1.useCallback)(() => {
        stateManager.resetWizard(userId, wizardId);
        setProgress(null);
        setCurrentStep(null);
        setValidationErrors([]);
    }, [userId, wizardId, stateManager]);
    // Update wizard data
    const updateData = (0, react_1.useCallback)((data) => {
        if (!progress)
            return;
        stateManager.updateContext(userId, wizardId, data);
        // If autoSave is enabled, update progress immediately
        if (autoSave) {
            const updatedProgress = stateManager.getProgress(userId, wizardId);
            if (updatedProgress) {
                setProgress(updatedProgress);
            }
        }
    }, [progress, userId, wizardId, stateManager, autoSave]);
    // Computed properties
    const canGoNext = !isValidating && !!currentStep;
    const canGoPrevious = !!currentStep?.previousStep;
    const canSkip = currentStep?.canSkip || false;
    const isComplete = progress?.completionPercentage === 100;
    const isFirstStep = !currentStep?.previousStep;
    const isLastStep = !currentStep?.nextStep;
    return {
        // State
        wizard,
        progress,
        currentStep,
        isLoading,
        isValidating,
        validationErrors,
        // Actions
        start,
        next,
        previous,
        skip,
        reset,
        updateData,
        // Helpers
        canGoNext,
        canGoPrevious,
        canSkip,
        isComplete,
        isFirstStep,
        isLastStep,
    };
}
function useWizardList(options) {
    const { stateManager, userId, userRole, skillLevel = 'beginner', category, userGoals = [], } = options;
    const [wizards, setWizards] = (0, react_1.useState)([]);
    const [userProgress, setUserProgress] = (0, react_1.useState)([]);
    const [suggestedWizards, setSuggestedWizards] = (0, react_1.useState)([]);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    // Load wizards and progress
    (0, react_1.useEffect)(() => {
        setIsLoading(true);
        // Get available wizards
        let availableWizards = stateManager.getAvailableWizards(userRole, skillLevel);
        // Filter by category if specified
        if (category) {
            availableWizards = availableWizards.filter((w) => w.category === category);
        }
        setWizards(availableWizards);
        // Get user progress
        const progress = stateManager.getUserProgress(userId);
        setUserProgress(progress);
        // Get suggested wizards
        const completedWizardIds = progress
            .filter((p) => p.completionPercentage === 100)
            .map((p) => p.wizardId);
        const suggested = stateManager.getSuggestedWizards(userRole, userGoals, completedWizardIds);
        setSuggestedWizards(suggested);
        setIsLoading(false);
    }, [stateManager, userId, userRole, skillLevel, category, userGoals]);
    // Get progress for a specific wizard
    const getWizardProgress = (0, react_1.useCallback)((wizardId) => {
        return userProgress.find((p) => p.wizardId === wizardId);
    }, [userProgress]);
    // Refresh progress
    const refreshProgress = (0, react_1.useCallback)(() => {
        const progress = stateManager.getUserProgress(userId);
        setUserProgress(progress);
        const completedWizardIds = progress
            .filter((p) => p.completionPercentage === 100)
            .map((p) => p.wizardId);
        const suggested = stateManager.getSuggestedWizards(userRole, userGoals, completedWizardIds);
        setSuggestedWizards(suggested);
    }, [stateManager, userId, userRole, userGoals]);
    return {
        wizards,
        userProgress,
        suggestedWizards,
        isLoading,
        getWizardProgress,
        refreshProgress,
    };
}
//# sourceMappingURL=useWizard.js.map