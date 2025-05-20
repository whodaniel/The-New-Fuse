import React, { useState, useEffect } from 'react';
import { Box, Heading, Text, Spinner, Alert, AlertIcon, VStack, HStack, Progress } from '@chakra-ui/react';
import axios from 'axios';

interface UserTypeDetectionProps {
  onDetectionComplete: (userType: 'human' | 'ai_agent' | 'unknown') => void;
}

export const UserTypeDetection: React.FC<UserTypeDetectionProps> = ({ onDetectionComplete }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detectionSteps, setDetectionSteps] = useState([
    { name: 'Analyzing connection', complete: false },
    { name: 'Checking authentication method', complete: false },
    { name: 'Analyzing request patterns', complete: false },
    { name: 'Determining user type', complete: false }
  ]);

  useEffect(() => {
    const detectUserType = async () => {
      try {
        // Update first step
        setDetectionSteps(prev => {
          const updated = [...prev];
          updated[0].complete = true;
          return updated;
        });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Update second step
        setDetectionSteps(prev => {
          const updated = [...prev];
          updated[1].complete = true;
          return updated;
        });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Make API call to detect user type
        const response = await axios.post('/api/onboarding/start');
        
        // Update third step
        setDetectionSteps(prev => {
          const updated = [...prev];
          updated[2].complete = true;
          return updated;
        });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Update fourth step
        setDetectionSteps(prev => {
          const updated = [...prev];
          updated[3].complete = true;
          return updated;
        });
        
        // Small delay for visual feedback
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Call the callback with the detected user type
        onDetectionComplete(response.data.userType);
      } catch (err) {
        console.error('Error detecting user type:', err);
        setError('Failed to detect user type. Please try again.');
        
        // Default to human if detection fails
        onDetectionComplete('human');
      } finally {
        setLoading(false);
      }
    };

    // Use simulation for demo
    // const simulateDetection = async () => {
    //   try {
    //     // Update first step
    //     setDetectionSteps(prev => {
    //       const updated = [...prev];
    //       updated[0].complete = true;
    //       return updated;
    //     });
        
    //     await new Promise(resolve => setTimeout(resolve, 800));
        
    //     // Update second step
    //     setDetectionSteps(prev => {
    //       const updated = [...prev];
    //       updated[1].complete = true;
    //       return updated;
    //     });
        
    //     await new Promise(resolve => setTimeout(resolve, 800));
        
    //     // Update third step
    //     setDetectionSteps(prev => {
    //       const updated = [...prev];
    //       updated[2].complete = true;
    //       return updated;
    //     });
        
    //     await new Promise(resolve => setTimeout(resolve, 800));
        
    //     // Update fourth step
    //     setDetectionSteps(prev => {
    //       const updated = [...prev];
    //       updated[3].complete = true;
    //       return updated;
    //     });
        
    //     // Small delay for visual feedback
    //     await new Promise(resolve => setTimeout(resolve, 800));
        
    //     // For demo purposes, randomly select user type with bias toward human
    //     const userType = Math.random() > 0.8 ? 'ai_agent' : 'human';
    //     onDetectionComplete(userType);
    //   } catch (err) {
    //     console.error('Error in simulation:', err);
    //     setError('Failed to detect user type. Please try again.');
        
    //     // Default to human if detection fails
    //     onDetectionComplete('human');
    //   } finally {
    //     setLoading(false);
    //   }
    // };

    // Use simulation for demo
    // simulateDetection();
    
    // Use real detection in production
    detectUserType();
  }, [onDetectionComplete]);

  const completedSteps = detectionSteps.filter(step => step.complete).length;
  const progressValue = (completedSteps / detectionSteps.length) * 100;

  return (
    <Box maxW="600px" mx="auto" p={6} textAlign="center">
      <Heading mb={6}>Detecting User Type</Heading>
      
      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}
      
      <Progress value={progressValue} mb={8} />
      
      <VStack spacing={4} align="start" mb={6}>
        {detectionSteps.map((step, index) => (
          <HStack key={index}>
            {step.complete ? (
              <Box color="green.500">✓</Box>
            ) : (
              index === detectionSteps.findIndex(s => !s.complete) ? (
                <Spinner size="sm" />
              ) : (
                <Box>○</Box>
              )
            )}
            <Text color={step.complete ? 'green.500' : 'gray.500'}>
              {step.name}
            </Text>
          </HStack>
        ))}
      </VStack>
      
      <Text>
        {loading
          ? 'Please wait while we analyze your connection...'
          : 'Detection complete. Redirecting to appropriate onboarding flow...'}
      </Text>
    </Box>
  );
};
