import React from 'react';
import { OnboardingAdmin } from '../../components/admin/onboarding/OnboardingAdmin.js';
import { Box, Heading } from '@chakra-ui/react';

/**
 * Onboarding Admin Page
 * 
 * This page provides access to the onboarding configuration settings
 * for administrators to customize the onboarding experience.
 */
const Onboarding: React.FC = () => {
  return (
    <Box>
      <OnboardingAdmin />
    </Box>
  );
};

export default Onboarding;
