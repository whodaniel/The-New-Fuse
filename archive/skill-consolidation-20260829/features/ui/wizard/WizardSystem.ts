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
  component?: string; // Component name to render
  validation?: (context: WizardContext) => Promise<ValidationResult>;
  onComplete?: (context: WizardContext) => Promise<void>;
  onSkip?: (context: WizardContext) => Promise<void>;
  canSkip?: boolean;
  nextStep?: string | ((context: WizardContext) => string | null);
  previousStep?: string;
  estimatedTime?: number; // in seconds
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
export class WizardStateManager {
  private progress: Map<string, WizardProgress> = new Map();
  private definitions: Map<string, WizardDefinition> = new Map();

  /**
   * Register a wizard definition
   */
  registerWizard(definition: WizardDefinition): void {
    this.definitions.set(definition.id, definition);
  }

  /**
   * Start a new wizard session
   */
  startWizard(
    wizardId: string,
    userId: string,
    userRole: string,
    initialData?: Record<string, unknown>
  ): WizardProgress {
    const definition = this.definitions.get(wizardId);
    if (!definition) {
      throw new Error(`Wizard not found: ${wizardId}`);
    }

    const firstStep = definition.steps[0];
    if (!firstStep) {
      throw new Error(`Wizard has no steps: ${wizardId}`);
    }

    const context: WizardContext = {
      userId,
      userRole,
      goal: definition.goal,
      data: initialData || {},
      completedSteps: [],
      skippedSteps: [],
      currentStep: firstStep.id,
      startedAt: new Date(),
      metadata: {},
    };

    const progress: WizardProgress = {
      wizardId,
      userId,
      currentStepId: firstStep.id,
      completedSteps: [],
      skippedSteps: [],
      context,
      startedAt: new Date(),
      lastActivityAt: new Date(),
      completionPercentage: 0,
      estimatedTimeRemaining: definition.estimatedTotalTime,
    };

    const progressKey = `${userId}:${wizardId}`;
    this.progress.set(progressKey, progress);

    return progress;
  }

  /**
   * Get current wizard progress
   */
  getProgress(userId: string, wizardId: string): WizardProgress | null {
    const progressKey = `${userId}:${wizardId}`;
    return this.progress.get(progressKey) || null;
  }

  /**
   * Get current step
   */
  getCurrentStep(userId: string, wizardId: string): WizardStep | null {
    const progress = this.getProgress(userId, wizardId);
    if (!progress) return null;

    const definition = this.definitions.get(wizardId);
    if (!definition) return null;

    return definition.steps.find((s) => s.id === progress.currentStepId) || null;
  }

  /**
   * Validate current step
   */
  async validateCurrentStep(userId: string, wizardId: string): Promise<ValidationResult> {
    const progress = this.getProgress(userId, wizardId);
    if (!progress) {
      return { valid: false, errors: ['No wizard progress found'] };
    }

    const step = this.getCurrentStep(userId, wizardId);
    if (!step) {
      return { valid: false, errors: ['Current step not found'] };
    }

    if (step.validation) {
      return await step.validation(progress.context);
    }

    return { valid: true };
  }

  /**
   * Move to next step
   */
  async next(userId: string, wizardId: string): Promise<WizardProgress> {
    const progress = this.getProgress(userId, wizardId);
    if (!progress) {
      throw new Error('No wizard progress found');
    }

    const definition = this.definitions.get(wizardId);
    if (!definition) {
      throw new Error('Wizard definition not found');
    }

    const currentStep = this.getCurrentStep(userId, wizardId);
    if (!currentStep) {
      throw new Error('Current step not found');
    }

    // Validate current step
    const validation = await this.validateCurrentStep(userId, wizardId);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors?.join(', ')}`);
    }

    // Execute onComplete hook
    if (currentStep.onComplete) {
      await currentStep.onComplete(progress.context);
    }

    // Mark current step as completed
    progress.completedSteps.push(currentStep.id);
    progress.context.completedSteps.push(currentStep.id);

    // Determine next step
    let nextStepId: string | null = null;

    if (typeof currentStep.nextStep === 'function') {
      nextStepId = currentStep.nextStep(progress.context);
    } else if (typeof currentStep.nextStep === 'string') {
      nextStepId = currentStep.nextStep;
    } else {
      // Find next step by index
      const currentIndex = definition.steps.findIndex((s) => s.id === currentStep.id);
      if (currentIndex < definition.steps.length - 1) {
        nextStepId = definition.steps[currentIndex + 1].id;
      }
    }

    if (!nextStepId) {
      // Wizard complete
      progress.completionPercentage = 100;
      progress.lastActivityAt = new Date();
      return progress;
    }

    // Update progress
    progress.currentStepId = nextStepId;
    progress.context.currentStep = nextStepId;
    progress.lastActivityAt = new Date();
    progress.completionPercentage = this.calculateCompletionPercentage(progress, definition);

    return progress;
  }

  /**
   * Skip current step
   */
  async skip(userId: string, wizardId: string): Promise<WizardProgress> {
    const progress = this.getProgress(userId, wizardId);
    if (!progress) {
      throw new Error('No wizard progress found');
    }

    const currentStep = this.getCurrentStep(userId, wizardId);
    if (!currentStep) {
      throw new Error('Current step not found');
    }

    if (!currentStep.canSkip) {
      throw new Error('Current step cannot be skipped');
    }

    // Execute onSkip hook
    if (currentStep.onSkip) {
      await currentStep.onSkip(progress.context);
    }

    // Mark as skipped
    progress.skippedSteps.push(currentStep.id);
    progress.context.skippedSteps.push(currentStep.id);

    // Move to next step (same logic as next())
    return await this.next(userId, wizardId);
  }

  /**
   * Go to previous step
   */
  previous(userId: string, wizardId: string): WizardProgress {
    const progress = this.getProgress(userId, wizardId);
    if (!progress) {
      throw new Error('No wizard progress found');
    }

    const currentStep = this.getCurrentStep(userId, wizardId);
    if (!currentStep || !currentStep.previousStep) {
      throw new Error('Cannot go to previous step');
    }

    progress.currentStepId = currentStep.previousStep;
    progress.context.currentStep = currentStep.previousStep;
    progress.lastActivityAt = new Date();

    return progress;
  }

  /**
   * Update wizard context data
   */
  updateContext(userId: string, wizardId: string, data: Record<string, unknown>): void {
    const progress = this.getProgress(userId, wizardId);
    if (!progress) {
      throw new Error('No wizard progress found');
    }

    progress.context.data = { ...progress.context.data, ...data };
    progress.lastActivityAt = new Date();
  }

  /**
   * Calculate completion percentage
   */
  private calculateCompletionPercentage(
    progress: WizardProgress,
    definition: WizardDefinition
  ): number {
    const totalSteps = definition.steps.length;
    const completedCount = progress.completedSteps.length;
    return Math.round((completedCount / totalSteps) * 100);
  }

  /**
   * Reset wizard progress
   */
  resetWizard(userId: string, wizardId: string): void {
    const progressKey = `${userId}:${wizardId}`;
    this.progress.delete(progressKey);
  }

  /**
   * Get all available wizards for a user
   */
  getAvailableWizards(
    userRole: string,
    skillLevel: 'beginner' | 'intermediate' | 'advanced'
  ): WizardDefinition[] {
    return Array.from(this.definitions.values()).filter(
      (def) => def.targetAudience.includes(skillLevel) || def.targetAudience.includes('all')
    );
  }

  /**
   * Get wizard suggestions based on user context
   */
  getSuggestedWizards(
    userRole: string,
    userGoals: string[],
    completedWizards: string[]
  ): WizardDefinition[] {
    const allWizards = Array.from(this.definitions.values());

    // Filter out completed wizards
    const incomplete = allWizards.filter((w) => !completedWizards.includes(w.id));

    // Score wizards based on relevance to user goals
    const scored = incomplete.map((wizard) => {
      let score = 0;

      // Check if wizard goal matches user goals
      for (const goal of userGoals) {
        if (wizard.goal.toLowerCase().includes(goal.toLowerCase())) {
          score += 10;
        }
      }

      // Check if wizard tags match user goals
      for (const goal of userGoals) {
        if (wizard.tags?.some((tag) => tag.toLowerCase().includes(goal.toLowerCase()))) {
          score += 5;
        }
      }

      return { wizard, score };
    });

    // Sort by score and return top wizards
    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.wizard)
      .slice(0, 5);
  }

  /**
   * Get all user progress
   */
  getUserProgress(userId: string): WizardProgress[] {
    const userProgress: WizardProgress[] = [];

    for (const [key, progress] of this.progress.entries()) {
      if (key.startsWith(`${userId}:`)) {
        userProgress.push(progress);
      }
    }

    return userProgress;
  }
}

/**
 * Wizard Factory
 * Helper to create wizard definitions
 */
export class WizardBuilder {
  private definition: Partial<WizardDefinition> = {
    steps: [],
    targetAudience: ['all'],
    tags: [],
  };

  constructor(id: string, name: string) {
    this.definition.id = id;
    this.definition.name = name;
  }

  description(desc: string): this {
    this.definition.description = desc;
    return this;
  }

  category(cat: string): this {
    this.definition.category = cat;
    return this;
  }

  goal(g: string): this {
    this.definition.goal = g;
    return this;
  }

  targetAudience(audience: ('beginner' | 'intermediate' | 'advanced' | 'all')[]): this {
    this.definition.targetAudience = audience;
    return this;
  }

  addStep(step: WizardStep): this {
    this.definition.steps!.push(step);
    return this;
  }

  estimatedTime(minutes: number): this {
    this.definition.estimatedTotalTime = minutes * 60;
    return this;
  }

  prerequisites(prereqs: string[]): this {
    this.definition.prerequisites = prereqs;
    return this;
  }

  outcomes(outcomes: string[]): this {
    this.definition.outcomes = outcomes;
    return this;
  }

  tags(tags: string[]): this {
    this.definition.tags = tags;
    return this;
  }

  build(): WizardDefinition {
    if (!this.definition.id || !this.definition.name || !this.definition.goal) {
      throw new Error('Wizard must have id, name, and goal');
    }

    if (!this.definition.steps || this.definition.steps.length === 0) {
      throw new Error('Wizard must have at least one step');
    }

    return this.definition as WizardDefinition;
  }
}
