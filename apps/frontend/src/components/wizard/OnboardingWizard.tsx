import { GlassCard, PremiumButton } from '@/components/ui/premium';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useWizard } from './WizardProvider';
import { AIPreferencesStep } from './steps/AIPreferencesStep';
import { CompletionStep } from './steps/CompletionStep';
import { GreeterAgentStep } from './steps/GreeterAgentStep';
import { ToolsSelectionStep } from './steps/ToolsSelectionStep';
import { UserProfileStep } from './steps/UserProfileStep';
import { WelcomeStep } from './steps/WelcomeStep';
import { WorkspaceSetupStep } from './steps/WorkspaceSetupStep';

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
    { label: 'Complete', component: CompletionStep },
  ];

  const aiAgentSteps = [
    { label: 'Welcome', component: WelcomeStep },
    { label: 'Agent Profile', component: UserProfileStep },
    { label: 'Capabilities', component: AIPreferencesStep },
    { label: 'Integration Setup', component: WorkspaceSetupStep },
    { label: 'Complete', component: CompletionStep },
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
            data: {},
          },
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
      completedAt: new Date(),
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
      <GlassCard className="p-4" gradient="blue">
        <h4 className="text-2xl font-bold mb-8 text-center text-white">
          {userType === 'ai_agent' ? 'AI Agent Onboarding' : 'Welcome to The New Fuse'}
        </h4>

        {/* Custom Stepper */}
        <div className="mb-10 px-4">
          <div className="flex items-center justify-between relative">
            {/* Connecting Lines Layer */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 -translate-y-1/2 -z-10 px-3">
              <div className="w-full h-full bg-gray-800 rounded-full" />
            </div>

            {steps.map((step, index) => (
              <div key={step.label} className="relative z-10 flex flex-col items-center group">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                    index < activeStep
                      ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]'
                      : index === activeStep
                        ? 'bg-gray-900 border-blue-400 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-110'
                        : 'bg-gray-900 border-gray-700 text-muted-foreground'
                  }`}
                >
                  {index < activeStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-bold">{index + 1}</span>
                  )}
                </div>

                {/* Connector Line Progress */}
                {index < steps.length - 1 && (
                  <div
                    className={`absolute top-1/2 left-1/2 h-0.5 w-full -z-20 transition-all duration-500 ${
                      index < activeStep ? 'bg-blue-600' : 'bg-transparent'
                    }`}
                    style={{ left: '50%', width: '100%' }}
                  />
                )}

                <div
                  className={`absolute top-12 whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                    index === activeStep
                      ? 'text-white bg-blue-500/10 border border-blue-500/20 opacity-100 translate-y-0'
                      : 'text-muted-foreground opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
                  }`}
                >
                  {step.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8 min-h-[400px]">
          <CurrentStepComponent />
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-white/10">
          <div>
            {!isFirstStep && (
              <PremiumButton onClick={handleBack} variant="outline" icon={ChevronLeft}>
                Back
              </PremiumButton>
            )}
          </div>

          <div className="text-center hidden md:block">
            <p className="text-sm text-gray-400">
              Step <span className="text-white font-bold">{activeStep + 1}</span> of {steps.length}
            </p>
          </div>

          <div>
            {isLastStep ? (
              <PremiumButton
                onClick={handleComplete}
                variant="gradient"
                size="lg"
                icon={Check}
                iconPosition="right"
              >
                Complete Setup
              </PremiumButton>
            ) : (
              <PremiumButton
                onClick={handleNext}
                variant="gradient"
                icon={ChevronRight}
                iconPosition="right"
              >
                Next Step
              </PremiumButton>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
