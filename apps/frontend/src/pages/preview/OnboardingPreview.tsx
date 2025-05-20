import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Center, Spinner, Text } from '@chakra-ui/react';
import { OnboardingWizard } from '../../components/wizard/OnboardingWizard.js';

/**
 * Onboarding Preview Page
 * 
 * This page provides a preview of the onboarding wizard for administrators
 * to test and validate the onboarding experience.
 */
const OnboardingPreview: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  
  // Get user type from URL params, default to 'human'
  const userType = searchParams.get('userType') || 'human';
  
  useEffect(() => {
    // Simulate loading configuration
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleComplete = (data: any) => {
    console.log('Onboarding completed with data:', data);
    // In a preview, we don't need to do anything with the data
    alert('Onboarding completed successfully! In a real environment, the user would be redirected to the dashboard.');
  };
  
  if (loading) {
    return (
      <Center minH="100vh">
        <Box textAlign="center">
          <Spinner size="xl" mb={4} />
          <Text>Loading onboarding preview...</Text>
        </Box>
      </Center>
    );
  }
  
  return (
    <Box minH="100vh" bg="gray.50" py={8}>
      <OnboardingWizard 
        userType={userType as 'human' | 'ai_agent'} 
        onComplete={handleComplete}
      />
    </Box>
  );
};

export default OnboardingPreview;
