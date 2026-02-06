import React from 'react';
import { OnboardingAdmin } from '../../components/admin/onboarding/OnboardingAdmin';

/**
 * Onboarding Admin Page
 *
 * This page provides access to the onboarding configuration settings
 * for administrators to customize the onboarding experience.
 */
const Onboarding: React.FC = () => {
  return (
    <div>
      <OnboardingAdmin />
    </div>
  );
};

export default Onboarding;
