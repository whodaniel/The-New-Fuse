/**
 * Wizard System - Interactive User Guidance
 *
 * Provides context-aware, goal-oriented guidance to help users accomplish their tasks.
 * Features:
 * - Multi-step workflows with branching logic
 * - Context-aware suggestions
 * - Progress tracking
 * - Dynamic step generation
 * - State management
 * - Validation and error handling
 */
export interface WizardStep {
    id: string;
    title: string;
    description: string;
    component?: string;
    validation?: (context: WizardContext) => Promise<ValidationResult>;
    onComplete?: (context: WizardContext) => Promise<void>;
    onSkip?: (context: WizardContext) => Promise<void>;
    canSkip?: boolean;
    nextStep?: string | ((context: WizardContext) => string | null);
    previousStep?: string;
    estimatedTime?: number;
    helpText?: string;
    tips?: string[];
    requirements?: string[];
}
export interface WizardContext {
    userId: string;
    userRole: string;
    goal: string;
    data: Record<string, unknown>;
    completedSteps: string[];
    skippedSteps: string[];
    currentStep: string;
    startedAt: Date;
    metadata: Record<string, unknown>;
}
export interface ValidationResult {
    valid: boolean;
    errors?: string[];
    warnings?: string[];
    suggestions?: string[];
}
export interface WizardDefinition {
    id: string;
    name: string;
    description: string;
    category: string;
    goal: string;
    targetAudience: ('beginner' | 'intermediate' | 'advanced' | 'all')[];
    steps: WizardStep[];
    estimatedTotalTime?: number;
    prerequisites?: string[];
    outcomes?: string[];
    tags?: string[];
}
export interface WizardProgress {
    wizardId: string;
    userId: string;
    currentStepId: string;
    completedSteps: string[];
    skippedSteps: string[];
    context: WizardContext;
    startedAt: Date;
    lastActivityAt: Date;
    completionPercentage: number;
    estimatedTimeRemaining?: number;
}
/**
 * Wizard State Manager
 * Manages the state and progression of wizard flows
 */
export declare class WizardStateManager {
    private progress;
    private definitions;
    /**
     * Register a wizard definition
     */
    registerWizard(definition: WizardDefinition): void;
    /**
     * Start a new wizard session
     */
    startWizard(wizardId: string, userId: string, userRole: string, initialData?: Record<string, unknown>): WizardProgress;
    /**
     * Get current wizard progress
     */
    getProgress(userId: string, wizardId: string): WizardProgress | null;
    /**
     * Get current step
     */
    getCurrentStep(userId: string, wizardId: string): WizardStep | null;
    /**
     * Validate current step
     */
    validateCurrentStep(userId: string, wizardId: string): Promise<ValidationResult>;
    /**
     * Move to next step
     */
    next(userId: string, wizardId: string): Promise<WizardProgress>;
    /**
     * Skip current step
     */
    skip(userId: string, wizardId: string): Promise<WizardProgress>;
    /**
     * Go to previous step
     */
    previous(userId: string, wizardId: string): WizardProgress;
    /**
     * Update wizard context data
     */
    updateContext(userId: string, wizardId: string, data: Record<string, unknown>): void;
    /**
     * Calculate completion percentage
     */
    private calculateCompletionPercentage;
    /**
     * Reset wizard progress
     */
    resetWizard(userId: string, wizardId: string): void;
    /**
     * Get all available wizards for a user
     */
    getAvailableWizards(userRole: string, skillLevel: 'beginner' | 'intermediate' | 'advanced'): WizardDefinition[];
    /**
     * Get wizard suggestions based on user context
     */
    getSuggestedWizards(userRole: string, userGoals: string[], completedWizards: string[]): WizardDefinition[];
    /**
     * Get all user progress
     */
    getUserProgress(userId: string): WizardProgress[];
}
/**
 * Wizard Factory
 * Helper to create wizard definitions
 */
export declare class WizardBuilder {
    private definition;
    constructor(id: string, name: string);
    description(desc: string): this;
    category(cat: string): this;
    goal(g: string): this;
    targetAudience(audience: ('beginner' | 'intermediate' | 'advanced' | 'all')[]): this;
    addStep(step: WizardStep): this;
    estimatedTime(minutes: number): this;
    prerequisites(prereqs: string[]): this;
    outcomes(outcomes: string[]): this;
    tags(tags: string[]): this;
    build(): WizardDefinition;
}
//# sourceMappingURL=WizardSystem.d.ts.map