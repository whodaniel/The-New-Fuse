import React, { useState, useEffect } from 'react';
import { Box, Stepper, Step, StepLabel, Typography, Button, Paper, Container, Grid, CircularProgress } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { useWizard } from './WizardProvider.js';
import { WelcomeStep } from './steps/WelcomeStep.js';
import { UserProfileStep } from './steps/UserProfileStep.js';
import { AIPreferencesStep } from './steps/AIPreferencesStep.js';
import { WorkspaceSetupStep } from './steps/WorkspaceSetupStep.js';
import { ToolsSelectionStep } from './steps/ToolsSelectionStep.js';
import { GreeterAgentStep } from './steps/GreeterAgentStep.js';
import { CompletionStep } from './steps/CompletionStep.js';

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
    if (state.currentStep < steps.length - 1) {
      dispatch({ type: 'SET_STEP', payload: state.currentStep + 1 });
    }
  };

  const handleBack = () => {
    if (state.currentStep > 0) {
      dispatch({ type: 'SET_STEP', payload: state.currentStep - 1 });
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

  const CurrentStepComponent = steps[state.currentStep]?.component || WelcomeStep;
  const isFirstStep = state.currentStep === 0;
  const isLastStep = state.currentStep === steps.length - 1;

  return (
    <Container maxW="container.lg" py={8}>
      <Paper borderRadius="lg" boxShadow="md" p={6}>
        <Typography variant="h4" mb={6} textAlign="center" fontWeight="bold">
          {userType === 'ai_agent' ? 'AI Agent Onboarding' : 'Welcome to The New Fuse'}
        </Typography>

        <Stepper activeStep={state.currentStep} mb={8}>
          {steps.map((step, index) => (
            <Step key={step.label} completed={index < state.currentStep}>
              <StepLabel>{step.label}</StepLabel>
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
            <Typography variant="body2" color="gray.500">
              Step {state.currentStep + 1} of {steps.length}
            </Typography>
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
      </Paper>
    </Container>
  );
};
