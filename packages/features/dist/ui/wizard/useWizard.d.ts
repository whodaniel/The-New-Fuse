/**
 * useWizard Hook
 *
 * React hook for managing wizard state and interactions
 */
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
    wizard: WizardDefinition | null;
    progress: WizardProgress | null;
    currentStep: WizardStep | null;
    isLoading: boolean;
    isValidating: boolean;
    validationErrors: string[];
    start: () => void;
    next: () => Promise<void>;
    previous: () => void;
    skip: () => Promise<void>;
    reset: () => void;
    updateData: (data: Record<string, unknown>) => void;
    canGoNext: boolean;
    canGoPrevious: boolean;
    canSkip: boolean;
    isComplete: boolean;
    isFirstStep: boolean;
    isLastStep: boolean;
}
export declare function useWizard(options: UseWizardOptions): UseWizardReturn;
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
export declare function useWizardList(options: UseWizardListOptions): UseWizardListReturn;
//# sourceMappingURL=useWizard.d.ts.map