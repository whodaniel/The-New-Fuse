import React, { useState } from 'react';
import { Box, Container } from '@chakra-ui/react';
import { UserTypeDetection } from '../../components/onboarding/UserTypeDetection.js';
import { OnboardingWizard } from '../../components/wizard/OnboardingWizard.js';
import { WizardProvider } from '../../components/wizard/WizardProvider.js';
import { useNavigate } from 'react-router-dom';

export const OnboardingFlow: React.FC = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<'human' | 'ai_agent' | 'unknown' | null>(null);

  const handleDetectionComplete = (detectedUserType: 'human' | 'ai_agent' | 'unknown') => {
    setUserType(detectedUserType);
  };

  const handleOnboardingComplete = (userData: any) => {
    console.log(`${userType === 'ai_agent' ? 'AI agent' : 'Human'} onboarding complete:`, userData);

    // Navigate to the appropriate page based on user type
    if (userType === 'ai_agent') {
      navigate('/ai-portal');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      {userType === null ? (
        <Box bg="white" borderRadius="lg" boxShadow="md" p={6}>
          <UserTypeDetection onDetectionComplete={handleDetectionComplete} />
        </Box>
      ) : (
        <WizardProvider>
          <OnboardingWizard
            userType={userType}
            onComplete={handleOnboardingComplete}
          />
        </WizardProvider>
      )}
    </Container>
  );
};
