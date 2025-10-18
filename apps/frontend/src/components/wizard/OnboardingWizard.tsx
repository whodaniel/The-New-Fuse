import React, { useState, useEffect } from 'react';
import { Button, Card } from '@the-new-fuse/ui-consolidated';
import { FiChevronLeft, FiChevronRight, FiCheck } from 'react-icons/fi';
import { useWizard } from './WizardProvider';
import { WelcomeStep } from './steps/WelcomeStep';
import { UserProfileStep } from './steps/UserProfileStep';
import { AIPreferencesStep } from './steps/AIPreferencesStep';
import { WorkspaceSetupStep } from './steps/WorkspaceSetupStep';
import { ToolsSelectionStep } from './steps/ToolsSelectionStep';
import { GreeterAgentStep } from './steps/GreeterAgentStep';
import { CompletionStep } from './steps/CompletionStep';

export interface OnboardingWizardProps {
  userType: 'human' | 'ai_agent' | 'unknown';
  onComplete: (userData: any) => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ userType, onComplete }) => {
  const { state, dispatch } = useWizard();
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  // Define steps based on user type
  const humanSteps = [
    { label: 'Welcome', component: WelcomeStep },
    { label: 'Your Profile', component: UserProfileStep },
    { label: 'AI Preferences', component: AIPreferencesStep },
    { label: 'Workspace Setup', component: WorkspaceSetupStep },
    { label: 'Tools & Integrations', component: ToolsSelectionStep },
    { label: 'Meet Your Assistant', component: GreeterAgentStep },
    { label: 'Complete', component: CompletionStep }
  ];

  const aiAgentSteps = [
    { label: 'Welcome', component: WelcomeStep },
    { label: 'Agent Profile', component: UserProfileStep },
    { label: 'Capabilities', component: AIPreferencesStep },
    { label: 'Integration Setup', component: WorkspaceSetupStep },
    { label: 'Complete', component: CompletionStep }
  ];

  // Select steps based on user type
  const steps = userType === 'ai_agent' ? aiAgentSteps : humanSteps;

  useEffect(() => {
    setActiveStep(state.currentStep);
  }, [state.currentStep]);

  useEffect(() => {
    // Initialize wizard session
    const initSession = async () => {
      setLoading(true);
      try {
        dispatch({ 
          type: 'INITIALIZE_SESSION', 
          payload: {
            userType,
            startTime: new Date(),
            data: {}
          }
        });
      } catch (error) {
        console.error('Failed to initialize wizard:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize onboarding wizard' });
      } finally {
        setLoading(false);
      }
    };

    if (!state.isInitialized) {
      initSession();
    }
  }, [dispatch, state.isInitialized, userType]);

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      dispatch({ type: 'SET_STEP', payload: activeStep + 1 });
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      dispatch({ type: 'SET_STEP', payload: activeStep - 1 });
    }
  };

  const handleComplete = () => {
    // Collect all data from the wizard state
    const userData = {
      ...state.session?.data,
      completedAt: new Date()
    };
    
    // Call the onComplete callback
    onComplete(userData);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const CurrentStepComponent = steps[activeStep]?.component || WelcomeStep;
  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === steps.length - 1;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Card className="rounded-lg shadow-md p-6">
        <h4 className="text-2xl font-bold mb-6 text-center">
          {userType === 'ai_agent' ? 'AI Agent Onboarding' : 'Welcome to The New Fuse'}
        </h4>

        {/* Custom Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index < activeStep 
                      ? 'bg-blue-500 text-white' 
                      : index === activeStep 
                        ? 'bg-blue-100 text-blue-600 border-2 border-blue-500' 
                        : 'bg-gray-200 text-gray-500'
                  }`}>
                    {index < activeStep ? (
                      <FiCheck className="w-4 h-4" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <span className="text-xs mt-1 text-center max-w-20">{step.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${
                    index < activeStep ? 'bg-blue-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <CurrentStepComponent />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            {!isFirstStep && (
              <Button 
                onClick={handleBack}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <FiChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>
            )}
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Step {activeStep + 1} of {steps.length}
            </p>
          </div>
          
          <div className="text-right">
            {isLastStep ? (
              <Button 
                onClick={handleComplete}
              >
                Complete
              </Button>
            ) : (
              <Button 
                onClick={handleNext}
                className="flex items-center space-x-2"
              >
                <span>Next</span>
                <FiChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
