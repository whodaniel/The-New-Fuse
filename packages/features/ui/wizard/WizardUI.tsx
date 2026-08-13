/**
 * Wizard UI Components
 *
 * React components for rendering wizard flows
 */

import React, { useEffect, useState } from 'react';
import { WizardDefinition, WizardProgress, WizardStateManager, WizardStep } from './WizardSystem.js';

export interface WizardUIProps {
  wizard: WizardDefinition;
  userId: string;
  userRole: string;
  stateManager: WizardStateManager;
  onComplete?: (progress: WizardProgress) => void;
  onCancel?: () => void;
}

/**
 * Main Wizard Component
 */
export const Wizard: React.FC<WizardUIProps> = ({
  wizard,
  userId,
  userRole,
  stateManager,
  onComplete,
  onCancel,
}) => {
  const [progress, setProgress] = useState<WizardProgress | null>(null);
  const [currentStep, setCurrentStep] = useState<WizardStep | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    // Initialize or resume wizard
    let wizardProgress = stateManager.getProgress(userId, wizard.id);

    if (!wizardProgress) {
      wizardProgress = stateManager.startWizard(wizard.id, userId, userRole);
    }

    setProgress(wizardProgress);
    updateCurrentStep(wizardProgress);
  }, [wizard.id, userId, userRole]);

  const updateCurrentStep = (wizardProgress: WizardProgress) => {
    const step = stateManager.getCurrentStep(userId, wizard.id);
    setCurrentStep(step);
  };

  const handleNext = async () => {
    if (!progress) return;

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
    } catch (error) {
      setValidationErrors([error instanceof Error ? error.message : 'Unknown error']);
    } finally {
      setIsValidating(false);
    }
  };

  const handlePrevious = () => {
    if (!progress) return;

    try {
      const newProgress = stateManager.previous(userId, wizard.id);
      setProgress(newProgress);
      updateCurrentStep(newProgress);
    } catch (error) {
      console.error('Cannot go to previous step:', error);
    }
  };

  const handleSkip = async () => {
    if (!progress) return;

    try {
      const newProgress = await stateManager.skip(userId, wizard.id);
      setProgress(newProgress);
      updateCurrentStep(newProgress);
    } catch (error) {
      setValidationErrors([error instanceof Error ? error.message : 'Cannot skip this step']);
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to exit this wizard? Your progress will be saved.')) {
      onCancel?.();
    }
  };

  const updateContext = (data: Record<string, unknown>) => {
    stateManager.updateContext(userId, wizard.id, data);
  };

  if (!progress || !currentStep) {
    return <div className="wizard-loading">Loading wizard...</div>;
  }

  return (
    <div className="wizard-container">
      <WizardHeader wizard={wizard} progress={progress} onCancel={handleCancel} />

      <WizardProgress
        current={progress.completedSteps.length + 1}
        total={wizard.steps.length}
        percentage={progress.completionPercentage}
      />

      <WizardStepContent
        step={currentStep}
        context={progress.context}
        onDataChange={updateContext}
        validationErrors={validationErrors}
      />

      <WizardNavigation
        canGoPrevious={!!currentStep.previousStep}
        canSkip={currentStep.canSkip || false}
        isValidating={isValidating}
        isLastStep={!currentStep.nextStep}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onSkip={handleSkip}
      />
    </div>
  );
};

/**
 * Wizard Header
 */
interface WizardHeaderProps {
  wizard: WizardDefinition;
  progress: WizardProgress;
  onCancel: () => void;
}

const WizardHeader: React.FC<WizardHeaderProps> = ({ wizard, progress, onCancel }) => {
  return (
    <div className="wizard-header">
      <div className="wizard-header-content">
        <h1 className="wizard-title">{wizard.name}</h1>
        <p className="wizard-description">{wizard.description}</p>

        {wizard.estimatedTotalTime && (
          <div className="wizard-time-estimate">
            <span className="icon">⏱️</span>
            <span>Estimated time: {Math.ceil(wizard.estimatedTotalTime / 60)} minutes</span>
            {progress.estimatedTimeRemaining && (
              <span className="time-remaining">
                {' '}
                ({Math.ceil(progress.estimatedTimeRemaining / 60)} min remaining)
              </span>
            )}
          </div>
        )}
      </div>

      <button className="wizard-cancel-btn" onClick={onCancel} title="Exit wizard">
        ✕
      </button>
    </div>
  );
};

/**
 * Wizard Progress Indicator
 */
interface WizardProgressProps {
  current: number;
  total: number;
  percentage: number;
}

const WizardProgress: React.FC<WizardProgressProps> = ({ current, total, percentage }) => {
  return (
    <div className="wizard-progress">
      <div className="wizard-progress-bar">
        <div className="wizard-progress-fill" style={{ width: `${percentage}%` }} />
      </div>

      <div className="wizard-progress-text">
        Step {current} of {total} ({percentage}%)
      </div>
    </div>
  );
};

/**
 * Wizard Step Content
 */
interface WizardStepContentProps {
  step: WizardStep;
  context: any;
  onDataChange: (data: Record<string, unknown>) => void;
  validationErrors: string[];
}

const WizardStepContent: React.FC<WizardStepContentProps> = ({
  step,
  context,
  onDataChange,
  validationErrors,
}) => {
  return (
    <div className="wizard-step-content">
      <div className="wizard-step-header">
        <h2 className="wizard-step-title">{step.title}</h2>
        <p className="wizard-step-description">{step.description}</p>

        {step.estimatedTime && (
          <div className="wizard-step-time">
            <span className="icon">⏱️</span>
            <span>{Math.ceil(step.estimatedTime / 60)} min</span>
          </div>
        )}
      </div>

      {validationErrors.length > 0 && (
        <div className="wizard-validation-errors">
          <div className="error-icon">⚠️</div>
          <div className="error-messages">
            {validationErrors.map((error, index) => (
              <div key={index} className="error-message">
                {error}
              </div>
            ))}
          </div>
        </div>
      )}

      {step.helpText && (
        <div className="wizard-help-text">
          <span className="help-icon">💡</span>
          <span>{step.helpText}</span>
        </div>
      )}

      {step.tips && step.tips.length > 0 && (
        <div className="wizard-tips">
          <div className="tips-header">Tips:</div>
          <ul className="tips-list">
            {step.tips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {step.requirements && step.requirements.length > 0 && (
        <div className="wizard-requirements">
          <div className="requirements-header">Requirements:</div>
          <ul className="requirements-list">
            {step.requirements.map((req, index) => (
              <li key={index}>{req}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Dynamic component rendering based on step.component */}
      <div className="wizard-step-component">
        {/* Component will be dynamically loaded based on step.component */}
        <DynamicStepComponent
          componentName={step.component}
          context={context}
          onDataChange={onDataChange}
        />
      </div>
    </div>
  );
};

/**
 * Dynamic Step Component Loader
 */
interface DynamicStepComponentProps {
  componentName?: string;
  context: any;
  onDataChange: (data: Record<string, unknown>) => void;
}

const DynamicStepComponent: React.FC<DynamicStepComponentProps> = ({
  componentName,
  context,
  onDataChange,
}) => {
  if (!componentName) {
    return (
      <div className="default-step-component">
        <p>Complete this step to continue.</p>
        <button onClick={() => onDataChange({ stepCompleted: true })}>Mark as Complete</button>
      </div>
    );
  }

  // In a real implementation, this would dynamically import the component
  // For now, we'll show a placeholder
  return (
    <div className="step-component-placeholder">
      <p>Component: {componentName}</p>
      <p>This is where the {componentName} component would be rendered.</p>
      <button onClick={() => onDataChange({ componentData: 'sample' })}>Update Step Data</button>
    </div>
  );
};

/**
 * Wizard Navigation
 */
interface WizardNavigationProps {
  canGoPrevious: boolean;
  canSkip: boolean;
  isValidating: boolean;
  isLastStep: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSkip: () => void;
}

const WizardNavigation: React.FC<WizardNavigationProps> = ({
  canGoPrevious,
  canSkip,
  isValidating,
  isLastStep,
  onPrevious,
  onNext,
  onSkip,
}) => {
  return (
    <div className="wizard-navigation">
      <div className="wizard-nav-left">
        {canGoPrevious && (
          <button className="wizard-btn wizard-btn-secondary" onClick={onPrevious}>
            ← Previous
          </button>
        )}
      </div>

      <div className="wizard-nav-right">
        {canSkip && (
          <button className="wizard-btn wizard-btn-text" onClick={onSkip} disabled={isValidating}>
            Skip
          </button>
        )}

        <button className="wizard-btn wizard-btn-primary" onClick={onNext} disabled={isValidating}>
          {isValidating ? (
            <>
              <span className="spinner">⏳</span> Validating...
            </>
          ) : isLastStep ? (
            'Complete'
          ) : (
            'Next →'
          )}
        </button>
      </div>
    </div>
  );
};

/**
 * Wizard List - Show available wizards
 */
export interface WizardListProps {
  wizards: WizardDefinition[];
  onSelectWizard: (wizard: WizardDefinition) => void;
  userProgress?: WizardProgress[];
}

export const WizardList: React.FC<WizardListProps> = ({
  wizards,
  onSelectWizard,
  userProgress = [],
}) => {
  const getWizardProgress = (wizardId: string): WizardProgress | undefined => {
    return userProgress.find((p) => p.wizardId === wizardId);
  };

  return (
    <div className="wizard-list">
      <h2 className="wizard-list-title">Available Guides</h2>

      <div className="wizard-cards">
        {wizards.map((wizard) => {
          const progress = getWizardProgress(wizard.id);

          return (
            <div key={wizard.id} className="wizard-card" onClick={() => onSelectWizard(wizard)}>
              <div className="wizard-card-header">
                <h3 className="wizard-card-title">{wizard.name}</h3>
                <span className="wizard-card-category">{wizard.category}</span>
              </div>

              <p className="wizard-card-description">{wizard.description}</p>

              {wizard.estimatedTotalTime && (
                <div className="wizard-card-meta">
                  <span className="icon">⏱️</span>
                  <span>{Math.ceil(wizard.estimatedTotalTime / 60)} min</span>
                </div>
              )}

              {wizard.tags && (
                <div className="wizard-card-tags">
                  {wizard.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="wizard-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {progress && (
                <div className="wizard-card-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${progress.completionPercentage}%` }}
                    />
                  </div>
                  <span className="progress-text">{progress.completionPercentage}% complete</span>
                </div>
              )}

              <button className="wizard-card-btn">{progress ? 'Continue' : 'Start'} →</button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Wizard;
