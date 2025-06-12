import React, { useState, useEffect } from 'react';
import { Box, Stepper, Step, Button, Container, Grid, CircularProgress, Heading, Text, StepIndicator, StepStatus, StepTitle, StepDescription, StepIcon, StepNumber, useSteps } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { Card } from '@/components/ui/card';
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
  const { activeStep, setActiveStep } = useSteps({
    index: state.currentStep,
    count: steps.length,
  });

  useEffect(() => {
    setActiveStep(state.currentStep);
  }, [state.currentStep, setActiveStep]);

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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const CurrentStepComponent = steps[activeStep]?.component || WelcomeStep;
  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === steps.length - 1;

  return (
    <Container maxW="container.lg" py={8}>
      <Card borderRadius="lg" boxShadow="md" p={6}>
        <Heading as="h4" size="lg" mb={6} textAlign="center" fontWeight="bold">
          {userType === 'ai_agent' ? 'AI Agent Onboarding' : 'Welcome to The New Fuse'}
        </Heading>

        <Stepper index={activeStep} mb={8}>
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepIndicator>
                <StepStatus
                  complete={<StepIcon />}
                  incomplete={<StepNumber />}
                  active={<StepNumber />}
                />
              </StepIndicator>
              <Box flexShrink="0">
                <StepTitle>{step.label}</StepTitle>
                {/* You can add StepDescription here if needed */}
              </Box>
            </Step>
          ))}
        </Stepper>

        <Box mb={6}>
          <CurrentStepComponent />
        </Box>

        <Grid templateColumns="repeat(3, 1fr)" gap={4}>
          <Box>
            {!isFirstStep && (
              <Button 
                leftIcon={<ChevronLeftIcon />} 
                onClick={handleBack}
                variant="outline"
              >
                Back
              </Button>
            )}
          </Box>
          
          <Box textAlign="center">
            <Text fontSize="sm" color="gray.500">
              Step {activeStep + 1} of {steps.length}
            </Text>
          </Box>
          
          <Box textAlign="right">
            {isLastStep ? (
              <Button 
                colorScheme="blue" 
                onClick={handleComplete}
              >
                Complete
              </Button>
            ) : (
              <Button 
                rightIcon={<ChevronRightIcon />} 
                onClick={handleNext}
                colorScheme="blue"
              >
                Next
              </Button>
            )}
          </Box>
        </Grid>
      </Card>
    </Container>
  );
};
