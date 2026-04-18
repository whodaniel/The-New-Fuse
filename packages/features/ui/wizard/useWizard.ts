/**
 * useWizard Hook
 *
 * React hook for managing wizard state and interactions
 */

import { useCallback, useEffect, useState } from 'react';
import { WizardDefinition, WizardProgress, WizardStateManager, WizardStep } from './WizardSystem.js';

export interface UseWizardOptions {
  wizardId: string;
  userId: string;
  userRole: string;
  stateManager: WizardStateManager;
  onComplete?: (progress: WizardProgress) => void;
  autoSave?: boolean;
}

export interface UseWizardReturn {
  // State
  wizard: WizardDefinition | null;
  progress: WizardProgress | null;
  currentStep: WizardStep | null;
  isLoading: boolean;
  isValidating: boolean;
  validationErrors: string[];

  // Actions
  start: () => void;
  next: () => Promise<void>;
  previous: () => void;
  skip: () => Promise<void>;
  reset: () => void;
  updateData: (data: Record<string, unknown>) => void;

  // Helpers
  canGoNext: boolean;
  canGoPrevious: boolean;
  canSkip: boolean;
  isComplete: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export function useWizard(options: UseWizardOptions): UseWizardReturn {
  const { wizardId, userId, userRole, stateManager, onComplete, autoSave = true } = options;

  const [wizard, setWizard] = useState<WizardDefinition | null>(null);
  const [progress, setProgress] = useState<WizardProgress | null>(null);
  const [currentStep, setCurrentStep] = useState<WizardStep | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Initialize wizard
  useEffect(() => {
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
  const start = useCallback(() => {
    if (!wizard) return;

    const newProgress = stateManager.startWizard(wizardId, userId, userRole);
    setProgress(newProgress);

    const step = stateManager.getCurrentStep(userId, wizardId);
    setCurrentStep(step);
  }, [wizard, wizardId, userId, userRole, stateManager]);

  // Update current step when progress changes
  useEffect(() => {
    if (!progress) return;

    const step = stateManager.getCurrentStep(userId, wizardId);
    setCurrentStep(step);
  }, [progress?.currentStepId, userId, wizardId, stateManager]);

  // Next step
  const next = useCallback(async () => {
    if (!progress || !wizard) return;

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
    } catch (error) {
      setValidationErrors([error instanceof Error ? error.message : 'Unknown error']);
    } finally {
      setIsValidating(false);
    }
  }, [progress, wizard, userId, wizardId, stateManager, onComplete]);

  // Previous step
  const previous = useCallback(() => {
    if (!progress || !currentStep?.previousStep) return;

    try {
      const newProgress = stateManager.previous(userId, wizardId);
      setProgress(newProgress);
      setValidationErrors([]);
    } catch (error) {
      console.error('Cannot go to previous step:', error);
    }
  }, [progress, currentStep, userId, wizardId, stateManager]);

  // Skip step
  const skip = useCallback(async () => {
    if (!progress || !currentStep?.canSkip) return;

    try {
      const newProgress = await stateManager.skip(userId, wizardId);
      setProgress(newProgress);
      setValidationErrors([]);
    } catch (error) {
      setValidationErrors([error instanceof Error ? error.message : 'Cannot skip this step']);
    }
  }, [progress, currentStep, userId, wizardId, stateManager]);

  // Reset wizard
  const reset = useCallback(() => {
    stateManager.resetWizard(userId, wizardId);
    setProgress(null);
    setCurrentStep(null);
    setValidationErrors([]);
  }, [userId, wizardId, stateManager]);

  // Update wizard data
  const updateData = useCallback(
    (data: Record<string, unknown>) => {
      if (!progress) return;

      stateManager.updateContext(userId, wizardId, data);

      // If autoSave is enabled, update progress immediately
      if (autoSave) {
        const updatedProgress = stateManager.getProgress(userId, wizardId);
        if (updatedProgress) {
          setProgress(updatedProgress);
        }
      }
    },
    [progress, userId, wizardId, stateManager, autoSave]
  );

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

/**
 * useWizardList Hook
 *
 * Hook for managing a list of available wizards
 */
export interface UseWizardListOptions {
  stateManager: WizardStateManager;
  userId: string;
  userRole: string;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
  userGoals?: string[];
}

export interface UseWizardListReturn {
  wizards: WizardDefinition[];
  userProgress: WizardProgress[];
  suggestedWizards: WizardDefinition[];
  isLoading: boolean;
  getWizardProgress: (wizardId: string) => WizardProgress | undefined;
  refreshProgress: () => void;
}

export function useWizardList(options: UseWizardListOptions): UseWizardListReturn {
  const {
    stateManager,
    userId,
    userRole,
    skillLevel = 'beginner',
    category,
    userGoals = [],
  } = options;

  const [wizards, setWizards] = useState<WizardDefinition[]>([]);
  const [userProgress, setUserProgress] = useState<WizardProgress[]>([]);
  const [suggestedWizards, setSuggestedWizards] = useState<WizardDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load wizards and progress
  useEffect(() => {
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
  const getWizardProgress = useCallback(
    (wizardId: string): WizardProgress | undefined => {
      return userProgress.find((p) => p.wizardId === wizardId);
    },
    [userProgress]
  );

  // Refresh progress
  const refreshProgress = useCallback(() => {
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
